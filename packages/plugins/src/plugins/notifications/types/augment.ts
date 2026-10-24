/**
 * 通知插件对 engine 类型面的声明合并（ADR-0001 决策 4）。
 *
 * 通知子系统自 engine 迁出（ADR-0001 决策 1），engine 类型面同步摘除；本文件以声明
 * 合并挂回插件消费面——装载插件（本模块进入类型编译图）后类型面与运行时一致，未装
 * 插件时两两俱无（`notifications` 属性/键缺失即"该装插件了"的类型级引导）：
 *
 * - `AutoSparkOptions.notifications`：构造期声明（`false` 整体关闭 / 配置对象全局默认）；
 * - `AutoSparkEvents` 通知事件键：`notifications/<type>/<id>/<verb>` 分层命名 + 通配订阅；
 * - `AutoSpark` 实例属性 `notifications`：ready 自举挂载的 NotificationManager。
 *
 * `$notifications` 保留键（ADR-0072）运行时注入 **state 根**（`store.state.$notifications`），
 * 不属于 `state.$` 元容器——根路径键无 interface 声明合并接缝，其形态类型
 * `AutoSparkNotificationsState` 自插件导出（消费方经自定义 State 泛型声明；默认
 * `Record<string, any>` 下为索引签名 `any`，与迁出前 engine 行为一致）。
 *
 * 纯类型文件：无运行时代码，仅声明合并。经插件入口 index.ts 副作用导入进入编译图。
 */
import type { Dict, ComponentInstance } from "autospark";
import type { NotificationOptions } from "../runtime/types";
import type { NotificationManager } from "../runtime/manager";

declare module "autospark" {
    interface AutoSparkOptions<State extends Dict = any> {
        /**
         * 全局通知（ADR-0071）：通知插件的引擎级全局默认。三态：
         *
         * - 缺省：默认开启 + 内置默认（pos top-right / delayClose 3000 / showCount 5 / slide）；
         * - `false`：**整体关闭**——不建容器、不注样式，`engine.notifications`
         *   别名与内置 `toast` / `confirm` / `task` action 一并 warn + no-op（死句柄，不给半开状态）；
         * - 配置对象：全局默认（与单次调用 props 同构，单次覆盖全局；`showCount` / `maxLen` /
         *   `fetchOptions` / `icons` / `types` / `shallow` 为管理器级键，仅本层生效）。
         *
         * 仅在装载通知插件后生效（插件 ready 自举读本键构造 NotificationManager）。
         *
         * @default 开启 + 内置默认（NotificationOptions 各键见 ADR-0071 决策 4/15）
         */
        notifications?: false | NotificationOptions;
    }

    interface AutoSparkEvents {
        // ── notifications/<type>/<id>/<verb> 通知（ADR-0071 决策 20 → **ADR-0102 分层命名升级**；
        //    双通道：总线具体名广播（订阅面可 `*`/`**` 通配）+ 卡片元素 dispatchEvent 同步广播）──
        /** 记录创建——订阅模式键即本键（`*` 配一段、`**` 配尾段；payload：notification = 组件实例（ADR-0089），el = 卡片根元素，排队未挂为 null） */
        "notifications/*/*/add": { notification: ComponentInstance; el: HTMLElement | null };
        /** 记录级补丁生效 / 同 id 原地更新 / task 运行键（progress·paused·completed）变更 */
        "notifications/*/*/update": { notification: ComponentInstance; el: HTMLElement | null };
        /** 展示挂载（进场动画发起时） */
        "notifications/*/*/show": { notification: ComponentInstance; el: HTMLElement | null };
        /** 展示关闭（一切移除路径均广播：自动关闭 / hide() / delete() / clear() / destroy） */
        "notifications/*/*/hide": { notification: ComponentInstance; el: HTMLElement | null };
        /** 已读置位（卡片任意点击 / markRead / markAllRead） */
        "notifications/*/*/read": { notification: ComponentInstance; el: HTMLElement | null };
        /** 业务状态补丁（status 键变更） */
        "notifications/*/*/status": { notification: ComponentInstance; el: HTMLElement | null };
        /** action 按钮点击——末段 = action 名（value 应答在此；anchor 存在时以发起子树为根额外派发，决策 14） */
        "notifications/*/*/actions/*": {
            notification: ComponentInstance;
            el: HTMLElement | null;
            action: { title: string; hide: boolean };
            value?: any;
        };
    }

    interface AutoSpark<State extends Record<string, any> = Record<string, any>> {
        /**
         * 通知管理器（ADR-0001 决策 4）：插件 ready 自举挂载（`engine.notifications`），
         * 提供 add / update / show / hide / markRead / markAllRead 等完整 API 面（ADR-0071）。
         * 未装插件时无此属性（访问即"该装插件了"的引导）。
         */
        readonly notifications: NotificationManager;
    }
}
