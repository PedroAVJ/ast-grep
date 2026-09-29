# ast-grep

Batch structural code searches with compact results to reduce model round trips.

## Install

From the [Package Manager](https://github.com/PedroAVJ/package-manager) marketplace:

```sh
codex plugin add ast-grep@package-manager
claude plugin install ast-grep@package-manager
```

Self-contained plugin for Codex and Claude Code: both client manifests, skill-exposed CLI. No MCP daemon/editor extension required.

- Setup: `node scripts/setup.mjs`
- Usage: `node scripts/query.mjs --help`
- Tests: `npm test`
- [Agent instructions](skills/structural-search/SKILL.md)
- [Upstream project/documentation](https://ast-grep.github.io/guide/quick-start.html)

Dependencies are pinned in server.json and runtime/package-lock.json (C# uses a pinned .NET tool). Runtime dependencies stay outside the plugin archive. Query wrappers do not send code to external services or models; setup contacts package registries. This is not a sandbox: language servers read dependencies and evaluate trusted project configuration. Project tests are still required.

The sibling language-server plugins intentionally vendor the same small read-only LSP CLI to stay independently installable. Maintain `common.mjs`, `setup.mjs`, and `query.mjs` consistently across them; never add a cache-path dependency. ast-grep shares runtime helpers but owns its search command.

Objective: replace repeated model-driven searches/reads with one deterministic bounded batch. Actual task-level response/cost savings have not been benchmarked.

## License

First-party source is MIT licensed; see [LICENSE](LICENSE). Runtime language tools are downloaded from npm at setup and keep their own licenses; see [third-party notices](THIRD_PARTY_NOTICES.md) and [icon provenance](ICON-SOURCES.md).
