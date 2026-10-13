/**
 * x-outlet 简写预处理（ADR-0002 / ADR-0003）
 *
 * `<div x-outlet>` 是 `<div x-component:autospark.outlet>` 的别名糖（Q11 薄糖衣——组件机制
 * 全量复用，零逻辑重复）。**简写的值透传为 props 表达式**（ADR-0003 决策 1）：
 * `<div x-outlet="{ keepAlive: true, mode: 'tabs' }">` 等价于完整形态带值写法。
 * 以「编译前 DOM 预处理」实现：engine 的指令收集发生在编译期，
 * 编译后改写属性无法激活，故转换必须在编译前完成。
 *
 * 生效场景（覆盖 router 主导的两条编译入口）：
 * 1. **自建 engine**：attach 时（engine 创建/首编译前）对 host DOM 预处理（engineHost.ts）；
 * 2. **远程模板**：视图 HTML 经 renderer 的 DOMParser 解析后、交给 x-html.compile 前预处理。
 *
 * 注入 engine 模式下应用的静态模板不在上述管线内，请书写完整形态
 * `<div x-component:autospark.outlet>`（远程模板中的 x-outlet 不受影响）。
 */

/** 简写属性名 */
export const X_OUTLET_ATTR = "x-outlet";

/** 等价的组件实例化属性（x-component 指令：属性参数承载组件名） */
export const OUTLET_COMPONENT_ATTR = "x-component:autospark.outlet";

/**
 * 就地改写 root 内所有 x-outlet 声明为组件实例化属性（幂等：已改写者跳过）。
 * 简写属性的值原样透传为 x-component 的 props 表达式。
 */
export function transformXOutlet(root: ParentNode): void {
    const hosts = root.querySelectorAll(`[${X_OUTLET_ATTR}]`);
    hosts.forEach((el) => {
        const value = el.getAttribute(X_OUTLET_ATTR);
        el.removeAttribute(X_OUTLET_ATTR);
        if (!el.hasAttribute(OUTLET_COMPONENT_ATTR)) {
            el.setAttribute(OUTLET_COMPONENT_ATTR, value ?? "");
        }
    });
}
