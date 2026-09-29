---
name: structural-search
description: Batch structural code searches with compact results to reduce model round trips. Use for AST-shaped searches, not ordinary text search.
---

# ast-grep

Use for code shapes: calls, declarations, nesting, and repeated patterns across languages. Use rg for literal text/filenames and LSP for semantic references/types.

## Reduce model round trips

Collect related lookup questions into one batch (1–20 queries). Batch multiple patterns or languages together. Read relevant bodies afterward only if needed. Do not repeat broad searches when results answer the question. This reduces lookup turns, not necessary reasoning, tests or verification. Do not claim measured savings without a benchmark.

Set PLUGIN_ROOT to this skill's plugin directory (two levels above this SKILL.md). Use the loaded location, not a hard-coded cache version.

```sh
node "$PLUGIN_ROOT/scripts/query.mjs" --root /absolute/project --queries '[{"op":"search","lang":"typescript","pattern":"$OBJ.$METHOD($$$ARGS)","paths":["src"]},{"op":"search","lang":"typescript","kind":"function_declaration","paths":["src"]}]' --limit 20
```

Queries require op=search, lang, and exactly one of pattern or kind. Optional paths (default ["."]) and strictness.

JSON results use --limit (default 40, maximum 200) and text caps. Check truncated/omitted indicators; narrow or increase the limit only when omitted results matter. Unsupported, timed-out, unresolved and not-received are not evidence of absence. Exit 1 means at least one query failed; successful entries remain usable.

Read-only wrapper: no rewrite/apply flags. Respects ignores, excludes dependency/generated directories, does not follow directory symlinks, and uses two search threads. AST matches are not type-aware references. SQL/configuration text here generally remains ordinary rg search. Single-quote JSON to protect $ metavariables from shell expansion.

## Runtime

If the runtime is missing, run once:

```sh
node "$PLUGIN_ROOT/scripts/setup.mjs"
```

Setup downloads pinned packages into ~/.local/share/code-navigation, outside the target repository; no global tools or model API calls. Requires Node 20+ and npm. Queries never download packages automatically. Each search has --timeout (default 90000 ms). Servers may read local dependencies and evaluate configuration; use only trusted workspaces. No automatic source edits, rename, formatting, deployment, or production access.

