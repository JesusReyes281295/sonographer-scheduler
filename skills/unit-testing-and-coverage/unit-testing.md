---
name: unit-testing
description: Analyzes the project, recommends a testing stack (NUnit/xUnit, FluentAssertions, Jest/Vitest, pytest, etc.), identifies untested code, and guides the user toward higher meaningful coverage.
type: skill
audience: agent
---

# Skill: Unit Test Creation & Coverage

You are helping the user create unit tests and increase **meaningful** coverage in their project.

## When to use this skill

- The user says: "use @unittesting", "add tests to my project", "what's not tested?", "improve my coverage".

## Phase 1 — Analyze the project

1. Detect the stack and whether tests already exist (`*Tests.csproj`, `__tests__/`, `*.spec.ts`, `tests/`, `conftest.py`...).
2. **If tests exist:** read 2–3 of them and adopt their conventions (framework, naming, structure, mocking library). Never introduce a second framework alongside an existing one without asking.
3. **If no tests exist:** recommend a stack based on the language:

| Stack | Test framework | Assertions | Mocking |
|---|---|---|---|
| .NET / C# | xUnit (or NUnit if user prefers) | FluentAssertions | Moq / NSubstitute |
| Node / TS | Vitest (or Jest for older setups) | built-in expect | vi.mock / jest.mock |
| Python | pytest | built-in assert | unittest.mock / pytest-mock |
| Java | JUnit 5 | AssertJ | Mockito |
| Go | testing + testify | testify/assert | interfaces + fakes |

4. Map what is untested. Priority order for finding gaps:
   1. Business logic / use cases / services (highest value).
   2. Validators, mappers, calculators (pure functions — easiest wins).
   3. Controllers/handlers (test only routing/status-code behavior, keep thin).
   4. Skip: DTOs, auto-generated code, framework config.

If a coverage tool is available (`coverlet`, `vitest --coverage`, `pytest --cov`, `go test -cover`), run it and use real numbers instead of guessing.

## Phase 2 — Report the gap

Present a table before writing anything:

```
| Area / class | Current coverage | Risk | Priority |
|---|---|---|---|
| OrderService.CalculateTotal | none | high (money) | 1 |
| CustomerValidator | none | medium | 2 |
| OrdersController | partial | low | 3 |
```

Ask the user which priorities to tackle (default: top 3).

## Phase 3 — Write tests

Rules for every test you write:

- **Naming:** `MethodName_Scenario_ExpectedResult` (C#/Java) or `describe/it` sentences ("returns 404 when the order does not exist").
- **AAA structure:** Arrange / Act / Assert, visually separated.
- **One behavior per test.** Multiple asserts are fine only if they verify the same behavior.
- **Test cases per method:** happy path + edge cases (null/empty, boundaries, invalid input) + error path (exceptions).
- **Mock only external boundaries** (DB, HTTP, clock, filesystem). Do not mock the class under test's own value objects.
- **Deterministic:** no real time, random, network, or shared state. Inject `IClock`/fake timers when time matters.
- Use parameterized tests (`[Theory]`/`test.each`/`@pytest.mark.parametrize`) for input tables.

If code is untestable (static calls, `new` inside methods, hidden dependencies), propose the minimal refactor first (extract interface, inject dependency) and get approval before changing production code.

## Phase 4 — Verify and report

1. Run the test suite; all new tests must pass.
2. Re-run coverage if available and show before → after.
3. Report: tests added, behaviors now covered, remaining gaps, and next targets.

## Anti-patterns to refuse

- Tests that assert implementation details (private methods, exact call counts without behavioral meaning).
- Chasing 100% coverage on trivial code while business logic stays untested.
- Snapshot-testing everything as a substitute for behavioral assertions.
