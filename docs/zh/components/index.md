# 组件

AutoSpark 官方组件（组件型插件，`@autospark/plugins`）——每个组件同时是一个插件，经 `autospark.<name>.js` IIFE 产物按需引入（引擎之后加载），或聚合产物 `autospark.plugins.js` 一个标签挂全部。

组件遵循同一套约定：

- **主题合规**：视觉全走 `--auto-*` 语义变量三级回退链（theme 在场自动换肤，不在场吃 `--asc-<name>-*` 覆盖变量与兜底值）；
- **档位继承**：均继承 `autospark.base` 抽象基组件（ADR-0134）——`data-size` / `data-shadow` / `data-radius` / `data-spacing` / `data-dark` / `data-colorized` 六键即主题通道，级联生效；
- **事件出口**：组件默认封闭，交互事件经冒泡到外层消费（`@change="v = $event.detail.value"` 惯用法）。

## 组件列表

| 组件 | 一句话定位 | 引入顺序说明 |
| --- | --- | --- |
| [Base 基类组件](./base.md) | 主题档位抽象基组件（六键通道，被官方组件继承） | engine 内置，无独立产物 |
| [Button 按钮](./button.md) | 形态×语义色正交的全功能按钮（图标/加载/tags 子钮） | `autospark.button.js` |
| [StateButton 状态按钮](./state-button.md) | 2-N 态循环切换的单钮（继承 button 骨架、decorate 装饰、灰色无匹配态） | `autospark.state-button.js` **须与 button 同页加载** |
| [ButtonGroup 按钮组](./button-group.md) | 按钮容器：融合/间隔布局 + 缺省下发 + x-model 单选选中 | `autospark.button-group.js` **须先于 button 加载** |
