# ADR-0001: 包定位——插件自举基建与家族公共工具单点

- 状态：已接受（Accepted）
- 日期：2026-10-25
- 关联：plugins ADR-0006（基建上移与外壳模式）、theme ADR-0007（库型插件）；engine ADR-0114（预加载队列）

## 决策

家族第三插件（theme）入场时，双路径自举基建 `installPlugin` 已存在 plugins 收敛版与 router 内联版两份——第四份副本诞生前收敛为共享微包。

**@autospark/utils 定位**：家族级公共基建与工具函数的统一存放点。初始内容为插件自举基建：

- `installPlugin(tag, probe, register)`：双路径自举（probe 探测全局命名空间直取注册 / 否则仅将 register 回调入 `__AUTOSPARK_PLUGINS__` 预加载队列——不排整包 / 队列冻结且全局不可达时 `console.error` 响而不哑）；
- `PluginProbe` 探测键类型。

**边界与纪律**：

- 对 autospark 仅允许 type-only 依赖（编译期剥除，产物零痕迹）——与家族插件零静态依赖纪律同构；
- 代码组织按模块分目录：`src/<module>/index.ts`，`src/index.ts` 为导出总索引；
- 本包是**基建层**：不承载业务功能、不依赖其他 @autospark 包（被依赖方），后续家族公共工具函数/公共模块经决策逐项准入，不做过前瞻设计。
