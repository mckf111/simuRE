# Branch Protection Setup

> 记录 GitHub 分支保护建议。当前目录尚未初始化 git 仓库，也没有确认远程 GitHub 仓库地址；以下步骤需等仓库创建后再执行。

## 当前状态

- Git 仓库：待初始化
- GitHub 远程仓库：待确认
- 计划默认分支：`main`
- CI 工作流：`.github/workflows/ci.yml`

## 建议规则

仓库创建并推送到 GitHub 后，进入：

```text
https://github.com/<GITHUB_ORG>/<GITHUB_REPO>/settings/branches
```

添加针对 `main` 的保护规则：

- Require a pull request before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Require linear history（可选）
- Include administrators（团队确认后再开）

## 必需检查

当前 CI 会运行：

- `Project validation`：`npm ci` + `npm run build`
- `Commit messages`：PR commit subject 必须符合 Conventional Commits
- `CHANGELOG updated for feat/fix`：用户可见 feat/fix 需要更新 `CHANGELOG.md`

## 注意

- 不要在 GitHub Actions、PR 模板或仓库设置里写入 secrets。
- 如果默认分支不是 `main`，先更新 `AGENTS.md`、`README.md`、CI 和本文。
