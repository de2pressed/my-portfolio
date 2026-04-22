# Review Workflow

## Purpose
This workflow activates a structured, layered code review mode that covers every dimension of code quality in priority order. A review conducted under this workflow is not a skim — it is a systematic audit that produces actionable, severity-labeled feedback on correctness, security, performance, maintainability, and style. Use `/review` whenever reviewing a PR, auditing a module before it ships, or evaluating code quality on any piece of logic that matters.

---

## Phase 1 — Understand the Intent

Before evaluating a single line, establish what the code is supposed to do. Read any PR description, task brief, or contextual information provided. If none is provided, infer the intent from the code itself and state that inference explicitly — confirming the intent before critiquing the implementation prevents misaligned feedback. A review that judges code against the wrong objective is not useful.

---

## Phase 2 — Read Everything Before Commenting on Anything

Read all files in scope completely before writing any feedback. Do not comment on the first function before reading the last one. Patterns, relationships, and dependencies that affect whether something is a problem often only become visible after reading the full scope. A reviewer who comments on file one before reading file five will frequently raise issues that are addressed in file five, wasting everyone's time.

---

## Phase 3 — Correctness Review

This is the only layer that can produce a hard block on shipping. Work through the following questions for every function and code path in scope.

Does the code do what it claims to do? Read the implementation against its stated intent — not what the developer says it does, but what it actually does when executed line by line. These are often different things.

Are all inputs validated before use? Assume every external input can be null, undefined, empty, malformed, or adversarial. Trace exactly what happens when it is. Any code path that reaches an unchecked assumption is a latent crash or a security vulnerability.

Are all conditional branches handled? For every if-else, switch, or pattern match, confirm that every possible case is explicitly addressed. An unhandled branch is a production incident waiting for the right input to trigger it.

Are all async operations correctly awaited? A missing await is a race condition. Trace every async call and confirm it is properly awaited and that its error case is handled at the right layer.

Does this change break any existing behavior? Identify every caller, consumer, and dependent of the modified code and trace whether the change affects them. No change is isolated — it always has callers.

---

## Phase 4 — Security Review

Any finding in this layer is a BLOCKER regardless of how unlikely exploitation seems. Low-probability vulnerabilities in production systems are eventually exploited.

Check for hardcoded secrets, API keys, tokens, or credentials anywhere in the code or configuration. There is no safe place to hardcode a secret.

Check for user-controlled input used in database queries, shell commands, file paths, HTML output, or template expressions without parameterization or sanitization. Injection vulnerabilities are the most common class of serious production breach.

Check for authentication or authorization checks that can be bypassed through unexpected inputs, missing middleware, or incorrect ordering of guards.

Check for sensitive data appearing in logs, error responses visible to clients, or unencrypted storage.

Check for insecure defaults: open CORS policies, disabled certificate validation, permissive file permissions, debug modes that could reach production.

---

## Phase 5 — Performance Review

These findings are SHOULDs — they should be addressed before production but may not block a ship depending on scale and context.

Identify N+1 query patterns: database or API calls made inside loops where a single batched call would do. This is the most common and most impactful backend performance issue.

Identify synchronous blocking operations in async contexts: file reads, heavy computations, or external calls that should be async or offloaded.

Identify components or functions that recompute expensive results on every call when the inputs rarely change and memoization would be appropriate.

Identify unbounded data fetching: queries or API calls with no pagination, limit, or filter that will degrade as data volume grows.

Identify memory leaks: event listeners, subscriptions, intervals, or timers created without cleanup.

---

## Phase 6 — Maintainability Review

These findings affect the long-term health of the codebase. They do not break code today but create compounding costs over time.

Flag functions doing more than one thing. Single responsibility is not a theoretical ideal — it is what makes individual pieces of logic testable, replaceable, and understandable in isolation.

Flag duplicated logic that should be extracted into a shared utility. Every duplicate is a future divergence — one copy will be updated and the other will not.

Flag naming that does not accurately reflect what the code actually does. Misleading names are worse than generic names because they actively create incorrect mental models.

Flag deep nesting that obscures logical flow. More than three levels of nesting is a signal that early returns, extracted functions, or restructured logic would make the intent clearer.

Flag tight coupling between modules that should be independent.

---

## Phase 7 — Style and Convention Review

These are the lowest priority and should never be treated as equivalent to correctness or security findings. Only raise style issues when they represent a genuine deviation from the established conventions of the codebase — not personal preferences.

Flag naming convention inconsistencies with the rest of the codebase. Consistency within a codebase matters more than which convention was chosen.

Flag dead code: commented-out blocks, unused imports, unreachable branches.

Flag organizational inconsistencies with the established file and module structure.

---

## Phase 8 — Produce Structured Feedback

Every piece of feedback must include three components: what the issue is, why it matters in concrete terms, and what the specific fix should be. Feedback that identifies a problem without suggesting a resolution is a complaint, not a review.

Label every finding with one of three severity levels. BLOCKER means the code must not ship until this is fixed. CONCERN means this will likely cause a problem in production and should be fixed before ship. SUGGESTION means this is worth addressing for long-term quality but does not affect correctness or immediate production safety.

Group feedback by review layer, not by file. A developer reading grouped feedback understands what class of problems exist. A developer reading file-by-file feedback loses the systemic patterns.

End the review with a one-paragraph overall assessment: what is the general quality of the code, what are the most important things to address, and what is genuinely well done. Feedback without acknowledgment of what works is demoralizing and less actionable than balanced feedback.

---

## Activation
Triggered by `/review`. The text following the trigger identifies the code or files to be reviewed. Process through all eight phases in order. Do not skip any layer.