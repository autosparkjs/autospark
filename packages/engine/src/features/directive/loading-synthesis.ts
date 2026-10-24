/**
 * x-loading 合成共享层（ADR-0126）：远程加载物种（x-html / x-component / x-isolate /
 * overlay boundary）统一的「loading 合成协议」与「元键注入」单点实现。
 *
 * 分工：{@link createLoadingMask} 承载合成协议三要素（ADR-0126 决策 5/6）——
 *
 * - **宿主声明守卫**：宿主手写 `x-loading` 属性时引擎不合成、不触碰、不删除（仅首次合成时判定）；
 * - **所有权闸**：只有本方合成的属性才允许翻转显隐 / 摘除——宿主手写场景 show/hide/release 全 no-op；
 * - **toggle 协议统一**：显隐走 `setAttribute("true"/"false")`（x-loading 字面量模式经 attrChanged
 *   驱动显隐，与 removeAttribute 视觉不可分辨）；仅 {@link LoadingMaskHandle.release}（销毁 /
 *   teardown 重置）摘除属性并释放所有权。
 *
 * x-data 不纳入本协议（物种特例：遮罩合成走响应式路径 `x-loading="<元键 store 路径>"`，
 * 元键本就在 store 可订阅，ADR-0126 决策 7）。
 *
 * {@link injectLoadMeta} 承载元键注入（ADR-0122 决策 2 / ADR-0126 决策 4）：`$loading` / `$error`
 * 写宿主 scope locals——原地改写不换引用（子 scope 经 _linkParent 共享同一对象，替换会断链）+
 * invalidateScopeView + 仅刷子 scope 不刷宿主自身（防 `_setMeta → refresh → invokeAction →
 * _beginLoad → _setMeta` watcher 死循环）。
 *
 * 无物种耦合，可独立单测。
 */
import type { AutoSparkScope } from "../../engine/scope";

/** loading 选项值域（ADR-0126 决策 2，与 router loading 配置先例同构）：false 关 / 字符串 → message / 对象透传 */
export type LoadingMaskOptions = boolean | string | Record<string, unknown>;

/** 合成遮罩句柄：所有权状态内聚（调用方实例字段持有，生命周期内复用） */
export interface LoadingMaskHandle {
    /**
     * 显示遮罩。已持有所有权（重入）→ 直接翻 `"true"` 不重判守卫（属性是自己的）；
     * 首次合成走守卫 + options 透传；宿主手写 x-loading 或 `loading:false` → no-op。
     */
    show(options?: LoadingMaskOptions): void;
    /** 隐藏遮罩（所有权闸内 toggle `"false"`；未合成 / 宿主手写 no-op） */
    hide(): void;
    /** 摘除合成属性并释放所有权（销毁 / teardown 重置场景——下一轮 show 重新走守卫判定） */
    release(): void;
    /** 是否由本方合成（守卫命中 / 未合成时 false） */
    readonly synthed: boolean;
}

/**
 * 创建合成遮罩句柄。el 为宿主元素（指令宿主 / overlay boundary 等程序化元素），
 * 生命周期内恒定——句柄随调用方实例字段持有，不重复创建。
 */
export function createLoadingMask(el: HTMLElement): LoadingMaskHandle {
    let synthed = false;
    return {
        get synthed() {
            return synthed;
        },
        show(options?: LoadingMaskOptions): void {
            if (synthed) {
                el.setAttribute("x-loading", "true");
                return;
            }
            if (options === false) return;
            if (el.hasAttribute("x-loading")) return; // 宿主手写 x-loading 优先：不合成、不触碰
            el.setAttribute("x-loading", "true");
            // 字符串 → message（ADR-0126 决策 2）；对象 → x-loading-options JSON 透传（既有协议）
            if (typeof options === "string") {
                el.setAttribute("x-loading-options", JSON.stringify({ message: options }));
            } else if (options && typeof options === "object") {
                el.setAttribute("x-loading-options", JSON.stringify(options));
            }
            synthed = true;
        },
        hide(): void {
            if (!synthed) return;
            el.setAttribute("x-loading", "false");
        },
        release(): void {
            if (!synthed) return;
            el.removeAttribute("x-loading");
            synthed = false;
        },
    };
}

/**
 * 元键注入宿主 scope locals（ADR-0122 决策 2 / ADR-0126 决策 4）：`$loading` / `$error` 为普通
 * 对象字段，经 scope 链对子树可见（locals 优先级最高）。原地修改（不替换引用——子 scope 经
 * _linkParent 共享同一对象，替换会断链）。写入后 invalidateScopeView 让聚合视图缓存失效，
 * 再刷新子 scope 驱动依赖绑定重求值（x-text/x-if 等直读元键）。
 *
 * 注意：只刷新子 scope，不刷宿主 scope 自身——宿主 scope 上的取数 watcher 监听 args 数据依赖，
 * 不应被 $loading/$error 变化触发，否则会形成 _setMeta → refresh → invokeAction →
 * _beginLoad → _setMeta 的死循环。
 */
export function injectLoadMeta(
    scope: AutoSparkScope,
    loading: boolean,
    error: Error | undefined,
): void {
    if (!scope.locals) scope.locals = {};
    scope.locals.$loading = loading;
    scope.locals.$error = error;
    scope.invalidateScopeView();
    for (const child of scope.children) child.refresh();
}
