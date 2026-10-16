import type { AutoSpark } from "autospark";
import type { AutoSparkRouter } from "@/router";
import { registerOutletComponent } from "./outletComponent";

/**
 * engine 集成层（ADR-0002 / ADR-0011）：router 与 AutoSpark engine 的接缝。
 *
 * ADR-0011 起 router 仅支持**注入模式**（options.engine 传入应用自建的 engine 实例）：
 * 自建模式（运行时探测全局 AutoSparkSpaces.AutoSpark 构造）随独立入口一起退役——
 * 挂载改由插件自举承担（engine 构造 options 声明 routes / autoDiscoverRoutes，router
 * 经 `AutoSpark.ready` 回调持 engine 构造 AutoSparkRouter）。类型面经 devDependencies
 * 的 autospark（file:../engine）提供，import type 零运行时引用。
 */

/**
 * engine 绑定结果
 */
export interface RouterEngineBinding {
    /** 注入的 engine 实例（生命周期归应用所有，router detach 不处置） */
    engine: AutoSpark;
}

/**
 * 确保 host 内存在至少一个出口：无 x-outlet / outlet 组件声明时插入默认出口。
 * 须在 engine 创建（首编译）前调用——编译后插入的声明不会被激活。
 * （ADR-0011：插件自举路径经 `AutoSpark.precompile` 回调在构造早期调用本函数，
 * 插入的默认出口随 template 克隆参与首编译。）
 */
export function ensureDefaultOutletElement(host: HTMLElement): void {
    if (host.querySelector("[x-outlet], [x-component\\:autospark\\.outlet], [data-autospark-outlet]")) {
        return;
    }
    const outlet = document.createElement("div");
    outlet.setAttribute("x-outlet", "");
    host.appendChild(outlet);
}

/**
 * 建立 router 的 engine 绑定（仅注入模式，ADR-0011）：应用拥有 engine 生命周期，
 * router 纯消费。
 *
 * 时序语义：直接构造 AutoSparkRouter 时应用的静态模板已编译完成，x-outlet 简写
 * 不再生效（须写 x-component:autospark.outlet 完整形态；远程模板中的 x-outlet 经
 * 渲染管线照常生效）；插件自举路径下 x-outlet 简写由 precompile 回调在首编译前
 * transform（plugin/bootstrap.ts）。
 *
 * 绑定后自动注册 autospark.outlet 组件（已存在则跳过，Q10；注册晚于声明时由
 * x-component 的 retain 重试机制兜底激活，ADR-0088）。
 */
export function setupRouterEngine(router: AutoSparkRouter): RouterEngineBinding {
    const engine = router.options.engine;
    if (!engine) {
        throw new Error(
            "[AutoSparkRouter] 缺少 options.engine（ADR-0011）：router 仅支持注入模式。" +
                "请经 options.engine 注入 AutoSpark 实例，或在 engine 构造 options 中声明 " +
                "routes / autoDiscoverRoutes 由插件自举挂载",
        );
    }
    registerOutletComponent(engine);
    return { engine };
}
