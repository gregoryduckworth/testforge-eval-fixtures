# testforge-eval-fixtures

Pull request targets for TestForge's benchmark (`pnpm eval` in
[test-forge](https://github.com/gregoryduckworth/test-forge), `scripts/eval/`).

The eval commits each fixture in `scripts/eval/fixtures/` on a branch named after its content,
`fixture/<name>-<hash>`, and pushes it here, so a benchmark run opens a real pull request (and runs
the fixture's CI) against a base that never moves. A fixture with a history also gets a branch for
each commit it names, such as `fixture/regression-orders-<hash>-good`.

The fixture branches and the `testforge/*` branches of the runs' pull requests are disposable: an eval
pushes again whatever it needs. Issues here are findings the `flaky` and `regression` runs filed; leave
them open, so the next run comments on them instead of filing again.

This branch holds only this README.
