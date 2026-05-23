# Demo_01

Demo_01 是一个面向浏览器的原创肩后视角生存动作游戏原型，用于验证移动、瞄准、射击、敌人压迫和资源管理的核心手感。

## 当前状态

- 项目类型：Web 3D 游戏原型
- 主要产物：浏览器可玩的原创肩后视角生存动作原型
- 当前阶段：first-playable-prototype
- 默认分支：`main`（计划；当前目录尚未初始化 git 仓库）

更多交接信息见 [docs/project-state.md](docs/project-state.md)。

## 当前能力

- Three.js 程序化 3D 场景、灯光、雾效和封闭试炼场。
- 肩后视角摄像机、键盘移动、鼠标瞄准、射击、装填和闪避。
- 敌人逐波生成、追击玩家、近身攻击，可被射击消灭。
- 弹药、治疗补给、生命、体力、分数、波次和威胁 HUD。
- 死亡后可重新部署。

本项目只做原创生存动作类型原型，不复刻 RE4/Capcom 的角色、剧情、关卡、UI、音效、商标或美术资产。

## 本地运行

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

打开开发服务器显示的本地地址即可试玩，通常是 `http://127.0.0.1:5173/`。

## 验证

最快可信验证：

```powershell
npm run build
```

完整检查：

```powershell
npm run build
npm run dev -- --host 127.0.0.1
```

完整检查还需要在浏览器中确认首屏 3D 画面、HUD、移动、瞄准、射击、敌人波次和死亡重开流程。

## 架构

架构边界、目录职责和核心数据流见 [docs/architecture.md](docs/architecture.md)。

关键接口、数据结构和模块契约见 [docs/interfaces.md](docs/interfaces.md)。

技术栈决策见 [docs/decisions/0001-game-tech-stack.md](docs/decisions/0001-game-tech-stack.md)。

## 环境变量

N/A。当前原型不需要环境变量，也不需要 secrets。

## 项目宪法

- [AGENTS.md](AGENTS.md)：所有 agent 必读的最高规则源
- [.vibe-starter-gpt.json](.vibe-starter-gpt.json)：宪法版本和安装元信息
- [docs/project-state.md](docs/project-state.md)：当前状态和跨 agent 交接
- [docs/architecture.md](docs/architecture.md)：架构与目录职责
- [docs/interfaces.md](docs/interfaces.md)：接口和契约
- [docs/debt.md](docs/debt.md)：技术债和临时方案
- [docs/decisions/](docs/decisions/)：ADR 决策记录
- [specs/](specs/)：功能规格工作流
- [CHANGELOG.md](CHANGELOG.md)：用户可见变化
