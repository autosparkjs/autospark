/**
 * @autospark/plugins 官方插件聚合入口（ADR-0003）：一个导入挂载全部官方插件。
 *
 * 模块加载即逐个自举（各插件入口尾部的 bootstrap 调用，双路径注册 ADR-0114）：
 * notifications（复合插件）/ x-ripple + x-spin（装饰动效指令插件，ADR-0007）/
 * x-scrollbar（滚动条皮肤指令插件，ADR-0013）/ x-badge（徽标指令插件，ADR-0015）/
 * button + state-button（组件插件，ADR-0016 继承家族）。构建产物为插件
 * 闭包 `autospark.plugins.js`（ADR-0004，无全局名）——
 * script 直引场景一个标签挂全部官方插件；按需加载走一插件一产物（扁平 dist/，产物名
 * `autospark.<plugin>.js`）。
 *
 * 本包运行时零依赖 `autospark`（ADR-0003 实操守则）：autospark 能力经 src/runtime
 * 运行时解析，engine 仅为 devDependencies（demo/测试用）。
 */

// 逐插件副作用导入——顺序即注册顺序（注册面互不冲突），唯 precompile 变换例外：
// button-group 须先于 button（组变换在子钮 x-button 上做缺省下发 stamp 与 data-value
// stamp，须赶在 button 变换折叠 props 之前落属性，ADR-0014 决策 1/3/5——顺序契约）
import "./modules/notifications/index";
import "./modules/resource/index";
import "./directives/x-ripple/index";
import "./directives/x-spin/index";
import "./directives/x-scrollbar/index";
import "./directives/x-badge/index";
import "./components/button-group/index";
import "./components/button/index";
import "./components/stateButton/index";
