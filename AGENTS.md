# AGENTS.md

> 任何 coding agent（Codex / Claude Code / Cursor / Aider / 其他）开工前必须读完此文件。
> 本文件是项目最高宪法源，优先级高于任何工具特定配置。
>
> 目标：让项目在变大、变久、换人、换 agent 时仍然保持良好的软件工程秩序。

---

## 1. 项目定位

Demo_01 是一个面向浏览器的原创肩后视角生存动作游戏原型，用于验证移动、瞄准、射击、敌人压迫和资源管理的核心手感。

### 非目标

- 不复刻或使用 RE4/Capcom 的角色、剧情、关卡、UI、音效、商标或美术资产。
- 第一阶段不做多人联机、账号系统、云存档、遥测、排行榜或商业级 3A 资产管线。
- 不为了“看起来高级”提前引入大型框架、后端服务或复杂编辑器。

---

## 2. 项目事实

| 项 | 内容 |
|---|---|
| 项目类型 | Web 3D 游戏原型 |
| 主要语言/运行时 | JavaScript ES Modules / Node 24 / npm 11 / Browser WebGL |
| 主要产物 | 浏览器可玩的原创肩后视角生存动作原型 |
| 安装命令 | `npm install` |
| 运行命令 | `npm run dev -- --host 127.0.0.1` |
| 构建命令 | `npm run build` |
| 最快可信验证 | `npm run build` |
| 完整验证 | `npm run build` + 浏览器手动试玩 |
| 默认分支 | `main`（计划；当前目录尚未初始化 git 仓库） |

**重要**：不要默认切换技术栈。当前第一版技术栈由 ADR-0001 记录；如果要改 Unity / Unreal / Godot / 其他引擎，先写新 ADR。

---

## 3. 架构边界

### 顶层目录职责

```text
.
├── index.html                         # 游戏 HTML 入口和 HUD 容器
├── package.json                       # npm 脚本和依赖声明
├── package-lock.json                  # 锁定依赖版本
├── src/                               # 游戏源码、样式和 Three.js 逻辑
├── AGENTS.md                          # 项目最高宪法源
├── CLAUDE.md                          # Claude Code 入口，只转发到 AGENTS.md
├── CHANGELOG.md                       # 用户可见变化记录
├── README.md                          # 项目入口说明
├── .vibe-starter-gpt.json             # 宪法安装元信息
├── .editorconfig                      # 基础格式约定
├── .gitignore                         # 忽略规则
├── lefthook.yml                       # 可选本地质量门禁模板
├── .github/                           # PR 模板与 CI 模板
├── docs/                              # 架构、状态、接口、技术债、ADR
└── specs/                             # 功能规格工作流
```

### 模块边界

| 模块 / 目录 | 职责 | 可以依赖 | 禁止依赖 |
|---|---|---|---|
| `src/` | 游戏循环、输入、渲染、HUD 样式、敌人和玩家状态 | `three`、浏览器 Web API | 不直接引入后端、遥测、第三方素材或未记录的新依赖 |
| `index.html` | 页面入口、Canvas 和 HUD 容器 | `src/main.js` | 不承载大量游戏逻辑 |
| `docs/` | 长期项目事实、架构、接口、债务、决策记录 | AGENTS.md 中的规则 | 不能记录未确认事实 |
| `specs/` | 新功能规格和验收标准 | docs/decisions/、docs/interfaces.md | 不能替代实际验证 |
| `.github/` | PR 与 CI 协作模板 | AGENTS.md、项目验证命令 | 不能写入 secrets |

### 稳定契约

- npm 脚本：`npm install`、`npm run dev -- --host 127.0.0.1`、`npm run build`。
- 游戏入口：`index.html` 加载 `/src/main.js`。
- Canvas 入口：页面必须提供 `#game-canvas`。
- HUD DOM 契约：`#health-meter`、`#stamina-meter`、`#wave-value`、`#threat-value`、`#ammo-value`、`#reserve-value`、`#score-value`。
- 详情维护在 `docs/interfaces.md`。

---

## 4. 红线（绝不能违反）

红线是 agent 行为的硬约束。每条用 `R<编号>` 命名，PR 模板必须引用相关红线。

### 4.1 范围红线

| ID | 禁止项 | 原因 / 替代方案 |
|---|---|---|
| R1 | 不允许复制、复刻或使用 RE4/Capcom 的角色、剧情、关卡、UI、音效、商标或美术资产 | 降低版权和品牌混淆风险；只能做原创生存动作类型原型 |
| R2 | 不允许默认加入联网、账号、云存档、遥测、广告或排行榜 | 第一版只验证本地单人核心玩法；如确需加入，先写 spec 和 ADR |

### 4.2 工程红线

| ID | 规则 |
|---|---|
| R10 | 不允许跳过或伪造验证结果；如果验证命令待定，必须明确说明。 |
| R11 | 新增依赖必须说明原因、替代方案和维护代价。 |
| R12 | 改架构、接口、数据模型或部署方式必须写 ADR。 |

