# 当前协作边界

## 项目关系

当前工作区包含两个并列项目：

- 摄影摄像产能看板：`projects/capacity-board/`
- 在线项目排期模板：`projects/timeline-template/`

两个项目先分别完善到终稿。后续如需数据互通，优先通过 `shared/schemas/` 中的字段约定和 JSON 导入/导出实现。

## 修改规则

- 需求指向某个项目时，只修改对应项目目录。
- 未明确要求时，不跨项目同步修改。
- 根目录 `index.html` 仅作为项目选择页。
- `docs/legacy-current-context-garbled.md` 是历史乱码文档，仅用于追溯，不作为当前需求依据。
