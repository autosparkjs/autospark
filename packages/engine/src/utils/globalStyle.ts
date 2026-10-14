import type { AutoSpark } from "../engine/engine";
import type { ComponentDef } from "../features/component/component-def";
import { injectStylesheet } from "./injectStylesheet";

/**
 * 组件全局样式注入器（ADR-0087）：`<style global>` 的 document 级注入与记账。
 *
 * 语义见 CONTEXT.md「全局样式」词条：
 * - **注册期注入**（声明即生效，无需实例化，`engine.registerComponentDef` 收口）；
 *   `engine.destroy()` 只移除本 engine 贡献的段，运行期常驻；
 * - **容器聚合**：无 id 段合并进共享容器 `<style id="autospark-styles">`，带 id 段用独立容器；
 *   同 id 段按声明序**追加**（跨组件共享主题池）；
 * - **覆盖声明整组替换保位**：同名组件重新声明时该 defName 的段被新段整组替换，Map 同 key
 *   赋值保持原插入位置（与 scoped 侧按 defName 缓存 + patch 模式按需覆写的行为对齐——
 *   ADR-0113 落地后该对齐为真，防幽灵样式）；
 * - **多 engine 共页共享容器**：账本按（容器 id → engine → defName）三级，重写时遍历**全体**
 *   engine 的段拼接（每 engine 独立重写会抹掉他人贡献）；
 * - 段清空的容器连 `<style>` 元素一并移除。
 */

/** 无 id 的 `<style global>` 归并的共享容器 id（已核查不与引擎既有 document 级资产撞名） */
export const GLOBAL_STYLE_CONTAINER_ID = "autospark-styles";

/** 账本：容器 id → engine → defName → 段文本列表（Map 保插入序 = 声明序） */
const ledger = new Map<string, Map<AutoSpark, Map<string, string[]>>>();

/**
 * 为组件定义注入 global 段（注册期调用；无 global 段零动作）。
 *
 * 同名组件覆盖声明场景（ADR-0022 决策四-4 后者覆盖）：同 defName 再次注入即整组替换。
 */
export function injectGlobalComponentStyles(engine: AutoSpark<any>, def: ComponentDef): void {
    const globals = def.styles?.filter((s) => s.global) ?? [];
    if (globals.length === 0) return;
    // 按容器 id 归组本 def 的段（一个 def 可向多个容器贡献）
    const byContainer = new Map<string, string[]>();
    for (const decl of globals) {
        const id = decl.id || GLOBAL_STYLE_CONTAINER_ID;
        const arr = byContainer.get(id) ?? [];
        arr.push(decl.css);
        byContainer.set(id, arr);
    }
    for (const [containerId, segments] of byContainer) {
        const engines = ledger.get(containerId) ?? new Map<AutoSpark, Map<string, string[]>>();
        ledger.set(containerId, engines);
        const defs = engines.get(engine) ?? new Map<string, string[]>();
        engines.set(engine, defs);
        defs.set(def.name, segments);
        rewriteContainer(containerId);
    }
}

/** 移除 engine 贡献的全部 global 段并重写受影响容器（engine.destroy 收口，不误伤其他 engine） */
export function releaseEngineGlobalStyles(engine: AutoSpark<any>): void {
    for (const [containerId, engines] of ledger) {
        if (!engines.has(engine)) continue;
        engines.delete(engine);
        if (engines.size === 0) ledger.delete(containerId);
        rewriteContainer(containerId);
    }
}

/** 按账本全体贡献者重写容器 textContent；段清空移除容器元素（容器 lazy 创建） */
function rewriteContainer(containerId: string): void {
    const engines = ledger.get(containerId);
    if (!engines || engines.size === 0) {
        removeContainerEl(containerId);
        return;
    }
    const parts: string[] = [];
    for (const defs of engines.values()) {
        for (const segments of defs.values()) parts.push(...segments);
    }
    if (parts.length === 0) {
        removeContainerEl(containerId);
        ledger.delete(containerId);
        return;
    }
    // 覆写/创建容器（injectStylesheet 幂等 + replace：容器不存在时创建——id 经 property
    // 赋值登记，happy-dom 查询表依赖该形态）
    injectStylesheet(parts.join("\n"), { id: containerId, mode: "replace" });
}

/** 按 id 移除容器 `<style>`（不存在则空操作） */
function removeContainerEl(containerId: string): void {
    document.head.querySelector(`style#${cssEscape(containerId)}`)?.remove();
}

/** CSS 标识符转义（id 选择器中特殊字符，对齐 scopedStyle.cssEscape） */
function cssEscape(s: string): string {
    return s.replace(/["\\]/g, "\\$&");
}
