/**
 * confirm（ADR-0071 决策 22）：模板快速确认——payload 的 yes/no 可提取键转按钮文案；
 * 确认/取消结果经 notifications/<type>/<id>/actions/<名> 事件以发起子树回流（anchor 注入，
 * ADR-0102 分层命名），Confirm 会话
 * thenable 的 resolve 值亦随 actions/confirm/resolved 广播（buildAction 异步语义
 * ——ADR-0077 统一 show 入口后糖退役，会话本体承载 Promise）。
 */
import { triggerAnchor } from "./_anchor";
import type { AutoSpark, ActionDecl } from "autospark";
import type { NotificationProps } from "../runtime/types";

/** 构造 confirm 执行体（依赖 engine 实例——注册期经 engine 参数绑定） */
export function createConfirmSpec(engine: AutoSpark<any>): ActionDecl {
    return {
        title: "确认",
        handle: function (this: unknown, payload?: any) {
            const obj: Record<string, any> =
                typeof payload === "string" ? { title: payload } : { ...(payload ?? {}) };
            const { yes, no, ...rest } = obj;
            if (rest.anchor == null) rest.anchor = triggerAnchor(this) ?? undefined;
            return engine.notifications.show({
                ...(rest as NotificationProps),
                type: "confirm",
                delayClose: (rest as NotificationProps).delayClose ?? 0, // sticky：永不自动关
                actions: [
                    // 语义变体（ADR-0129 场景化语义色）：确定 = 主操作、取消 = 中性弱化
                    { title: (yes as string) ?? "确定", value: true, type: "primary" },
                    { title: (no as string) ?? "取消", value: false, type: "plain" },
                ],
            });
        },
    };
}
