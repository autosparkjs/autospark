import type {
    ComponentDef,
    ComponentScopeBasis,
    ComponentSetup,
    ComponentHooks,
} from "../directives/component-def";
import { evalComponentSetup, mergeComponentSetups, extractComponentHooks } from "./setup";
import { extractStyleBinds, type StyleBind } from "../utils/styleBind";
import type { AutoSparkScope } from "../scope";
import { relaxedToJson } from "../utils/relaxedToJson";

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
 * 解析 `x-component-options` 属性为对象（宽松 JSON，ADR-0007 指令选项形态）。
 *
 * 组件元素在编译期前置 transformer 即被剪枝（不走 getDirectives 的通用指令选项解析），
 * 故在此手动解析。解析失败 warn + 返回 null（与 `<script setup>` 容错纪律一致）。
 */
function parseComponentOptions(
    componentEl: HTMLElement,
    warn: (msg: string) => void,
): Record<string, any> | null {
    const raw = componentEl.getAttribute("x-component-options");
    if (raw == null || raw.trim() === "") return null;
    try {
        const parsed = JSON.parse(relaxedToJson(raw));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
        warn(`x-component-options: 值须为普通对象，实际 ${JSON.stringify(parsed)}，已忽略`);
        return null;
    } catch (e: any) {
        warn(`x-component-options 解析失败，已忽略: ${e?.message ?? e}`);
        return null;
    }
}

/**
 * 提取组件数据边界声明（ADR-0053）：`open` 开关 + `scope` 基准。
 *
 * - `open`：布尔开关，默认 false（封闭）。`.open` 修饰符（`x-component.open`）是 `open:true` 的糖，
 *   显式 options 键优先（`{open:false}` 可关掉修饰符）。
 * - `scope`：`'host' | 'declarer'`，仅 `open` 为真时生效——**scope 声明而无 open → warn + 忽略**
 *   （基准没有生效条件）；非法值 warn + 忽略。
 */
function extractBoundaryOptions(
    componentEl: HTMLElement,
    modifierOpen: boolean,
    warn: (msg: string) => void,
): { open: boolean; scopeBasis: ComponentScopeBasis | undefined } {
    const opts = parseComponentOptions(componentEl, warn);
    const rawOpen = opts?.open;
    let open: boolean;
    if (typeof rawOpen === "boolean") {
        open = rawOpen; // 显式 options 键（含 false）优先于修饰符
    } else if (rawOpen !== undefined) {
        warn(`x-component-options.open: 须为布尔值，实际 ${JSON.stringify(rawOpen)}，已忽略`);
        open = modifierOpen;
    } else {
        open = modifierOpen;
    }
    let scopeBasis: ComponentScopeBasis | undefined;
    const rawScope = opts?.scope;
    if (rawScope !== undefined) {
        if (rawScope === "host" || rawScope === "declarer") {
            if (open) {
                scopeBasis = rawScope;
            } else {
                warn(
                    `x-component-options.scope: 基准仅在 open 声明时生效（组件默认封闭），声明被忽略（ADR-0053）`,
                );
            }
        } else {
            warn(
                `x-component-options.scope: 无效值 ${JSON.stringify(rawScope)}（须 'host'|'declarer'），已忽略（ADR-0053）`,
            );
        }
    }
    return { open, scopeBasis };
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
 * @param componentEl   原树中的 x-component 元素（读取子节点结构）
 * @param name          组件名
 * @param warn          warn 日志函数
 * @param declarerScope 声明处 scope（收集时归属的最近祖先 scope；全局组件无声明 scope 传 null）
 * @param modifierOpen  `.open` 修饰符（`x-component.open` 属性名形态）注入的 open:true
 * @returns 组件定义（snapshot 已剥离 script/style 子节点）
 */
export function buildComponentDef(
    componentEl: HTMLElement,
    name: string,
    warn: (msg: string) => void,
    declarerScope: AutoSparkScope | null = null,
    modifierOpen = false,
): ComponentDef {
    // 1. 原树收集 setup 文本与 style 文本（克隆前读，避免克隆后引用错位）
    const setupTexts: string[] = [];
    const rewrittenStyles: string[] = [];
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
            // 响应式 bind 提取（ADR-0022 决策四-4.1）：bind(expr) 替换为 var(--name, unset)，
            // binds 跨块按 expr 全局去重后存 def.styleBinds。rewritten 供后续 scoped 改写器消费。
            const { rewritten } = extractStyleBinds(raw, bindMap);
            rewrittenStyles.push(rewritten);
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
    // 4. 合并
    const setup: ComponentSetup | undefined = mergeComponentSetups(setups);
    const hooks: ComponentHooks | undefined = extractComponentHooks(setup);

    // 5. style 文本（已提取 bind 后的改写文本；空数组收敛为 undefined）
    const styles = rewrittenStyles.length > 0 ? rewrittenStyles : undefined;
    // bind 清单（跨 <style> 块全局去重；无 bind 时为 undefined）
    const styleBinds = bindMap.size > 0 ? Array.from(bindMap.values()) : undefined;

    // 数据边界声明（ADR-0053）：open 开关 + scope 基准（含 `.open` 修饰符合并与校验 warn）
    const { open, scopeBasis } = extractBoundaryOptions(componentEl, modifierOpen, warn);

    return {
        name,
        snapshot,
        setup,
        hooks,
        styles,
        styleBinds,
        open,
        scopeBasis,
        declarerScope,
    };
}
