/**
 * 组件作用域 CSS 改写器（ADR-0022 决策四-4，属性后缀法，仿 Vue `<style scoped>`）。
 *
 * 给定组件 CSS 文本与作用域 id，把每条选择器末尾追加 `[data-cmp-{id}]`，使样式仅命中本组件实例
 * 的元素（组件根 + 后代在实例化时被打 `data-cmp-{id}` 属性）。不支持穿透（无 `:deep()`/`>>>`），
 * 纯隔离——YAGNI，真实需求出现再加（仅改写器一个额外规则，不影响架构）。
 *
 * 改写规则（仿 Vue 行为）：
 * - `.foo` → `.foo[data-cmp-1]`（末尾选择器加后缀）
 * - `.a .b` → `.a .b[data-cmp-1]`（仅末尾选择器加，祖先选择器不加）
 * - `a, b` → `a[data-cmp-1], b[data-cmp-1]`（逗号分组，各组末尾分别加）
 * - `:hover` → `[data-cmp-1]:hover`（伪类：属性后缀置于伪类**前**，Vue 行为）
 * - `::before` → `[data-cmp-1]::before`（伪元素同伪类）
 * - `@media (...) { .foo {} }` → 包裹保留，内部 `.foo` 照常改写
 * - `@keyframes name { ... }` → 整体保留不改写（关键帧名不隔离，按组件名约定避免冲突）
 *
 * @param cssText  组件 `<style>` 原始 CSS 文本
 * @param scopeId  作用域 id（组件为 def 级数值；x-html.compile 实例为随机字符串，见
 *                 injectHostScopedStyle），用作 `data-cmp-{scopeId}` 属性名后缀
 * @returns 改写后的 CSS 文本
 */
export declare function rewriteScopedCss(cssText: string, scopeId: number | string): string;
/** 取组件定义的稳定 scoped id（首次分配后缓存） */
export declare function componentScopedId(defName: string): number;
/**
 * 为组件实例注入 scoped 样式（ADR-0022 决策四-4，生命周期修订见 ADR-0113）。
 *
 * - 同名组件定义只改写注入一次（`<style data-cmp-def="${defName}">`），多实例共享；
 * - **页面级常驻**：无引用计数、不随卸载/destroy 移除（多 engine 共页同名组件共享同一
 *   元素，单方无法判定最后使用者——对齐 ADR-0001/0087「文档级共享资源不移除」）；
 * - 同名覆盖声明经 `patch` 模式按需更新内容（等值零开销，防幽灵旧样式）；
 * - scopeId 为改写用的属性后缀——**须传 componentScopedId(defName)**（def 级稳定 id，
 *   与实例化时打的 data-cmp-{id} 属性保持一致 → 见 mountComponentScopedAttr）。
 *
 * @param defName   组件名（样式缓存 key）
 * @param styles    组件 `<style>` 文本数组
 * @param scopeId   def 级 scoped id（componentScopedId 产物）
 * @returns 注入的 `<style>` 元素（已存在则返回既有）
 */
export declare function injectComponentStyle(defName: string, styles: string[], scopeId: number): HTMLStyleElement | null;
/**
 * 为**指令实例**注入 scoped 样式（x-html.compile 注入模板的样式通道）。
 *
 * 与 `injectComponentStyle`（组件 def 级，多实例共享 + 引用计数）的差异：
 * - `scopeId` 是实例级随机字符串（`getId()`），样式表 id 挂实例——同 URL 两处加载互不共享
 *   （bind 变量挂载点是各自宿主，共享样式表会串值）；
 * - **无引用计数**：样式表生命周期 = 指令实例生命周期，调用方持有返回元素自行 remove
 *   （值变 replace 姿态更新，空值/destroy 移除）。
 *
 * @param styles  提取 bind 后的 scoped CSS 文本数组（调用方已过 extractStyleBinds）
 * @param scopeId 实例级随机 id（getId() 产物，实例内稳定）
 * @returns 注入的 `<style>` 元素；空数组 / SSR 返回 undefined
 */
export declare function injectHostScopedStyle(styles: string[], scopeId: string): HTMLStyleElement | undefined;
/**
 * 给元素及其后代打 scoped 属性 `data-cmp-{scopeId}`（实例化时调用；组件 def 级数值 id
 * 与 x-html.compile 实例级随机字符串 id 同用——属性名构造是唯一共用点）。
 */
export declare function mountComponentScopedAttr(root: HTMLElement, scopeId: number | string): void;
