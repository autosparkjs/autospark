import type { AutoSparkScope } from "./scope";

/**
 * 组件实例门面（ADR-0080）：外部读取组件实例的稳定视图。
 *
 * `engine.getComponent(el)` 自任意元素沿 DOM 链向上找**最近的组件实例 scope**
 * （就近即止——嵌套组件返回内层；元素在组件外返回 undefined），以本门面返回。
 * 字段与组件内 `this`（`scope.getMethodThis()` Proxy，ADR-0022 决策二-3 修订）同构——
 * 心智一句话：**实例就是组件外的 this**：
 *
 * - `el`：实例根元素（宿主化身组件根后的运行元素）
 * - `name`：组件名（`x-component:名称` 的属性参数；isComponent 恒有值，类型上兼容 null）
 * - `data`：聚合视图（`getContext()`，响应式可写——外部改它组件自动刷新）
 * - `props`：`data` 的完全等价别名（ADR-0057）
 * - `globalState`：全局树明确通道（`engine.state`，无聚合遮蔽）
 * - `methods`：组件 method 的 this 绑定代理（与组件内 `this.inc()` 同一绑定，含 `$parent` 等）
 * - `super`：继承链父方法视图（ADR-0082；非继承组件为 undefined，`inst.super.inc()`）
 * - `scope`：实例 scope 逃生舱（`this.scope` 同款；内部对象，字段布局非公开契约）
 *
 * 不缓存实例列表（引擎无实例注册表），每次取用现算。覆盖物实例不经此
 * （渲染于 body 容器，触发处 DOM 链不通），用 `engine.getOverlay` → OverlayHandle。
 */
export class ComponentInstance {
    /** 实例 scope（门面数据源；直接暴露属逃生舱语义，字段布局非公开契约） */
    readonly scope: AutoSparkScope;

    constructor(scope: AutoSparkScope) {
        this.scope = scope;
    }

    /** 实例根元素（宿主化身组件根） */
    get el(): HTMLElement {
        return this.scope.el!;
    }

    /** 组件名（`x-component:名称` 的属性参数） */
    get name(): string | null {
        return this.scope.componentName;
    }

    /** 组件聚合数据视图（自有 data+props → 祖先近层 → 全局 state），响应式、可写 */
    get data(): Record<string, any> {
        return this.scope.getContext();
    }

    /** `data` 的完全等价别名（同一聚合视图引用；ADR-0057） */
    get props(): Record<string, any> {
        return this.scope.getContext();
    }

    /** 全局状态（engine.state）——聚合视图同名键自有层优先遮蔽，取全局值用此通道 */
    get globalState(): Record<string, any> {
        return this.scope.engine.state;
    }

    /** 组件 method 的 this 绑定代理（与组件内 this 同一绑定；`inst.methods.inc()`） */
    get methods(): any {
        return this.scope.getMethodThis();
    }

    /** super 引用（ADR-0082）：继承链父方法视图（方法执行栈外按实例自身层解析；非继承 undefined） */
    get super(): any {
        return this.scope.getSuperView();
    }
}
