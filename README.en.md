# How much money do you need to be financially free?

[中文](README.md)

A calculator built on the formula from the Bilibili video "[How much money do you need to be financially free?](https://www.bilibili.com/video/BV1yUHP6rEYD/)" by Xiao Lin Shuo. Answer 4 questions and get your own number.

- Live: https://zaht3.github.io/fire-calc/
- Everything runs on your device. Nothing is uploaded; no analytics.

The English version translates the interface only. Amounts are in CNY and the reference values are Chinese data.

## The formula

```
Target = 480 × monthly spending + cost per kid × kids + lifetime healthcare + home
```

480 = 12 ÷ 2.5%, where 2.5% is the real return: a 4.5% long-run investment return minus 2% inflation. The idea: stop working and keep the principal's purchasing power forever. Both numbers can be changed on the result page; if the return does not beat inflation, the formula has no answer and the tool says so.

"How much do I have?" lights up the board by your investable assets (excluding the home you live in) and estimates how much you could spend each month.

This is the video's simplified model. It ignores volatility, taxes, fees and changing spending with age. It is an estimate, **not investment advice**.

## Command line

```bash
npm install && npm run build:cli
node dist/cli/main.js                     # interactive
node dist/cli/main.js --x 15000 --kids 2 --k 150 --m 150 --housing buy --h 700 --lang en
node dist/cli/main.js --help
```

Monthly spending is in CNY; the other amounts are in units of 10,000 CNY.

## Development

```bash
npm install
npm run dev
npm test && npm run typecheck && npx playwright test
npm run build
```

`src/core` holds the calculation with no DOM dependency; the web app (`src/web`) and CLI (`src/cli`) both use it.

## License

MIT. The formula comes from the video above; this project contains none of its footage or text.
