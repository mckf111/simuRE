# Specs

> 功能规格目录。**新功能开工前先在 `active/` 写 spec**，用 `_template.md` 起草。

## 目录结构

```text
specs/
├── _template.md     # spec 起草模板，复制后改名使用
├── active/          # 进行中（drafting / in-progress）
└── done/            # 已交付（done）+ 历史归档
```

## 何时写 spec

- 任何用户能感知的功能改动。
- 任何跨 3 个文件以上的修改。
- 任何引出 ADR 的工作。
- 任何可能改变外部行为、输出格式、接口契约或维护方式的修改。

修单字、改注释、改文案或非常局部的整理通常不需要。

## 工作流

1. **起草**：`cp specs/_template.md specs/active/<feature-slug>.md`，填写。
2. **执行**：用户审完 spec 后开干。验收标准就是 agent 的“完成定义”。
3. **归档**：feature 验收通过后 `git mv specs/active/<slug>.md specs/done/<slug>.md`。

## 黄金规则

- spec 一旦进入 `done/` **不再修改**，作为历史快照。
- 如果交付的 feature 跟 spec 跑偏了，更新 spec 反映实际交付状态再归档，commit message 注明。
- 不要让 active/ 里的 spec 烂尾。每月扫一遍：继续做、标 `cancelled` 移 done，或删除。

## 关联文档

- [AGENTS.md §5](../AGENTS.md) - Spec 规则在跨 agent 主入口里的位置。
- [docs/decisions/](../docs/decisions/) - ADR（决策记录）。spec 是“做什么”，ADR 是“为什么这么做”。
- [docs/project-state.md](../docs/project-state.md) - 当前状态和下一步交接。