### 4.3 事实与内容红线

| ID | 规则 |
|---|---|
| R20 | 不编造数据、引用、客户、指标、外部来源或项目事实。 |
| R21 | 不提交 secrets、token、私钥、真实 `.env` 或凭据。 |

---

## 5. 变更流程

### 5.1 开工前

1. 读 `AGENTS.md`。
2. 读 `docs/project-state.md`，了解当前状态和交接信息。
3. 读 `README.md`、`docs/architecture.md`、`CHANGELOG.md`。
4. 根据任务读取相关 spec、ADR、接口文档和技术债记录。
5. 开工前向用户复述：当前理解、涉及文件、风险、验证方式，给出 3-6 条计划。

### 5.2 做变更时

- 小改可以直接改，但仍要验证。
- 新功能先写 `specs/active/<slug>.md`。
- 架构、依赖、数据模型、接口契约、部署方式变化必须写 ADR。
- 临时方案必须写入 `docs/debt.md`，说明清理条件。
- 用户可见变化必须更新 `CHANGELOG.md`。

### 5.3 交付前

- 运行 `npm run build`，或说明为什么无法运行。
- 检查红线是否触碰。
- 搜索并确认没有未解释的临时文件、死代码、重复实现。
- 如有未完成事项，写入 `docs/project-state.md` 或 `docs/debt.md`。

---

## 6. Git 与协作

### Commit

- 使用 Conventional Commits：`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:` / `style:` / `perf:` / `build:` / `ci:` / `revert:`。
- 中文/英文都可以，但格式必须清楚。

### 分支策略

| 改动类型 | 走法 |
|---|---|
| 文档、小修、单点 bugfix | 可直接在当前分支处理 |
| 新功能、重构、跨多个模块、架构变化 | 建分支 -> PR -> 合并 |

默认分支：`main`。

### PR

- 必填 `.github/PULL_REQUEST_TEMPLATE.md`。
- CI 或验证不过不能合并。
- 涉及决策的 PR 必须附 ADR。

---

## 7. 质量门槛

每次交付前至少完成：

- [ ] 最快可信验证通过：`npm run build`
- [ ] 如有测试，测试通过：N/A（当前无测试框架）
- [ ] 如有构建，构建通过：`npm run build`
- [ ] 红线未违反（参考 §4）
- [ ] 用户可见变化已写 `CHANGELOG.md`
- [ ] 重大决策已写 ADR
- [ ] 临时方案已写 `docs/debt.md`
- [ ] `docs/project-state.md` 已更新到下一位 agent 能接手

如果某项无法完成，必须在交付说明里明确写出原因和风险。

---

## 8. 本地运行

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

环境变量规则：

- 不提交 secrets、token、私钥或真实 `.env`。
- 当前原型不需要环境变量；如果后续需要，维护 `.env.example` 或等价说明。
- 需要 secrets 时，请用户通过环境变量或安全 secret store 提供。

---

## 9. 跨 Agent 交接

任何新 agent 接手时，按以下顺序读：

1. `AGENTS.md`
2. `docs/project-state.md`
3. `README.md`
4. `docs/architecture.md`
5. `docs/interfaces.md`
6. `CHANGELOG.md`
7. 任务相关 spec / ADR / debt 记录

工具特定入口只做转发，不复制规则：

- `CLAUDE.md` 指向本文。
- Cursor rules 应指向本文。
- Codex 项目说明或 skill 应指向本文。

如果这些入口与本文冲突，以本文为准。

---

## 10. 不确定时的默认行为

| ID | 情境 | 默认动作 |
|---|---|---|
| D1 | 不确定是否要加功能 | 不加，先问用户 |
| D2 | 不确定技术栈/库/API 是否存在或适用 | 查 repo、查官方文档或问用户 |
| D3 | 不确定事实是否准确 | 标注不确定，不编造 |
| D4 | 发现旧代码看起来不理想 | 先理解原因，不顺手重构 |
| D5 | 想新增依赖 | 先说明必要性、替代方案、维护代价 |
| D6 | 想改架构边界 | 先写 ADR 或提出 ADR 草案 |

---

## 11. 文档索引

| 文件 | 作用 |
|---|---|
| `README.md` | 项目入口、运行方式、当前能力 |
| `.vibe-starter-gpt.json` | 宪法版本和安装元信息 |
| `docs/project-state.md` | 当前状态和跨 agent 交接 |
| `docs/architecture.md` | 架构与目录职责 |
| `docs/interfaces.md` | 接口和契约 |
| `docs/debt.md` | 技术债和临时方案 |
| `docs/decisions/` | ADR，记录重大决策 |
| `specs/` | 功能规格工作流 |
| `CHANGELOG.md` | 用户可见变化 |

---

## 12. 完成后的汇报格式

交付时用简洁中文说明：

- 改了什么。
- 改了哪些文件。
- 跑了什么验证，结果如何。
- 哪些风险、债务或待确认事项已记录在哪里。
