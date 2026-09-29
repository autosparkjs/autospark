/**
 * builtins —— 引擎内置的信号型全局 action（ADR-0036 决策 7）。
 *
 * 内置 action 的**唯一落点**：注册键 → 展示标题的表（`BUILTIN_ACTIONS`）与构造/补齐逻辑
 * 集中于此，`ActionManager.registerGlobals` 只保留「先扫用户声明、后补内置缺失键」的注册次序。
 *
 * handle 默认为**参数透传**（`close(1)` → resolved 广播 `result:1`）：价值不在执行体而在**广播语义**
 * ——模板任意元素 `@click="close"` 触发，祖先监听 `action:close` DOM 冒泡事件（或总线
 * `actions/close/*`）即可实现关闭对话框、确认/取消等通用交互，无需为每个对话框手写空 action；
 * 透传首参让信号可携带载荷（如 `close("cancel-icon")`、`yes(formData)`），监听方从
 * `detail.result` / `$event.detail.result` 读取。value=title 供 UI 消费（x-loading 按钮文案等）。
 * 用户同名声明**覆盖**内置（补齐只填缺失键，用户优先）。
 *
 * `back` 是唯一**自带执行体**的内置 action（ADR-0065）：`history.back()`——内置 error 组件
 * 的返回按钮依赖，非纯信号。
 *
 * `toast` 是唯一**依赖 engine 实例**的内置 action（ADR-0068 决策 15，执行型）：handle 经
 * `registerBuiltinActions` 的 engine 参数绑定（表内仅登记标题）——payload = message 字符串 |
 * ToastProps 对象，直通 `engine.toast(payload)`；广播语义照常（buildAction 包装）。用户同名
 * 声明照常覆盖。
 */
import type { AutoSpark } from "../engine";
import { buildAction, type ActionEmit } from "./buildAction";
import type { ActionDecl, ActionDesc } from "./types";

/** 内置 action 表值形态：string = 纯信号（标题，handle 透传首参）；对象 = 自带执行体 */
type BuiltinActionSpec = string | { title: string; handle?: (payload?: any) => any };

/**
 * 内置信号型全局 action 表：注册键 → 展示标题（或 { title, handle } 自定义执行体）。
 *
 * 新增内置 action 只改本表；`registerBuiltinActions` 按键逐条补齐，无需动 ActionManager。
 */
export const BUILTIN_ACTIONS: Record<string, BuiltinActionSpec> = {
    yes: "确认",
    no: "否",
    cancel: "取消",
    close: "关闭",
    // back：唯一自带执行体的内置 action（ADR-0065）——点击即 history.back()（SSR 守卫静默）
    back: {
        title: "返回",
        handle: () => {
            if (typeof history !== "undefined") history.back();
        },
    },
    // toast：唯一依赖 engine 的执行型内置 action（ADR-0068 决策 15）——标题在此登记，
    // handle 在 registerBuiltinActions 内经 engine 参数绑定（直通 engine.toast(payload)）
    toast: "提示",
};

/**
 * 构造单个内置 action 描述符：默认 handle 透传首参（信号语义）+ `title` + `builtin: true` 标记，
 * 经 buildAction 包装获得双通道生命周期广播（全局语义，local=false）。
 *
 * @param name  注册键（注入 `desc.name`，广播事件名随键）
 * @param spec  表项：string = 标题（纯信号）；对象 = { title, handle? }（缺 handle 退化为信号）
 * @param emit  总线广播函数（调用点绑 engine.emit）
 */
export function createBuiltinAction(name: string, spec: BuiltinActionSpec, emit: ActionEmit): ActionDesc {
    const normalized = typeof spec === "string" ? { title: spec } : spec;
    return buildAction(emit, {
        handle: normalized.handle ?? ((payload?: any) => payload),
        name,
        title: normalized.title,
        builtin: true,
    });
}

/**
 * 把内置 action 补进全局表：**只补用户未占用的键**（用户同名声明先扫先占，覆盖内置）。
 *
 * @param target 全局 action 表（`options.actions`，声明入参形态；构造期已扫过用户声明、
 *               逐条规范化，运行时值恒为 ActionDesc）
 * @param emit   总线广播函数（调用点绑 engine.emit）
 * @param engine engine 实例（toast 键的执行体依赖——handle 直通 engine.toast，ADR-0068
 *               决策 15；广播语义经 buildAction 包装照常保留）
 */
export function registerBuiltinActions(
    target: Record<string, ActionDecl>,
    emit: ActionEmit,
    engine?: AutoSpark<any>,
): void {
    for (const [name, spec] of Object.entries(BUILTIN_ACTIONS)) {
        if (name in target) continue;
        if (name === "toast" && engine) {
            target[name] = createBuiltinAction(
                name,
                { title: "提示", handle: (payload?: any) => engine.toast(payload) },
                emit,
            );
        } else {
            target[name] = createBuiltinAction(name, spec, emit);
        }
    }
}
