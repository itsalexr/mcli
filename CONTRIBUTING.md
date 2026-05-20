# Contributing

Thanks for taking the time to contribute.

## The flow

1. **Open an issue first** — describe the bug or feature before writing any code. This avoids duplicate work and lets us align on the approach.

2. **Fork the repo** and create a branch off `main`.

3. **Make your fix or change**, keeping it scoped to what the issue describes.

4. **Open a pull request** that references the issue:
   ```
   Fixes #<issue-number>
   ```
   GitHub will link them automatically and close the issue when the PR merges.

## Guidelines

- Keep PRs small and focused — one issue per PR.
- Run the tests before submitting: `npm test`
- If adding a new command, add a test in `tests/`.

## Reporting bugs

If something's broken and you're not up for fixing it yourself, [open an issue](https://github.com/itsalexr/mcli/issues) with steps to reproduce and what you expected to happen.
