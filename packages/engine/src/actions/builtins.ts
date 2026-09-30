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
 * `back` 是**自带执行体**的内置 action（ADR-0065）：`history.back()`——内置 error 组件
 * 的返回按钮依赖，非纯信号。
 *
 * `toast` / `confirm` / `task` 是**配套 action 三件套**（ADR-0071 决策 22/23，执行型——
 * 与 Message API 配套，依赖 engine 实例，handle 在 `registerBuiltinActions` 内经 engine 参数
 * 绑定）：DOM 处使用时**自动注入 `anchor = 发起元素`**（AutoSparkActionContext.el，经
 * buildAction 包装的 this 传入）——结果/进度事件以发起子树回流（决策 14 职责②），kind render
 * 组件获得发起域数据视图（职责③）；编程式 API（engine.messages.add 等）无注入（anchor 仅
 * API 显式传时生效）。
 */
import type { AutoSpark } from "../engine";
import type { MessageProps } from "../messages/types";
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
    // back：自带执行体的内置 action（ADR-0065）——点击即 history.back()（SSR 守卫静默）
    back: {
        title: "返回",
        handle: () => {
            if (typeof history !== "undefined") history.back();
        },
    },
    // toast / confirm / task：配套 action 三件套（ADR-0071 决策 22/23）——标题在此登记，
    // handle 在 registerBuiltinActions 内经 engine 参数绑定（转发 engine.messages.*）
    toast: "提示",
    confirm: "确认",
    task: "任务",
};

/** 构造单个内置 action 描述符（信号型）：默认 handle 透传首参 + `title` + `builtin: true` 标记 */
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
 * 从 action 触发上下文取 anchor（ADR-0071 决策 23）：buildAction 包装内 `this` =
 * AutoSparkActionContext（经 x-on 触发时含 `el` = 发起元素）；命令式直调无 el → null
 * （编程式 API 无注入——anchor 仅显式传时生效）。
 */
function triggerAnchor(ctx: unknown): HTMLElement | null {
    const el = (ctx as any)?.el;
    return el instanceof HTMLElement ? el : null;
}

/**
 * 把内置 action 补进全局表：**只补用户未占用的键**（用户同名声明先扫先占，覆盖内置）。
 *
 * @param target 全局 action 表（`options.actions`，声明入参形态；构造期已扫过用户声明、
 *               逐条规范化，运行时值恒为 ActionDesc）
 * @param emit   总线广播函数（调用点绑 engine.emit）
 * @param engine engine 实例（配套 action 三件套的执行体依赖——handle 转发 engine.messages.*，
 *               ADR-0071 决策 22/23；广播语义经 buildAction 包装照常保留）
 */
export function registerBuiltinActions(
    target: Record<string, ActionDecl>,
    emit: ActionEmit,
    engine?: AutoSpark<any>,
): void {
    for (const [name, spec] of Object.entries(BUILTIN_ACTIONS)) {
        if (name in target) continue;
        if (engine && name === "toast") {
            // toast（决策 3 别名 + 决策 23）：payload = 字符串 | props → add({kind:'toast',...})，
            // anchor 注入发起元素（显式传的 anchor 优先）
            target[name] = createBuiltinAction(
                name,
                {
                    title: "提示",
                    handle: function (this: unknown, payload?: any) {
                        const props: MessageProps =
                            typeof payload === "string" ? { title: payload } : { ...(payload ?? {}) };
                        if (props.kind == null) props.kind = "toast";
                        if (props.anchor == null) props.anchor = triggerAnchor(this) ?? undefined;
                        return engine.messages.add(props);
                    },
                },
                emit,
            );
        } else if (engine && name === "confirm") {
            // confirm（决策 22）：模板快速确认——payload 的 yes/no 可提取键转按钮文案；
            // 确认/取消结果经 message:action 事件以发起子树回流（anchor 注入），
            // Promise resolve 值亦随 actions/confirm/resolved 广播（buildAction 异步语义）
            target[name] = createBuiltinAction(
                name,
                {
                    title: "确认",
                    handle: function (this: unknown, payload?: any) {
                        const obj: Record<string, any> =
                            typeof payload === "string" ? { title: payload } : { ...(payload ?? {}) };
                        const { yes, no, ...rest } = obj;
                        if (rest.anchor == null) rest.anchor = triggerAnchor(this) ?? undefined;
                        return engine.messages.confirm(rest as MessageProps, {
                            yes: yes as string | undefined,
                            no: no as string | undefined,
                        });
                    },
                },
                emit,
            );
        } else if (engine && name === "task") {
            // task（决策 23）：payload → progressbar(...)；ProgressTask 经返回值与
            // actions/task/resolved 广播 payload 交付（进度推进仍为编程式）
            target[name] = createBuiltinAction(
                name,
                {
                    title: "任务",
                    handle: function (this: unknown, payload?: any) {
                        const props: MessageProps =
                            typeof payload === "string" ? { title: payload } : { ...(payload ?? {}) };
                        props.kind = "task";
                        if (props.anchor == null) props.anchor = triggerAnchor(this) ?? undefined;
                        return engine.messages.progressbar(props);
                    },
                },
                emit,
            );
        } else {
            target[name] = createBuiltinAction(name, spec, emit);
        }
    }
}
