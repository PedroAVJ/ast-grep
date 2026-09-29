# Repository guidance

- This repository is the canonical source for the public `ast-grep` plugin in both Codex and Claude Code.
- Keep `package.json`, `.codex-plugin/plugin.json`, and `.claude-plugin/plugin.json` versions aligned.
- Keep the CLI read-only: no source edits, rewrites, renames, formatting, or deployment.
- Pin runtime dependencies in `server.json` and `runtime/package-lock.json`. Never commit installed runtimes, `node_modules`, credentials, or private project names and paths.
- ast-grep shares runtime helpers with the sibling language-server plugins but owns its search command.
- Run `npm test`, `CODE_NAV_LIVE_TEST=1 npm test` when the runtime is installed, `claude plugin validate .`, and `git diff --check` before release.
- Release through both Package Manager catalogs and verify installation in Codex and Claude.
