# 重点项目管理系统

当前目录包含两个并列维护的静态项目。两个项目先分别完善到终稿，后续再通过 `shared/` 中的统一数据结构做数据互通。

## 项目入口

- 摄影摄像产能看板：`projects/capacity-board/index.html`
- 在线项目排期模板：`projects/timeline-template/index.html`
- 根目录 `index.html` 是项目选择页，用于进入两个独立项目。

## 在线预览

- GitHub Pages：https://sunny1784591409-cloud.github.io/task-capacity-dashboard/

如果页面暂时无法打开，请在 GitHub 仓库的 `Settings -> Pages` 中选择从 `main` 分支根目录发布，等待部署完成后再访问上方网址。

## 目录说明

```text
projects/
  capacity-board/       摄影摄像产能看板
  timeline-template/    在线项目排期模板
shared/
  schemas/              未来共用数据结构
docs/                   项目说明与互通规划
```

## 协作规则

- 修改某个项目时，只改对应 `projects/` 子目录。
- 未明确要求时，不跨项目同步改动。
- `shared/` 只放两个项目确认共用的数据结构或工具。
- 后续如果要打通数据，优先通过导入/导出 JSON 方案验证字段，再考虑共享代码。

## 预览方式

运行 `启动看板预览.bat` 后打开根目录选择页，再进入对应项目。
