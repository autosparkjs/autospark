import type {
    ComponentDef,
    ComponentDataContext,
    ComponentSetup,
    ComponentHooks,
    ComponentStyleDecl,
} from "../../features/component/component-def";
import { evalComponentSetup, mergeComponentSetups, extractComponentHooks } from "./setup";
import { extractStyleBinds, type StyleBind } from "../../utils/styleBind";
import type { AutoSparkScope } from "../scope";
import { relaxedToJson } from "../../utils/relaxedToJson";
import { getSlotMarker } from "../../utils/slot";

/** `<style global>` 段内 bind 调用检测（ADR-0087：global 段不支持 bind，仅 warn 不提取） */
const BIND_CALL_RE = /bind\s*\(/;

/**
 * 判定 `<script>` 是否为组件 `<script setup>`（ADR-0022 决策四）。
 *
 * 约定：`<script setup>`（type 属性缺失，靠 `setup` 布尔属性标识，仿 Vue SFC）或
 * `<script type="autospark/setup">`（ADR-0031 命名空间化）。二者择一识别为 setup 脚本；
 * 普通 `<script>`（无标识）不在此提取（由 compiler 的 `<script type="autospark/actions">`
 * 通道处理或原样保留）。旧写法 `type="setup"` 见 isLegacySetupScript（warn + 剪枝）。
 */
function isSetupScript(el: HTMLScriptElement): boolean {
    return el.hasAttribute("setup") || el.type === "autospark/setup";
}

/**
 * 旧写法 `type="setup"`（ADR-0031 更名前）：不再识别为 setup 脚本——warn 提示迁移后
 * 仍从快照剪枝（不进实例化 DOM、不求值），与 `<script type="actions">` 旧写法的
 * 「warn + 剪枝不执行」策略对称。
 */
function isLegacySetupScript(el: HTMLScriptElement): boolean {
    return el.type === "setup";
}

/**
 * 解析 `x-define-options` 属性为对象（宽松 JSON，ADR-0007 指令选项形态；属性名 ADR-0054）。
 *
 * 组件元素在编译期前置 transformer 即被剪枝（不走 getDirectives 的通用指令选项解析），
 * 故在此手动解析。解析失败 warn + 返回 null（与 `<script setup>` 容错纪律一致）。
 */
function parseComponentOptions(
    componentEl: HTMLElement,
    warn: (msg: string) => void,
): Record<string, any> | null {
    const raw = componentEl.getAttribute("x-define-options");
    if (raw == null || raw.trim() === "") return null;
    try {
        const parsed = JSON.parse(relaxedToJson(raw));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
        warn(`x-define-options: 值须为普通对象，实际 ${JSON.stringify(parsed)}，已忽略`);
        return null;
    } catch (e: any) {
        warn(`x-define-options 解析失败，已忽略: ${e?.message ?? e}`);
        return null;
    }
}

/**
 * 判定节点是否为组件**声明资源节点**（`<script setup>` / 旧写法 setup 脚本 / `<style>`）——
 * 继承解析收集覆盖段时须从子定义子节点中剔除（ADR-0081），它们不参与插槽分段。
 */
export function isDeclarativeResourceNode(node: Node): boolean {
    return (
        (node instanceof HTMLScriptElement &&
            (isSetupScript(node) || isLegacySetupScript(node))) ||
        node instanceof HTMLStyleElement
    );
}

/**
 * 元素是否带 x-define 声明属性（含修饰符形态，ADR-0053；指令名 ADR-0054）。
 *
 * 命中形态：`x-define`（正身）与 `x-define.open` 等带 `.` 修饰符段的属性名；
 * `x-define-options`（指令选项属性）**不是**声明形态——不命中（`x-define-` 前缀
 * 与 `x-define.` 修饰符前缀是两个不同边界，与 dispatcher 的保留规则同构）。
 * 实例化指令 `x-component:名称` 亦不命中（属性名整体是 `x-component:xxx`，与上述前缀均不同）。
 */
export function hasComponentDeclareAttr(el: HTMLElement): boolean {
    if (el.hasAttribute("x-define")) return true;
    for (const attr of Array.from(el.attributes)) {
        // 修饰符（x-define.open，ADR-0053）与属性参数（x-define:inherit，ADR-0081）两前缀均命中
        if (attr.name.startsWith("x-define.") || attr.name.startsWith("x-define:")) return true;
    }
    return false;
}

/**
 * 解析 x-define 声明属性：组件名（值，无值 `default`）+ 修饰符段（属性名 `.` 后段）+
 * 继承声明（属性参数 `x-define:inherit="父名"`，ADR-0081）。
 *
 * 未知修饰符 / 未知属性参数 warn + 忽略；`open` 修饰符注入边界开关（ADR-0053）。
 * 编译期收集器（`_collectComponent`）与运行时注册（`engine.registerComponent`，ADR-0086）
 * 共用本函数——声明语义只有一处实现，避免两条注册路径对「名 / 修饰符 / 继承」的读法漂移。
 *
 * @param el   带声明属性的元素（须已过 {@link hasComponentDeclareAttr} 门禁）
 * @param warn warn 日志函数
 * @returns 解析结果；元素**未命中**声明属性时返回 `null`
 */
export function parseComponentDeclare(
    el: HTMLElement,
    warn: (msg: string) => void,
): { name: string; modifierOpen: boolean; inherit: string | null } | null {
    if (!hasComponentDeclareAttr(el)) return null;
    let attrName = "x-define";
    let rawName = el.getAttribute("x-define");
    if (rawName == null) {
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith("x-define.")) {
                attrName = attr.name;
                rawName = attr.value;
                break;
            }
        }
    }
    const segments = attrName.slice("x-define".length).split(".").filter(Boolean);
    // 属性参数形态（ADR-0081）：`x-define:<参数>[.<修饰符>...]`——:inherit 承载继承声明
    // （:extends 为同义别名），其余参数名 warn + 忽略（按未继承处理）；参数形态的修饰符段
    // 并入统一修饰符池；两别名同时声明时文档序首个胜 + warn（应二选一）
    let inherit: string | null = null;
    for (const attr of Array.from(el.attributes)) {
        if (!attr.name.startsWith("x-define:")) continue;
        const rest = attr.name.slice("x-define:".length);
        const [param, ...mods] = rest.split(".");
        segments.push(...mods.filter(Boolean));
        if (param === "inherit" || param === "extends") {
            if (inherit !== null) {
                warn(
                    `x-define: :inherit 与 :extends 同时声明，首个（文档序）生效，后者已忽略（ADR-0081）`,
                );
                continue;
            }
            inherit = (attr.value ?? "").trim();
        } else {
            warn(
                `x-define: 未知属性参数 ":${param}"，已忽略（ADR-0081 仅提供 :inherit / :extends）`,
            );
        }
    }
    for (const seg of segments) {
        if (seg !== "open") {
            warn(`x-define: 未知修饰符 ".${seg}"，已忽略（ADR-0053 仅提供 .open）`);
        }
    }
    return {
        name: (rawName ?? "").trim() || "default",
        modifierOpen: segments.includes("open"),
        inherit,
    };
}

