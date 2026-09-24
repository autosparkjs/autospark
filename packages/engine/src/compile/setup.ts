import type {
    ComponentHookPhase,
    ComponentHooks,
    ComponentSetup,
} from "../directives/component-def";

/**
 * `<script setup>` 的合法钩子名（ADR-0022 决策三）。
 *
 * 求值 setup 对象时，只识别这四个键为生命周期钩子；其余键忽略（防误声明）。
 * 与 `ComponentHookPhase` 同源，单独列出便于 `Object.prototype.hasOwnProperty` 判定。
 */
const SETUP_HOOK_PHASES: readonly ComponentHookPhase[] = [
    "created",
    "mounted",
    "beforeUnmount",
    "unmounted",
];

/**
 * setup 的**段键**（ADR-0057）：这些键按段消费，不参与顶层私有变量收集。
 * `state` 特殊——函数值按旧 API warn 剪枝（ADR-0057 移除），非函数值视作普通顶层私有
 * （state 不再是保留键）。
 */
const SETUP_SECTION_KEYS: ReadonlySet<string> = new Set([
    "data",
    "methods",
    "locals",
    "state",
    ...SETUP_HOOK_PHASES,
]);

/**
 * 组件 this 上下文的**内置键**（ADR-0057）：顶层私有变量与之重名时 warn + 忽略（内置优先）。
 * `data` / `methods` / 钩子名是段键、天然不冲突，不入此列；`state` 已非保留键，亦不入列。
 */
const CONTEXT_RESERVED_KEYS: ReadonlySet<string> = new Set([
    "props",
    "globalState",
    "engine",
    "scope",
    "el",
    "$parent",
]);

/**
 * 深克隆组件 data 字面量（ADR-0057：对象字面量 per-instance 深克隆，多实例不共享嵌套引用）。
 *
 * 递归克隆普通对象与数组；原始值原样；函数、类实例等特殊对象**原样共享**（函数无状态可共享，
 * 类实例无法安全克隆）。data 字面量是用户声明的静态初始化值，此策略覆盖实际场景。
 */
function cloneDataValue<T>(v: T): T {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(cloneDataValue) as unknown as T;
    const proto = Object.getPrototypeOf(v);
    if (proto === Object.prototype || proto === null) {
        const out: Record<string, any> = {};
        for (const [k, val] of Object.entries(v as Record<string, any>)) {
            out[k] = cloneDataValue(val);
        }
        return out as T;
    }
    return v;
}

/**
 * 实例化时求出组件 data 的 per-instance 初始值（ADR-0057，供 injectComponentSemantics 调用）。
 *
 * - 工厂函数（含合并后的混合工厂）：每实例调用一次，天然新对象；
 * - 对象字面量：**深克隆**后返回（多实例不共享嵌套引用）；
 * - 未声明 data：返回 undefined。
 */
export function resolveComponentData(
    setup: ComponentSetup | undefined,
): Record<string, any> | undefined {
    const d = setup?.data;
    if (typeof d === "function") return (d as () => Record<string, any>)();
    if (d && typeof d === "object") return cloneDataValue(d);
    return undefined;
}

/**
 * 求值单个 `<script setup>` 文本为 setup 对象字面量（ADR-0022 决策四-2）。
 *
 * 经 `new Function('return ' + text)()` 求值——**信任代码**（用户声明信任）。
 * 求值失败 / 返回非对象 → warn + 返回 undefined（丢弃该 `<script setup>`，不阻断组件其余部分，
 * 决策四-3 容错）。
 *
 * @param text   `<script setup>` 的 textContent（已 trim）
 * @param name   组件名（仅供日志）
 * @param warn   warn 日志函数（传入 logger.warn）
 * @returns setup 对象，或 undefined（求值失败/非对象）
 */
export function evalComponentSetup(
    text: string,
    name: string,
    warn: (msg: string) => void,
): ComponentSetup | undefined {
    if (!text) return undefined;
    let result: any;
    try {
        result = new Function(`return (${text})`)();
    } catch (e: any) {
        warn(`x-define "${name}": <script setup> 求值失败，已丢弃: ${e?.message ?? e}`);
        return undefined;
    }
    if (!result || typeof result !== "object") {
        warn(`x-define "${name}": <script setup> 须返回对象字面量，已丢弃`);
        return undefined;
    }
    return result as ComponentSetup;
}

/**
 * 合并多个 `<script setup>` 求值结果（ADR-0022 决策四-1；数据模型 v2 见 ADR-0057）。
 *
 * 按段分类合并：
 * - `data`：**双形态**（ADR-0057）——对象字面量浅合并为单个对象（实例化时深克隆）、
 *   工厂函数依次调用合并返回值；对象与工厂混声明时归一化为单个工厂（先克隆各对象、再依次调工厂）；
 * - `methods`：浅合并（后者同名覆盖前者）；
 * - `locals`：浅合并（非响应式私有变量，后者同名覆盖前者）——程序化 `locals` 段与 HTML 形式的
 *   setup **顶层非保留键**同池收集；与内置上下文键重名 warn + 忽略；
 * - 同名 hook（created/mounted/...）：收集为数组，**按声明顺序串行**。
 *
 * 旧写法（ADR-0057 废弃）warn + 剪枝不生效：`state()` 函数（旧响应式工厂，现须写 `data`/`data()`）。
 * `state` 非函数值不再是保留键，按普通顶层私有变量收集。
 *
 * 无任何 setup 时返回 undefined（组件无数据/方法/钩子）。
 *
 * @param setups 各 `<script setup>` 的求值结果（按文档顺序，已过滤 undefined）
 * @param warn   warn 日志函数（传入 logger.warn，旧写法废弃/重名提示）
 */
