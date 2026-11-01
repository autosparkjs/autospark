/**
 * 资源定义展开（ADR-0011）——三形态 → 平铺点号名 action 声明表。
 *
 * 三条注册路径（`AutoSpark.resources.add` 全局 / `<script type="autospark/resources">` /
 * `x-resource:名="url"` 指令）共用本展开枢纽：定义解析一次成型
 * `{ "order.get": decl, "order.getMany": decl, … }`，注入目标（插件全局表 / engine.actions /
 * scope.actions）由各路径自行落位。
 *
 * 方法解析优先级（共识 Q16/Q17）：
 * **手写方法（函数键）> 合并映射表命中**——映射合并链（逐层浅合并，后者覆盖）：
 * `DEFAULT_REST_MAPPING` ← `AutoSpark.resources.options.mapping`（全局默认层）
 * ← `options.resources.mapping`（engine 级）← 资源定义内联 `mapping`。
 *
 * 生成的映射方法执行体经 `this.engine`（action 上下文）**活取** engine 级请求选项
 * （声明无状态，可跨 engine 安全共享——与插件全局 action 表的惰性物化语义兼容）；
 * 请求选项三层回退（共识 Q13）：**资源定义内联 > engine options.resources > 全局默认**。
 */
import type { AutoSpark } from "autospark";
import { DEFAULT_REST_MAPPING, executeRequest } from "./mapping";
import type {
    RequestDesc,
    ResourceActionContext,
    ResourceDef,
    ResourceMapping,
    ResourceRequestOptions,
} from "./types";

/** ResourceObjectDef 的保留键（非手写方法）：url/mapping + 四个请求选项键 */
const RESERVED_KEYS = new Set(["url", "mapping", "baseUrl", "fetch", "headers", "unwrap"]);

/**
 * 解析资源定义三形态，拆出结构位：
 * - url（string 形态即定义；object 形态取 `url` 键；纯方法集为 null）；
 * - 内联请求选项（object 形态上的 baseUrl/fetch/headers/unwrap）；
 * - 手写方法表（object 形态上值为函数的自由键）；
 * - 内联映射（object 形态的 `mapping` 键）。
 */
function parseDef(def: ResourceDef): {
    url: string | null;
    inlineOptions: ResourceRequestOptions;
    methods: Record<string, (...args: any[]) => any>;
    inlineMapping: ResourceMapping | undefined;
} {
    if (typeof def === "string") return { url: def, inlineOptions: {}, methods: {}, inlineMapping: undefined };
    const url = typeof def.url === "string" ? def.url : null;
    const inlineOptions: ResourceRequestOptions = {};
    const methods: Record<string, (...args: any[]) => any> = {};
    let inlineMapping: ResourceMapping | undefined;
    for (const [key, value] of Object.entries(def)) {
        if (key === "mapping") {
            if (value && typeof value === "object") inlineMapping = value as ResourceMapping;
            continue;
        }
        if (RESERVED_KEYS.has(key)) {
            if (value !== undefined) (inlineOptions as any)[key] = value;
            continue;
        }
        if (typeof value === "function") methods[key] = value;
    }
    return { url, inlineOptions, methods, inlineMapping };
}

/**
 * 解析某次资源方法执行的最终请求选项（三层回退，共识 Q13）：
 * **资源定义内联 > engine options.resources > manager 全局默认**（与 ADR-0007
 * 「指令选项 → 宿主选项」缺失才回退的就近精神一致）。
 */
export function resolveRequestOptions(
    inlineOptions: ResourceRequestOptions,
    engine: AutoSpark<any> | undefined,
    globalOptions: ResourceRequestOptions,
): ResourceRequestOptions {
    const engineOptions = engine?.options?.resources as ResourceRequestOptions | undefined;
    return { ...globalOptions, ...engineOptions, ...inlineOptions };
}

/**
 * 合并映射表（逐层浅合并，后者覆盖；共识 Q16——无整表替换开关）。
 */
export function mergeMapping(
    engine: AutoSpark<any> | undefined,
    inlineMapping: ResourceMapping | undefined,
    globalMapping: ResourceMapping | undefined,
): ResourceMapping {
    // spread 对 undefined/null 天然跳过，无须回退空对象
    return {
        ...DEFAULT_REST_MAPPING,
        ...globalMapping,
        ...(engine?.options?.resources as any)?.mapping,
        ...inlineMapping,
    };
}

/**
 * 展开资源定义为平铺点号名 action 声明表。
 *
 * @param name         资源名（平铺前缀，如 `order` → `order.get`）
 * @param def          资源定义（三形态）
 * @param engine       目标 engine（读 options.resources 合并 mapping/请求选项；可 undefined——
 *                     全局注册时展开只依赖全局默认 + 内联，engine 级层由执行体活取）
 * @param globalOptions 全局默认请求选项（`AutoSpark.resources.options`，含全局 mapping 层）
 * @returns 点号名 → action 声明（函数形态，注入时经 engine 侧规范化包装获得三通道广播）
 */
export function expandResource(
    name: string,
    def: ResourceDef,
    engine?: AutoSpark<any>,
    globalOptions: ResourceRequestOptions & { mapping?: ResourceMapping } = {},
): Record<string, (...args: any[]) => any> {
    const { url, inlineOptions, methods, inlineMapping } = parseDef(def);
    const mapping = mergeMapping(engine, inlineMapping, globalOptions.mapping);
    const decls: Record<string, (...args: any[]) => any> = {};

    // 手写方法优先直挂（this = action 上下文，this.engine 可用；不经执行管线）
    for (const [method, fn] of Object.entries(methods)) {
        decls[`${name}.${method}`] = fn;
    }

    // 映射生成：须有打底 url（纯方法集无 url 时跳过——方法全部来自手写键）
    if (url) {
        for (const [method, rule] of Object.entries(mapping)) {
            if (decls[`${name}.${method}`]) continue; // 手写覆写优先
            decls[`${name}.${method}`] = function (this: ResourceActionContext, ...args: any[]) {
                const desc: RequestDesc = rule(url, ...args);
                const opts = resolveRequestOptions(
                    inlineOptions,
                    this?.engine ?? engine,
                    globalOptions,
                );
                return executeRequest(desc, opts);
            };
        }
    } else if (Object.keys(decls).length === 0) {
        // 既无 url 也无手写方法：空定义（warn 由调用方按注册路径记录，这里返回空表）
        return decls;
    }
    return decls;
}
