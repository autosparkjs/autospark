/**
 * @autospark/plugins 官方插件聚合入口（ADR-0003）：一个导入挂载全部官方插件。
 *
 * 模块加载即逐个自举（各插件入口尾部的 bootstrap 调用，双路径注册 ADR-0114）：
 * notifications（复合插件）/ x-ripple + x-spin（装饰动效指令插件，ADR-0007）/ button
 * （组件插件）。构建产物为插件闭包 `autospark.plugins.js`（ADR-0004，无全局名）——
 * script 直引场景一个标签挂全部官方插件；按需加载走一插件一产物（扁平 dist/，产物名
 * `autospark.<plugin>.js`）。
 *
 * 本包运行时零依赖 `autospark`（ADR-0003 实操守则）：autospark 能力经 src/runtime
 * 运行时解析，engine 仅为 devDependencies（demo/测试用）。
 */

// 逐插件副作用导入——顺序即注册顺序（各插件注册面互不冲突，顺序无关）
import "./plugins/notifications/index";
import "./plugins/x-ripple/index";
import "./plugins/x-spin/index";
import "./plugins/button/index";
