/**
 * 数据脚本 `<script type="autospark/data">`（ADR-0032）
 *
 * 父元素数据域的 JS 对象字面量声明源（x-data 的超集）。编译父元素前由 compileElement
 * **预扫直接子级**收集（desugar 模型：位置无关，首渲正确性不依赖 script 书写位置），
 * 合成结果经 DataDirective 注入——挂载解析（ADR-0029 三形态）、键回收（attachedKeys CAS）、
 * 响应式通知全部复用既有管道，零特判。
 *
 * - **作用目标 = 直接父元素**（与 `<script type="autospark/actions">` 的最近祖先语义有意分歧：
 *   action 是惰性查找，数据是结构性的，归属必须一眼确定）；
 * - **内容语言 = JS 对象字面量**：`new Function` 求值，形参注入 `computed` / `configurable` /
 *   `watch` 三个 builder（autostore 转导出）——函数值一律是计算属性（AutoStore 见函数即求值）；
 * - **合成 = flex-tools `deepMerge`**：多个脚本按文档顺序后者覆盖前者；`options` 属性
 *   （relaxed-json）承载 mount/global/nearest，多个脚本同键后者覆盖；
 * - **错误姿态**：求值失败/非对象 → `logger.error` + 该脚本视为 `{}` 继续编译（与 actions 同款）。
 */
import { computed, configurable, watch } from "autostore";
// 子路径导入（非根入口）：根入口转导出 ./fs 子模块（node 内置 fs/path），浏览器 bundle 会解析失败
import { deepMerge } from "flex-tools/object";
import { relaxedToJson } from "../utils/relaxedToJson";
import type { AutoSpark } from "../engine";

/** 数据脚本的 type 值（ADR-0031 命名空间家族：autospark/actions、autospark/setup、autospark/data） */
export const DATA_SCRIPT_TYPE = "autospark/data";

/** 预扫产物：合成数据 + 可选挂载配置（`options` 属性） */
export interface DataScriptStash {
    data: Record<string, any>;
    options?: Record<string, any>;
}

/** 节点是否为数据脚本（compiler 剪枝 transformer 的 filter 与本模块共用同一真相源） */
export function isDataScript(node: Node): node is HTMLScriptElement {
    return node instanceof HTMLScriptElement && node.type === DATA_SCRIPT_TYPE;
}

/**
 * 预扫元素的**直接子级**数据脚本并合成。
 *
 * 每元素编译调用一次、随实例新鲜求值——x-for / x-use 复用同一模板时各实例拿到独立数据对象，
 * 嵌套对象不跨实例共享引用（x-data 属性值每次 parse 的等价保障）。
 *
 * @returns 合成产物；无数据脚本（且无 options 声明）返回 null
 */
export function collectDataScripts(
    engine: AutoSpark,
    template: HTMLElement,
): DataScriptStash | null {
    let data: Record<string, any> | null = null;
    let options: Record<string, any> | undefined;
    for (const child of template.children) {
        if (!isDataScript(child)) continue;
        // options 属性：relaxed-json 解析；多个脚本同键后者覆盖（与数据合成同序，ADR-0032 决策 6）
        const optRaw = child.getAttribute("options");
        if (optRaw != null) {
            try {
                const parsed: unknown = JSON.parse(relaxedToJson(optRaw));
                if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
                    engine.logger.error(
                        `<script type="${DATA_SCRIPT_TYPE}"> 的 options 属性须为对象，实际得到 ${JSON.stringify(parsed)}`,
                    );
                } else {
                    options = { ...options, ...(parsed as Record<string, any>) };
                }
            } catch (e: any) {
                engine.logger.error(
                    `<script type="${DATA_SCRIPT_TYPE}"> 的 options 属性解析失败: ${e?.message ?? e}`,
                );
            }
        }
        const text = child.textContent?.trim() ?? "";
        if (!text) continue;
        // 内容求值：注入 computed/configurable/watch 三个 builder 形参（ADR-0032 决策 2）。
        // this 无语义；外部全局变量技术上可见、不文档化背书（与 actions/setup 同姿态）。
        try {
            const result = new Function(
                "computed",
                "configurable",
                "watch",
                `return (${text})`,
            )(computed, configurable, watch);
            if (result === null || typeof result !== "object" || Array.isArray(result)) {
                engine.logger.error(
                    `<script type="${DATA_SCRIPT_TYPE}"> 内容须为对象字面量，实际得到 ${typeof result}`,
                );
                continue;
            }
            // 文档顺序深合并；末尾恒追加空对象 {}：flex-tools 按**最后一个实参**探测
            // $merge/$ignoreUndefined 指令键，追加空参使全部实参按数据合并，
            // 用户数据撞名 $merge 不被吞（ADR-0032 决策 5 调用纪律）
            data = data ? deepMerge(data, result, {}) : result;
        } catch (e: any) {
            // 错误姿态：该脚本视为 {} 继续编译，不中断（ADR-0032 决策 7）
            engine.logger.error(
                `<script type="${DATA_SCRIPT_TYPE}"> 求值失败: ${e?.message ?? e}`,
            );
        }
    }
    if (!data && !options) return null;
    return { data: data ?? {}, options };
}
