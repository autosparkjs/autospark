/**
 * toast（ADR-0071 决策 3 别名 + 决策 23）：payload = 字符串 | props → `add({type:'toast',...})`，
 * anchor 自动注入发起元素（显式传的 anchor 优先）。
 */
import { triggerAnchor } from "./_anchor";
import type { AutoSpark } from "../engine/engine";
import type { NotificationProps } from "../features/notifications/types";
import type { BuiltinActionSpec } from "../features/action/types";

/** 构造 toast 执行体（依赖 engine 实例——注册期经 engine 参数绑定） */
export function createToastSpec(engine: AutoSpark<any>): BuiltinActionSpec {
    return {
        title: "提示",
        handle: function (this: unknown, payload?: any) {
            const props: NotificationProps =
                typeof payload === "string" ? { title: payload } : { ...(payload ?? {}) };
            if (props.type == null) props.type = "toast";
            if (props.anchor == null) props.anchor = triggerAnchor(this) ?? undefined;
            return engine.notifications.add(props);
        },
    };
}