/**
 * 扫描组件根后代，warn「嵌套声明资源节点」（ADR-0086）。
 *
 * `<script setup>` / `<style>` **仅根的直接子级**被收集（`buildComponentDef` 只遍历直接子级），
 * 嵌套层级的同名节点会被原样留在快照里、不参与组件语义——对作者是易踩的静默失效。
 * 本函数只补一条 warn，**不改变收集行为**（ADR-0022 决策四的既有判定保持不变）。
 *
 * `<template>` 内容不在 `querySelectorAll` 结果内（inert 片段本就不渲染），无需覆盖。
 */
export function warnNestedResourceNodes(root: HTMLElement, warn: (msg: string) => void): void {
    for (const el of Array.from(root.querySelectorAll("*"))) {
        // 根的直接子级才是被收集的资源（buildComponentDef 只遍历直接子级），不 warn
        if (el.parentElement === root) continue;
        if (!(el instanceof HTMLElement) || !isDeclarativeResourceNode(el)) continue;
        const tag = el instanceof HTMLStyleElement ? "<style>" : "<script setup>";
        warn(
            `x-define "${root.getAttribute("x-define") ?? "default"}": ${tag} 嵌套在深层，` +
                `不作为组件资源收集（仅根的直接子级生效，ADR-0086）`,
        );
    }
}

/**
 * 提取组件数据边界声明的**原始声明值**（ADR-0053；ADR-0081 继承改造拆层）：
 * `open` / `dataContext` 均以「undefined = 未声明」返回，与「声明为 false」区分——
 * 继承场景须凭此判定「子重声明胜（含显式关闭）否则继承父」。
 * 值的合法性校验（类型 / 枚举）在本层完成；「dataContext 须配合 open」的耦合校验
 * 延迟到 `finalizeBoundaryOptions`（独立组件以 false 为基准、继承以生效 open 为基准）。
 */
