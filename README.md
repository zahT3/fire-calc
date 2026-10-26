# 你需要多少钱，才能财富自由？

[English](README.en.md)

一个按 B 站「小Lin说」视频《[你需要多少钱，才能财富自由？](https://www.bilibili.com/video/BV1yUHP6rEYD/)》里的公式做的计算器。回答 4 个问题，算出你自己的数。

- 在线使用：https://zaht3.github.io/fire-calc/
- 计算全部在你的设备上完成，不上传任何数据，没有统计和埋点。

## 公式

```
财富自由临界值 = 480 × 月开销 + 每孩成本 × 孩子数 + 一辈子医疗 + 买房
```

| 项 | 含义 |
|---|---|
| 月开销 X | 理想生活每月花多少，不含养孩子、看病、买房；一直租房的话含房租 |
| 每孩成本 K × 孩子数 n | 每个孩子从今天到 18 岁还要留多少 |
| 医疗 M | 从今天起一辈子的医疗费预留 |
| 住房 H | 打算买房的预算；已有房或租房为 0 |

480 = 12 ÷ 2.5%。2.5% 是"实际回报"：长期投资回报 4.5% 减去长期通胀 2%。含义是：不工作，本金扣掉通胀后也不缩水。回报和通胀可以在结果页调整；回报不高于通胀时，这个公式没有答案，工具会直接说明。

"我现在有多少"会按你能拿来投资的钱（不含自住房）点亮方格，并反算每月大约能花多少。

这是视频里的简化模型：没有考虑投资波动、税、费用和不同年龄的开销变化。结果只是估算，**不构成投资建议**。

## 参考值来源

| 参考值 | 来源 |
|---|---|
| 全国人均消费 2,456 元/月、城镇 2,990 元/月 | [国家统计局：2025 年居民收入和消费支出情况](https://www.stats.gov.cn/sj/zxfb/202601/t20260119_1962321.html)（年度值 ÷ 12） |
| 每孩从备孕到 18 岁约 58 万 | [育娲人口智库：中国生育成本报告 2026](https://file.c-ctrip.com/files/6/yuwa/0R74p12000smu5mcx984C.pdf)（2024 年数据） |
| 医疗一辈子约 20 万；二线 15–30 万、一线 30–60 万 | 视频里的粗略估算，区间未找到原始出处 |

## 命令行

```bash
npm install
npm run build:cli

# 逐题提问
node dist/cli/main.js

# 直接给参数（金额：月开销按元，其余按万元）
node dist/cli/main.js --x 15000 --kids 2 --k 150 --m 150 --housing buy --h 700

# 反算：现有 600 万每月能花多少
node dist/cli/main.js --x 10000 --kids 1 --k 70 --m 50 --housing rent --assets 600

# 机器可读输出
node dist/cli/main.js --x 15000 --kids 0 --m 50 --housing own --json
```

`--return`、`--inflation` 调整假设（百分数），`--lang en` 输出英文，`--help` 查看全部参数。

## 本地开发

```bash
npm install
npm run dev          # 网页开发服务器
npm test             # 单元测试 + 命令行测试
npm run typecheck
npx playwright test  # 端到端测试（手机 Chromium / 手机 WebKit / 电脑）
npm run build        # 输出到 dist/web
```

代码结构：`src/core` 是不依赖页面的计算核心，网页（`src/web`）和命令行（`src/cli`）都只调用它；地区参考值在 `src/regions`，中英文案在 `src/i18n`。

## 许可

MIT。公式出自上面的视频，页面和代码不包含视频的画面或文字。
