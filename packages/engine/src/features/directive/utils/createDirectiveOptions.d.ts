/**
 * 创建指令配置的只读聚合视图（DirectiveOptions 代理，ADR-0007；全局层 ADR-0127）。
 *
 * 以三层 fallback 顺序**虚拟合并**指令选项、宿主选项与指令全局默认：读取某键时先查指令
 * 选项，未命中回退宿主选项，再未命中回退全局默认（`engine.options.directives["x-{name}"]`）。
 * **不做真合并、零拷贝**——与基类 `getOption` 共用同一回退语义，区别在于此为暴露给表达式
 * 的对象形态（Proxy），`getOption` 为方法形态。
 *
 * 全局层以**解析器**注入（`() => getDirectiveGlobalDefaults(engine, name)`）：代理每次
 * 访问现调解析器（活读，ADR-0127）——本代理在指令 created 期构造一次、闭包长存，急切
 * 解析会把挂载后的表注入对闭包永久遮蔽。解析器抛错按「无本层」处理（配置面不得炸求值）。
 *
 * 只读：`set`/`deleteProperty` 返回 false（配置静态，运行时不可改）。与 `createScopeContext`
 * 的只读聚合 Proxy 同构。
 *
 * @param directiveOptions 指令选项（含解析期注入的 modifier 开关，即 `this.options`）
 * @param hostOptions      宿主选项（`scope.hostOptions`，即 `x-options`）
 * @param resolveGlobal    指令全局默认解析器（每次访问现调，ADR-0127；缺省 = 无全局层）
 */
export declare function createDirectiveOptions(directiveOptions: Record<string, any> | undefined, hostOptions: Record<string, any> | null | undefined, resolveGlobal?: () => Record<string, any> | null): Record<string, any>;