export function mergeComponentSetups(
    setups: ComponentSetup[],
    warn: (msg: string) => void,
): ComponentSetup | undefined {
    if (setups.length === 0) return undefined;
    const dataObjects: Array<Record<string, any>> = [];
    const dataFns: Array<() => Record<string, any>> = [];
    const methods: Record<string, (...args: any[]) => any> = {};
    const locals: Record<string, any> = {};
    const hooks: ComponentHooks = {
        created: [],
        mounted: [],
        beforeUnmount: [],
        unmounted: [],
    };
    let hasHooks = false;
    let hasData = false;
    let hasMethods = false;
    let hasLocals = false;
    for (const s of setups) {
        // data：双形态收集（ADR-0057）——对象字面量（响应式初始数据，实例化时深克隆）
        // 与工厂函数（每实例调用）分池；非法类型 warn 忽略
        if (typeof s.data === "function") {
            dataFns.push(s.data as () => Record<string, any>);
            hasData = true;
        } else if (s.data && typeof s.data === "object") {
            dataObjects.push(s.data);
            hasData = true;
        } else if (s.data !== undefined) {
            warn("组件 <script setup> 段 data 须是对象或工厂函数（响应式数据），已忽略（ADR-0057）");
        }
        // 旧写法 state()：函数 → warn 指引更名 data/data()，剪枝不生效（ADR-0057）
        if (typeof (s as any).state === "function") {
            warn("组件 <script setup> 段 state() 已移除（ADR-0057 更名为 data / data()，响应式数据），该段已忽略");
        }
        // methods：浅合并
        if (s.methods && typeof s.methods === "object") {
            for (const [k, fn] of Object.entries(s.methods)) {
                if (typeof fn === "function") methods[k] = fn;
            }
            hasMethods = true;
        }
        // locals：程序化段浅合并（HTML 形式的顶层私有键在下方统一收集入同池）
        if (s.locals && typeof s.locals === "object") {
            Object.assign(locals, s.locals);
            hasLocals = true;
        }
        // setup 顶层其余键 → 私有变量（ADR-0057）：段键跳过（已单独处理）、内置键重名 warn 忽略
        for (const [k, v] of Object.entries(s)) {
            if (SETUP_SECTION_KEYS.has(k)) continue;
            if (CONTEXT_RESERVED_KEYS.has(k)) {
                warn(`组件 <script setup> 顶层变量 "${k}" 与内置上下文键重名，已忽略（请改名，ADR-0057）`);
                continue;
            }
            (locals as any)[k] = v;
            hasLocals = true;
        }
        // hooks：同名串行收集
        for (const phase of SETUP_HOOK_PHASES) {
            const fn = (s as any)[phase];
            if (typeof fn === "function") {
                hooks[phase].push(fn);
                hasHooks = true;
            }
        }
    }
    const merged: ComponentSetup = {};
    if (hasData) {
        if (dataFns.length === 0) {
            // 纯对象字面量：浅合并为单对象（实例化时 resolveComponentData 深克隆，per-instance）
            const data: Record<string, any> = Object.assign({}, ...dataObjects);
            merged.data = data;
        } else {
            // 含工厂（含对象+工厂混声明）：归一化为单个工厂——先克隆各对象字面量、再依次调工厂，
            // 后者同名键覆盖前者；单个工厂失败不阻断
            merged.data = () => {
                const out: Record<string, any> = {};
                for (const obj of dataObjects) Object.assign(out, cloneDataValue(obj));
                for (const fn of dataFns) {
                    try {
                        const r = fn();
                        if (r && typeof r === "object") Object.assign(out, r);
                    } catch {
                        /* 单个工厂失败不阻断，跳过该段 */
                    }
                }
                return out;
            };
        }
    }
    if (hasMethods) merged.methods = methods;
    if (hasLocals) merged.locals = locals;
    // hooks 单独返回（供实例化时克隆到 scope.hooks），不放进 setup 避免重复
    // 但为接口完整，setup 上的四阶段钩子取合并后数组的「首项」无意义——hooks 经第二返回值传递。
    // 此处把 hooks 挂到 merged 上以兼容 ComponentSetup 类型（实例化时优先读 hooks 字段）。
    if (hasHooks) {
        (merged as any)._hooks = hooks;
    }
    return merged;
}

/**
 * 从合并后的 setup 提取钩子表（供实例化时克隆到 scope.hooks）。
 *
 * @returns 钩子表（无钩子则各阶段为空数组）；始终返回非 null，实例化时按数组是否空决定是否触发。
 */
export function extractComponentHooks(setup: ComponentSetup | undefined): ComponentHooks | undefined {
    if (!setup) return undefined;
    const hooks = (setup as any)._hooks as ComponentHooks | undefined;
    if (!hooks) return undefined;
    // 过滤掉全空的情况
    const hasAny = SETUP_HOOK_PHASES.some((p) => hooks[p].length > 0);
    return hasAny ? hooks : undefined;
}
