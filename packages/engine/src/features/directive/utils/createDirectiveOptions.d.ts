/**
 * 创建指令配置的只读聚合视图（DirectiveOptions 代理，ADR-0007）。
 *
 * 以两层 fallback 顺序**虚拟合并**指令选项与宿主选项：读取某键时先查指令选项，未命中再回退
 * 宿主选项。**不做真合并、零拷贝**——与基类 `getOption` 共用同一回退语义，区别在于此为暴露给
 * 表达式的对象形态（Proxy），`getOption` 为方法形态。
 *
 * 只读：`set`/`deleteProperty` 返回 false（配置静态，运行时不可改）。与 `createScopeContext`
 * 的只读聚合 Proxy 同构。
 *
 * @param directiveOptions 指令选项（含解析期注入的 modifier 开关，即 `this.options`）
 * @param hostOptions      宿主选项（`scope.hostOptions`，即 `x-options`）
 */
export declare function createDirectiveOptions(directiveOptions: Record<string, any> | undefined, hostOptions: Record<string, any> | null | undefined): Record<string, any>;
