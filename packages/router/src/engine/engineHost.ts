import type { AutoSpark } from "autospark";
import type { AutoSparkRouter } from "@/router";
import { registerOutletComponent } from "./outletComponent";
import { transformXOutlet } from "./xOutlet";

/**
 * engine 集成层（ADR-0002）：router 与 AutoSpark engine 的接缝。
 *
 * 产物零耦合契约：router 不打包 engine、运行时经 window.AutoSparkSpaces 探测；
 * 类型面经 devDependencies 的 autospark（file:../engine）提供，import type 零运行时引用。
 */

/**
 * engine 绑定结果
 */
export interface RouterEngineBinding {
    /** engine 实例（注入的或 router 自建的） */
    engine: AutoSpark;
    /** 是否由 router 自建（自建时 router 拥有生命周期，detach 时销毁） */
    owned: boolean;
}

/**
 * 确保 host 内存在至少一个出口：无 x-outlet / outlet 组件声明时插入默认出口。
 * 须在 engine 创建（首编译）前调用——编译后插入的声明不会被激活。
 */
function ensureDefaultOutletElement(host: HTMLElement): void {
    if (host.querySelector("[x-outlet], [x-component\\:autospark\\.outlet], [data-autospark-outlet]")) {
        return;
    }
    const outlet = document.createElement("div");
    outlet.setAttribute("x-outlet", "");
    host.appendChild(outlet);
}

/**
 * 建立 router 的 engine 绑定（Q8=C 混合所有权）：
 *
 * - **注入模式**（options.engine）：应用拥有 engine 生命周期，router 纯消费。应用的静态
 *   模板已编译完成，x-outlet 简写不再生效（须写 x-component:autospark.outlet 完整形态；
 *   远程模板中的 x-outlet 经渲染管线照常生效）。若应用模板已静态声明 outlet 组件而注册
 *   晚于编译，由 x-component 的 registered retain 事件重试机制兜底激活。
 * - **自建模式**（缺省）：编译前完成 x-outlet 预处理与默认出口插入，随后经全局
 *   `window.AutoSparkSpaces.AutoSpark` 构造（产物零 import engine——运行时探测，
 *   ADR-0002 产物零耦合契约）——options.data 作为裸状态种子（engine 自建并拥有）。
 *
 * 两种模式均在绑定后自动注册 autospark.outlet 组件（探测已存在则跳过，Q10）。
 */
export function setupRouterEngine(router: AutoSparkRouter): RouterEngineBinding {
    const injected = router.options.engine;
    if (injected) {
        registerOutletComponent(injected);
        return { engine: injected, owned: false };
    }

    // 运行时探测全局 engine（IIFE 产物挂 window.AutoSparkSpaces，ADR-0030）
    const spaces = (globalThis as unknown as { AutoSparkSpaces?: { AutoSpark?: AutoSparkCtor } })
        .AutoSparkSpaces;
    const AutoSparkCtor = spaces?.AutoSpark;
    if (typeof AutoSparkCtor !== "function") {
        throw new Error(
            "[AutoSparkRouter] 未找到 window.AutoSparkSpaces.AutoSpark：" +
                "请先加载 AutoSpark.js 再加载 @autospark/router，或经 options.engine 注入实例",
        );
    }

    ensureDefaultOutletElement(router.host);
    transformXOutlet(router.host);
    // 裸状态自建（ADR-0044）：router.options.data 作为初始数据种子
    const engine = new AutoSparkCtor(router.host, router.options.data ?? {}, {});
    registerOutletComponent(engine);
    return { engine, owned: true };
}

/** AutoSpark 构造器的最小类型面（运行时经全局变量取得，不 import engine 产物） */
type AutoSparkCtor = new (
    el: HTMLElement,
    state?: Record<string, any>,
    options?: Record<string, any>,
) => AutoSpark;
