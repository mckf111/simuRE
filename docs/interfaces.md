# Interfaces

> 记录项目中不应被随意改动的契约。包括 API、命令行参数、数据结构、文件格式、事件、数据库 schema 等。

## 稳定契约索引

| 名称 | 类型 | 所有者 | 兼容性要求 | 文档位置 |
|---|---|---|---|---|
| 项目宪法入口 | 文档契约 | 项目维护者 | 新 agent 必须先读 `AGENTS.md` | `AGENTS.md` |
| 项目状态交接 | 文档契约 | 项目维护者 | 任何未完成事项必须写入 | `docs/project-state.md` |
| 本地安装命令 | 命令契约 | 项目维护者 | 应保持 `npm install` 可用 | `package.json` / `README.md` |
| 本地运行命令 | 命令契约 | 项目维护者 | 应保持 `npm run dev -- --host 127.0.0.1` 可用 | `package.json` / `README.md` |
| 最快可信验证 | 命令契约 | 项目维护者 | 交付前优先运行 `npm run build` | `package.json` / `README.md` |
| 游戏 HTML 入口 | 文件契约 | 游戏客户端 | `index.html` 必须加载 `/src/main.js` | `index.html` |
| Canvas DOM | DOM 契约 | 游戏客户端 | 必须提供 `#game-canvas` | `index.html` |
| HUD DOM | DOM 契约 | 游戏客户端 | 生命、体力、波次、威胁、弹药、分数 ID 不能无迁移地删除 | `index.html` |

## HUD DOM 契约

当前 `src/main.js` 直接读取以下 DOM 节点：

| ID | 含义 |
|---|---|
| `game-canvas` | Three.js 渲染 Canvas |
| `health-meter` | 生命条填充 |
| `stamina-meter` | 体力条填充 |
| `wave-value` | 当前波次 |
| `threat-value` | 存活和待生成敌人数量 |
| `ammo-value` | 当前弹匣弹药 |
| `reserve-value` | 备用弹药 |
| `score-value` | 当前分数 |
| `reticle` | 准星 |
| `toast` | 短状态提示 |
| `start-overlay` | 开始/重开覆盖层 |
| `start-button` | 开始/重开按钮 |

## 游戏状态契约

第一版游戏状态只存在于浏览器内存中，不持久化到文件、数据库或网络服务。主要状态包括：

- `player`：位置、速度、朝向、生命、体力、弹药、装填、闪避和短暂无敌。
- `state`：运行状态、波次、待生成敌人、分数、屏幕震动。
- `enemies`：敌人位置、生命、速度、攻击计时、硬直。
- `supplies`：补给类型、位置、生命周期。

## 变更规则

- 改动稳定契约前必须说明兼容性影响。
- 破坏性变更必须写 ADR。
- 如果已有外部用户或下游模块，必须给迁移路径。
- 不确定某契约是否稳定时，先问用户或在 ADR 中明确。
