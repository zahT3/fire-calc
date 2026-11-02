# How much money do you need to be financially free?

[中文](README.md) · **English**

<p align="center"><img src="docs/demo.gif" width="320" alt="Demo: answer four questions and watch the cards break into the grid"></p>

A calculator built on the formula from the Bilibili video "[How much money do you need to be financially free?](https://www.bilibili.com/video/BV1yUHP6rEYD/)" by Xiao Lin Shuo (小Lin说). Answer 4 questions and get your own number.

- Live: https://zaht3.github.io/fire-calc/
- Everything runs on your device. Nothing is uploaded; no analytics or tracking.

The English version translates the interface only. Amounts are in CNY and the reference values are Chinese data.

## The formula

```
Target = 480 × monthly spending + cost per kid × kids + lifetime healthcare + home
```

| Term | Meaning |
|---|---|
| Monthly spending X | What your ideal life costs per month, excluding kids, healthcare and buying a home; include rent if you plan to rent for good |
| Cost per kid K × kids n | How much each kid still needs from today until age 18 |
| Healthcare M | Healthcare costs set aside for the rest of your life |
| Home H | Budget for buying a home; 0 if you already own one or rent |

480 = 12 ÷ 2.5%. 2.5% is the real return: a 4.5% long-run investment return minus 2% long-run inflation. The idea: stop working and the principal still keeps its purchasing power after inflation. Return and inflation can be changed on the result page; if the return does not beat inflation, the formula has no answer and the tool says so.

"How much do I have?" lights up the grid by your investable assets (excluding the home you live in) and estimates how much you could spend each month.

This is the video's simplified model. It ignores investment volatility, taxes, fees and spending that changes with age. The result is an estimate, **not investment advice**.

## Reference values

| Value | Source |
|---|---|
| Average consumer spending: 2,456 CNY/month nationwide, 2,990 CNY/month urban | [National Bureau of Statistics of China: 2025 household income and consumption](https://www.stats.gov.cn/sj/zxfb/202601/t20260119_1962321.html) (annual figure ÷ 12) |
| About 580,000 CNY per kid from pregnancy to 18 | [YuWa Population Research: China Fertility Cost Report 2026](https://file.c-ctrip.com/files/6/yuwa/0R74p12000smu5mcx984C.pdf) (2024 data) |
| About 200,000 CNY lifetime healthcare; 150,000–300,000 in second-tier cities, 300,000–600,000 in first-tier | Rough estimate from the video; no original source found for the ranges |

## Command line

```bash
npm install
npm run build:cli

# Ask question by question
node dist/cli/main.js

# Pass arguments directly (monthly spending in CNY, everything else in units of 10,000 CNY)
node dist/cli/main.js --x 15000 --kids 2 --k 150 --m 150 --housing buy --h 700 --lang en

# Reverse: how much can 6 million CNY support each month
node dist/cli/main.js --x 10000 --kids 1 --k 70 --m 50 --housing rent --assets 600 --lang en

# Machine-readable output
node dist/cli/main.js --x 15000 --kids 0 --m 50 --housing own --json
```

`--return` and `--inflation` change the assumptions (in percent), `--lang en` prints English, `--help` lists every option.

## Development

```bash
npm install
npm run dev          # web dev server
npm test             # unit tests + CLI tests
npm run typecheck
npx playwright test  # end-to-end tests (mobile Chromium / mobile WebKit / desktop)
npm run build        # outputs to dist/web
```

Layout: `src/core` is the calculation core with no DOM dependency; the web app (`src/web`) and CLI (`src/cli`) only call into it. Regional reference values live in `src/regions`, Chinese and English copy in `src/i18n`.

## License

MIT. The formula comes from the video above; the pages and code contain none of its footage or text.
