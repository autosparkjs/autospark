/**
 * task（ADR-0071 决策 23）：payload → `show({type:'task'})`；Task 会话经返回值与
 * actions/task/resolved 广播 payload 交付（进度推进仍为编程式）。
 */
import { triggerAnchor } from "./_anchor";
import type { AutoSpark } from "../engine/engine";
import type { MessageProps } from "../features/messages/types";
import type { BuiltinActionSpec } from "../features/action/types";

/** 构造 task 执行体（依赖 engine 实例——注册期经 engine 参数绑定） */
export function createTaskSpec(engine: AutoSpark<any>): BuiltinActionSpec {
    return {
        title: "任务",
        handle: function (this: unknown, payload?: any) {
            const props: MessageProps =
                typeof payload === "string" ? { title: payload } : { ...(payload ?? {}) };
            props.type = "task";
            if (props.anchor == null) props.anchor = triggerAnchor(this) ?? undefined;
            return engine.messages.show(props);
        },
    };
}
