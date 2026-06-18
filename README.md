# 重点项目管理系统

当前目录包含三个并列入口。摄影摄像产能看板、重点项目排期模板、重点项目工作台暂时独立运行，后续确认数据关系后再通过 `shared/` 中的统一数据结构做数据互通。

## 项目入口

- 摄影摄像产能看板：`projects/capacity-board/index.html?module=capacity`
- 在线项目排期模板：`projects/timeline-template/index.html`
- 重点项目工作台：`projects/capacity-board/index.html?module=workbench`
- 根目录 `index.html` 是一级入口页，用于进入三个独立板块。

## 在线预览

- GitHub Pages：https://sunny1784591409-cloud.github.io/task-capacity-dashboard/

如果页面暂时无法打开，请在 GitHub 仓库的 `Settings -> Pages` 中选择从 `main` 分支根目录发布，等待部署完成后再访问上方网址。

## 目录说明

```text
projects/
  capacity-board/       摄影摄像产能看板
                        通过 ?module=workbench 进入重点项目工作台
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
