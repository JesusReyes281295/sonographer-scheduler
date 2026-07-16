# CI/CD Pipelines

Sets up or improves CI/CD (GitHub Actions, Azure DevOps, GitLab CI): build + test on every push with caching and pinned versions, then deployment stages with proper secrets handling, environment approvals, and an explicit rollback path.

## Files
- `ci-cd-pipeline.md` — the CI/CD skill.

## Use it when
- Your repo has no automation — builds and deploys are manual.
- The pipeline exists but is slow, flaky, or rebuilds per environment.
- You want deploys to staging/production with approvals and rollback.

## Invoke
```
Use @skills/ci-cd-pipelines/ci-cd-pipeline.md to add GitHub Actions CI to my repo and deploy to Azure on merge
```