export function extractBoundaryOptions(
    componentEl: HTMLElement,
    modifierOpen: boolean,
    warn: (msg: string) => void,
): { open: boolean | undefined; dataContext: ComponentDataContext | undefined } {
    const opts = parseComponentOptions(componentEl, warn);
    const rawOpen = opts?.open;
    let open: boolean | undefined;
    if (typeof rawOpen === "boolean") {
        open = rawOpen; // 显式 options 键（含 false）优先于修饰符
    } else {
        if (rawOpen !== undefined) {
            warn(`x-define-options.open: 须为布尔值，实际 ${JSON.stringify(rawOpen)}，已忽略`);
        }
        open = modifierOpen ? true : undefined;
    }
    let dataContext: ComponentDataContext | undefined;
    const rawCtx = opts?.dataContext;
    if (rawCtx !== undefined) {
        if (rawCtx === "host" || rawCtx === "declarer") {
            dataContext = rawCtx;
        } else {
            warn(
                `x-define-options.dataContext: 无效值 ${JSON.stringify(rawCtx)}（须 'host'|'declarer'），已忽略（ADR-0053）`,
            );
        }
    }
    return { open, dataContext };
}

/**
 * 边界声明收口（ADR-0081）：以**生效 open**（子声明 ?? 继承基准；独立组件基准为 false——
 * 传空 base 即得原行为）完成耦合校验与继承——子未重声明则 dataContext 随 open 一并继承父值。
 */
export function finalizeBoundaryOptions(
    raw: { open: boolean | undefined; dataContext: ComponentDataContext | undefined },
    base: { open?: boolean; dataContext?: ComponentDataContext },
    warn: (msg: string) => void,
): { open: boolean | undefined; dataContext: ComponentDataContext | undefined } {
    const open = raw.open ?? base.open ?? false;
    let dataContext: ComponentDataContext | undefined = base.dataContext;
    if (raw.dataContext !== undefined) {
        if (open) {
            dataContext = raw.dataContext;
        } else {
            warn(
                `x-define-options.dataContext: 基准仅在 open 声明时生效（组件默认封闭），声明被忽略（ADR-0053）`,
            );
            dataContext = undefined;
        }
    }
    if (open !== true) dataContext = undefined;
    return { open, dataContext };
}

/**
 * 扫描快照后代收集插槽出口清单（ADR-0056 决策二）。
 *
 * 仅扫后代（`querySelectorAll("*")` 不含根——出口是组件作者的结构声明，写在根上无意义）。
 * 同名重复出口：首个胜 + warn + 剥除后者的标记属性（防 snapshot 编译期二次实例化 SlotDirective）。
 *
 * @returns 出口名列表（含 `"default"`）；无出口返回 undefined
 */
function collectOutletSlots(root: HTMLElement, warn: (msg: string) => void): string[] | undefined {
    const slots: string[] = [];
    const seen = new Set<string>();
    for (const el of Array.from(root.querySelectorAll("*"))) {
        if (!(el instanceof HTMLElement)) continue;
        const marker = getSlotMarker(el);
        if (!marker) continue;
        if (seen.has(marker.name)) {
            warn(`x-slot: 出口 "${marker.name}" 重复声明，后者已忽略（ADR-0056）`);
            el.removeAttribute(marker.attrName);
            continue;
        }
        seen.add(marker.name);
        slots.push(marker.name);
    }
    return slots.length > 0 ? slots : undefined;
}

/**
 * 从组件元素（含 `<script setup>`/`<style>` 子节点）提取并组装组件定义（ADR-0022 决策二/四）。
 *
 * 核心步骤：
 * 1. 在原树收集所有 `<script setup>` 的文本内容与 `<style>` 的文本内容（克隆前读，引用稳定）；
 * 2. 深克隆元素为冻结快照，并在快照上**移除**这些 `<script setup>`/`<style>` 子节点（不进实例化 DOM）；
 * 3. 求值各 `<script setup>`（new Function，信任代码，失败 warn 丢弃，决策四-2/3）；
 * 4. 合并 setups（data 收集、methods 浅合并、同名 hooks 串行，决策四-1/R3=A）；
 * 5. 组装 ComponentDef（snapshot/setup/hooks/styles）。
 *
 * @param componentEl   原树中的 x-define 元素（读取子节点结构）
 * @param name          组件名
 * @param warn          warn 日志函数
 * @param declarerScope 声明处 scope（收集时归属的最近祖先 scope；全局组件无声明 scope 传 null）
 * @param modifierOpen  `.open` 修饰符（`x-define.open` 属性名形态）注入的 open:true
 * @returns 组件定义（snapshot 已剥离 script/style 子节点）
 */
