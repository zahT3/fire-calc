import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const run = (args: string[], lang = 'zh_CN.UTF-8') =>
  execFileSync('node', ['dist/cli/main.js', ...args], {
    cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NO_COLOR: '1', LANG: lang, LC_ALL: '' },
  });

const video = ['--x', '15000', '--kids', '2', '--k', '150', '--m', '150', '--housing', 'buy', '--h', '700'];

beforeAll(() => {
  execSync('npm run build:cli', { cwd: root, stdio: 'ignore' });
}, 60_000);

test('参数直出：1870 万，带竖式和方格', () => {
  const out = run(video);
  expect(out).toContain('1,870 万');
  expect(out).toContain('480X');
  expect(out).toContain('187 格');
  expect(out).toContain('■');
});

test('--json', () => {
  const j = JSON.parse(run([...video, '--json']));
  expect(j.total).toBe(18_700_000);
  expect(j.multiplier).toBe(480);
  expect(j.cells).toBe(187);
});

test('反算：600 万 → 每月 10,000', () => {
  const j = JSON.parse(run(['--x', '10000', '--kids', '1', '--k', '70', '--m', '50', '--housing', 'rent', '--assets', '600', '--json']));
  expect(j.affordable.monthly).toBeCloseTo(10000, 6);
  expect(run(['--x', '10000', '--kids', '1', '--k', '70', '--m', '50', '--housing', 'rent', '--assets', '600'])).toContain('¥10,000');
});

test('非法参数退出码 2 并指明字段', () => {
  try {
    run(['--x', 'abc']);
    throw new Error('should have failed');
  } catch (e) {
    const err = e as { status: number; stderr: string };
    expect(err.status).toBe(2);
    expect(err.stderr).toMatch(/--x/);
    expect(err.stderr).toContain('这不像一个数字');
  }
});

test('非交互时缺参数给出提示', () => {
  try {
    run(['--x', '15000']);
    throw new Error('should have failed');
  } catch (e) {
    const err = e as { status: number; stderr: string };
    expect(err.status).toBe(2);
    expect(err.stderr).toMatch(/--kids/);
  }
});

test('回报 ≤ 通胀给出说明', () => {
  expect(run([...video, '--return', '2'])).toMatch(/花完|runs out/);
  expect(JSON.parse(run([...video, '--return', '2', '--json'])).error).toBe('non-positive-real-return');
});

test('英文输出', () => {
  const out = run([...video, '--lang', 'en']);
  expect(out).toContain('¥18.7M');
  expect(out).toContain('Based on China data');
});

test('--help', () => {
  expect(run(['--help'])).toMatch(/--x/);
});

// macOS 的 script 用来提供伪终端；其他平台参数不同，跳过
test.runIf(process.platform === 'darwin')('交互中按 Ctrl+D 安静退出，不打印堆栈', () => {
  let out = '';
  let status = 0;
  try {
    out = execSync(`printf '' | script -q /dev/null node dist/cli/main.js`, {
      cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', LANG: 'zh_CN.UTF-8' }, timeout: 10_000,
    });
  } catch (e) {
    const err = e as { status: number; stdout: string };
    out = err.stdout;
    status = err.status;
  }
  expect(out).not.toContain('AbortError');
  expect(out).not.toContain('node:internal');
  expect(status).not.toBe(0);
});
