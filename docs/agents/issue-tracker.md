# Issue Tracker: GitHub

Issues and specifications for this repository live in GitHub Issues. Use the `gh` CLI for all operations and infer the repository from the current Git remote.

## Conventions

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open`
- Comment: `gh issue comment <number> --body "..."`
- Add or remove labels with `gh issue edit`
- Close: `gh issue close <number> --comment "..."`
- Use JSON output and `jq` when structured issue data is needed.

## Pull requests as a request surface

PRs as a request surface: no.

## Publishing and fetching

When a skill says “publish to the issue tracker,” create a GitHub issue.

When a skill says “fetch the relevant ticket,” read the corresponding GitHub issue and its comments.

## Wayfinding

A wayfinding map is represented by one GitHub issue, with related work represented by child issues.

- Label maps with `wayfinder:map`.
- Label child issues with `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`.
- Prefer GitHub sub-issues and native issue dependencies.
- If unavailable, use task lists and `Blocked by: #<number>` references.
- Claim work by assigning the issue to the current user.
- Resolve work by posting the result, closing the child issue, and recording the decision on the map.
