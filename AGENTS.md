# AGENTS.md

# Repository-Specific Instructions

## Project layout

- `src`: the main source code of the SDK, which is published as the `@ambulancewa/linxio-js` package on npm.
- `dist`: the compiled output of the SDK, which is published to npm and used by downstream applications.
- `docs`: documentation for the SDK, including the README and any additional markdown files (fumadocs).
- `sources`: the Linxio javascript sources, used for inferring types, extracting endpoints, and other code analysis tasks.
- `scripts`: development and deployment utility scripts for the repository.

## Commands

- Install dependencies with `pnpm install`.
- Run formatting with `pnpm format`.

## Repository-specific rules

- Prioritise performance, security, developer experience, and reliability in all code changes.
- Do not add production dependencies without justification.
- Commit each major coherent change using Conventional Commits in accordance with the below instructions.

## Repository Contribution Instructions

These instructions apply to all automated coding agents working in this repository, including Codex and similar agentic development tools.

## Git Commit Expectations

After each major change, the agent must commit the completed changes to the GitHub repository.

A “major change” includes, but is not limited to:

- Adding, removing, or materially changing application functionality.
- Refactoring a meaningful area of the codebase.
- Updating configuration, build tooling, deployment logic, or package structure.
- Adding or materially changing tests.
- Implementing a requested feature, fix, or task milestone.

Minor exploratory edits, temporary debugging changes, or work-in-progress changes do not need to be committed until they form part of a coherent completed change.

## Commit Message Format

All commits must use the Conventional Commits format:

```text
<type>(<scope>): <brief description>
```

Examples:

```text
feat(sdk): add support for new authentication flow
fix(sdk): resolve type inference issue with endpoint responses
refactor(sdk): simplify role permission checks
chore(repo): update dependency lockfile
test(sdk): add coverage for login redirects
fix(docs): resolve broken links in README
release: build version 1.2.30
```

## Scoping Rules

Where a change only affects a particular app, package, service, or logical area, the commit message must include an appropriate scope.

Preferred scope examples:

```text
src
docs
infra
```

For example:

```text
feat(src): add new caching layer for API responses
fix(src): prevent modal focus trap regression
chore(infra): update docker compose healthchecks
```

If a change is repository-wide and no narrower scope is appropriate, use a broad scope such as:

```text
chore(repo): update workspace configuration
refactor(repo): standardise linting rules
```

## Commit Hygiene

Before committing, the agent should make reasonable efforts to ensure that:

- The change is complete and coherent.
- Formatting has been applied where applicable.
- Relevant tests, type checks, or lint checks have been run where practical.
- Temporary files, debug statements, and unrelated edits are not included.
- The commit contains only the files relevant to the completed change.

## Agent Behaviour

Agents should treat committing as part of the normal completion process for substantial repository changes.

Unless explicitly instructed otherwise, agents should not leave completed major changes uncommitted.