export function buildComponentDef(
    componentEl: HTMLElement,
    name: string,
    warn: (msg: string) => void,
    declarerScope: AutoSparkScope | null = null,
    modifierOpen = false,
): ComponentDef {
    // 1. 原树收集 setup 文本与 style 声明段（克隆前读，避免克隆后引用错位）
    const setupTexts: string[] = [];
    const styleDecls: ComponentStyleDecl[] = [];
    // 跨多个 <style> 块共享的 expr→StyleBind 映射：同表达式全局去重（决策四-4.1-(2) 按表达式复用）
    const bindMap = new Map<string, StyleBind>();
    let hasSetupOrStyle = false;
    for (const child of Array.from(componentEl.children)) {
        if (child instanceof HTMLScriptElement && isSetupScript(child)) {
            setupTexts.push(child.textContent?.trim() ?? "");
            hasSetupOrStyle = true;
        } else if (child instanceof HTMLScriptElement && isLegacySetupScript(child)) {
            // 旧写法：warn + 剪枝（不求值），与 actions 旧写法策略对称（ADR-0031）
            warn(`<script type="setup"> 已更名为 <script type="autospark/setup">，该脚本不再求值`);
            hasSetupOrStyle = true;
        } else if (child instanceof HTMLStyleElement) {
            const raw = child.textContent ?? "";
            if (child.hasAttribute("global")) {
                // 全局样式段（ADR-0087）：注册期原样注入 head 容器，不做 scoped 改写、不参与
                // bind 提取；bind 检测 warn（非法声明由浏览器丢弃，不影响其余规则）
                if (BIND_CALL_RE.test(raw)) {
                    warn(
                        `<style global> 不支持 bind() 响应式（变量挂载点在全局语境无对应物），该声明已原样保留（ADR-0087）`,
                    );
                }
                styleDecls.push({
                    css: raw,
                    global: true,
                    id: child.getAttribute("id") ?? undefined,
                });
            } else {
                // 响应式 bind 提取（ADR-0022 决策四-4.1）：bind(expr) 替换为 var(--name, unset)，
                // binds 跨块按 expr 全局去重后存 def.styleBinds。rewritten 供后续 scoped 改写器消费。
                const { rewritten } = extractStyleBinds(raw, bindMap);
                styleDecls.push({ css: rewritten });
            }
            hasSetupOrStyle = true;
        }
    }

    // 2. 深克隆快照，移除 script setup / style（克隆后在快照上重新遍历，按相同判定移除）
    const snapshot = componentEl.cloneNode(true) as HTMLElement;
    if (hasSetupOrStyle) {
        for (const child of Array.from(snapshot.children)) {
            if (
                (child instanceof HTMLScriptElement &&
                    (isSetupScript(child) || isLegacySetupScript(child))) ||
                child instanceof HTMLStyleElement
            ) {
                child.remove();
            }
        }
    }

    // 3. 求值各 script setup
    const setups = [];
    for (const text of setupTexts) {
        const parsed = evalComponentSetup(text, name, warn);
        if (parsed) setups.push(parsed);
    }
    // 4. 合并（旧段名 data()/locals 在此 warn + 剪枝，ADR-0055）
    const setup: ComponentSetup | undefined = mergeComponentSetups(setups, warn);
    const hooks: ComponentHooks | undefined = extractComponentHooks(setup);

    // 5. style 声明段（scoped 段为已提取 bind 后的改写文本，global 段为原文；空数组收敛为 undefined）
    const styles = styleDecls.length > 0 ? styleDecls : undefined;
    // bind 清单（跨 <style> 块全局去重；无 bind 时为 undefined）
    const styleBinds = bindMap.size > 0 ? Array.from(bindMap.values()) : undefined;

    // 数据边界声明（ADR-0053）：原始提取 + 以 false 为基准收口（ADR-0081 拆层——继承场景由
    // resolveComponentInheritance 以父值为基准重算，独立组件行为与拆层前完全一致）
    const { open, dataContext } = finalizeBoundaryOptions(
        extractBoundaryOptions(componentEl, modifierOpen, warn),
        {},
        warn,
    );

    // 插槽出口清单（ADR-0056 决策二）：从快照后代自动推断（script/style 已剪枝，出口标记仍在）
    const slots = collectOutletSlots(snapshot, warn);

    return {
        name,
        snapshot,
        setup,
        hooks,
        styles,
        styleBinds,
        defaults: setup?.defaults,
        open,
        dataContext,
        declarerScope,
        slots,
    };
}
