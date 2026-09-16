import { AutoStore } from "autostore";
import { AutoSpark } from "../engine";
import type { AutoSparkOptions } from "../types";

/**
 * 测试基础设施（纯函数，无副作用；全局 DOM 注册请在各测试文件显式 `import "./setup"`）。
 */

/** 等待 microtask + 一个宏任务，确保 scheduler 的 queueMicrotask flush 已执行 */
export const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * 确定性结束元素上的在播进出场动画（ADR-0039）：happy-dom 无真实 CSS transition/animation，
 * 手动派发 transitionend 触发结束路径（事件监听过滤 e.target===el，故须在目标元素上派发）。
 * 配套约定：用例的 animate 配置带长 duration（如 5000ms）使动画在断言窗口内稳定「在播」。
 */
export const finishAnim = (el: Element) => el.dispatchEvent(new Event("transitionend"));

/** 把 HTML 挂到一个 detached 容器并启动引擎（autostart 默认 true） */
export function mount(html: string, state: any, options?: Partial<AutoSparkOptions>) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const store = new AutoStore(state);
    const engine = new AutoSpark(root, store, options);
    return { root, store, engine };
}

// formatHTML 单独放 ./format（不 import engine），便于 setup.ts 早期注册 matcher
// 而不牵连 engine 模块求值顺序。
export { formatHTML } from "./format";
