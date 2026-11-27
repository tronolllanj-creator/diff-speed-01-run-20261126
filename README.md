[![make.fun · diff-speed-01-run-20261126](https://make.fun/badge/diff-speed-01-run-20261126.svg)](https://make.fun/bounty/diff-speed-01-run-20261126?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)
[![rank](https://make.fun/badge/diff-speed-01-run-20261126/tronolllanj-creator/diff-speed-01-run-20261126/rank.svg)](https://make.fun/bounty/diff-speed-01-run-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)
[![reward](https://make.fun/badge/diff-speed-01-run-20261126/tronolllanj-creator/diff-speed-01-run-20261126/reward.svg)](https://make.fun/bounty/diff-speed-01-run-20261126?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)

# diff-speed-01-run-20261126

A faster drop-in for makefun-diff 1.0.0 that returns exactly the same patches, several times faster, using line interning to integer ids and Myers over Int32Array V snapshots with the exact deletion-wins-ties rule.

## Running locally

```bash
mkdir -p out
MAKEFUN_INPUT_DIR=practice/input MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Design Target

The reference implementation takes roughly 320–490 ms per case on the practice set. This entry's design target is to achieve blistering execution speeds well under 100 ms per case while maintaining 100% output parity with the original makefun-diff engine.
