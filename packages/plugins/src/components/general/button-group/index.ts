/**
 * autospark.button-group 组件插件（ADR-0014）：
 * 将多个 autospark.button 子钮组织成一排（水平缺省 / vertical 垂直）的容器组件——
 * 三职责：布局（gap 间隔 / 无 gap 融合 / 方向）、外观缺省下发（variant / type /
 * disabled，子钮未显式声明才继承）、选中协调（x-model 在场激活的单选 segmented）。
 *
 * precompile DOM 变换（button 范式移植）承担两件**子钮级**处理。契约序（本变换先于
 * button 插件的变换执行——聚合入口 import 顺序 button-group 在 button 前）下子钮是
 * x-button 原生标签、属性 stamp；**button 插件被更早加载时**（如 message-box 等组合
 * 消费方先引入）变换序倒挂、子钮已是 button 折叠宿主——本变换双形态处理（见
 * mountButtonGroupPlugin 形态二注释），正确性不依赖脚本加载顺序，契约序仅剩免解析的
 * 性能偏好：
 * - 缺省下发：组级 variant / type / disabled 到未显式声明的子钮（静态值原样、:绑定
 *   表达式原样转发，经 button 变换折叠进 props 响应式求值 / 折叠宿主直写值字面量）；
 * - data-value stamp：子钮静态 value 落一份为 data-value——button 变换折叠 props 后
 *   DOM 上 value 无痕，data-* 是 button 保留清单通道，组运行时由此读取子钮身份。
 *
 * x-model 在场检测在 precompile 期完成（编译后指令属性剥除、运行时不可查），
 * 塞 modelBound: true 进 props 激活选中模式；无 x-model 为纯布局组（工具栏用法，
 * 无选中态、无隐藏 input、无排他协调，ADR-0014 决策 4）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import buttonGroupTemplate from "./button-group.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab——注册名在 x-component 属性名位置被 DOM 全量小写化，camelCase 永不匹配） */
export const BUTTON_GROUP_NAME = "autospark.button-group";

/** 缺省下发键（ADR-0014 决策 3）：子钮未显式声明才继承的组级外观键 */
const PROPAGATE_KEYS = ["variant", "type", "disabled"] as const;

/** 组布尔 props（无值裸属性形态归一为 true——HTML 布尔属性惯例，vertical/block 写裸属性即启用） */
const GROUP_BOOL_PROPS = new Set(["vertical", "block"]);

/**
 * button 插件折叠宿主的定位常量（不 import button 模块——ESM 导入会使 button 模块体
 * 先于本模块执行、precompile 回调先注册，恰破坏文件头契约；与 x-button 标签名同属
 * 跨插件书面契约的硬编码）。折叠宿主形态：button 变换把 `<x-button>` 替换为
 * `<button x-component:autospark.button="{...}">`。
 */
const BUTTON_HOST_ATTR = "x-component:autospark.button";
const BUTTON_HOST_SELECTOR = "button[x-component\\:autospark\\.button]";

/**
 * 判定折叠宿主 props 字面量是否已显式声明某键（button 变换生成形态：`key: ` 裸标识符
 * + 冒号，静态值 JSON 双引号 / 表达式值圆括号）。字符串值内偶现 `key:` 文本的误命中
 * 只会多跳过一次下发（与「显式优先」语义方向一致，无害）。
 */
function literalDeclares(literal: string, key: string): boolean {
    return new RegExp(`[{,]\\s*${key}\\s*:`).test(literal);
}

/**
 * 从折叠宿主 props 字面量提取静态 value（button 变换生成形态恒 JSON 双引号字符串）；
 * `:value` 表达式项为 `(expr)` 形态不匹配——组 v1 仅静态值（ADR-0014 决策 5），
 * 缺席返回 null。
 */
function literalStaticValue(literal: string): string | null {
    const m = literal.match(/[{,]\s*value:\s*("(?:[^"\\]|\\.)*")/);
    if (!m) return null;
    try {
        const v = JSON.parse(m[1]);
        return typeof v === "string" ? v : String(v);
    } catch {
        return null;
    }
}

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 *
 * precompile 变换：静态属性折叠为 props 字面量（类型推断）、`:key="expr"` 响应式项
 * 以原始表达式拼进值对象字面量，class/style/id/name/title/data-* 保留给宿主（name
 * 透传内嵌 hidden input 作表单提交载体），子内容随迁为默认插槽。
 */
function mountButtonGroupPlugin(autospark: typeof AutoSpark): void {
    autospark.components[BUTTON_GROUP_NAME] = buttonGroupTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-button-group"))) {
            // —— 子钮级处理（双形态，precompile 回调注册序免疫）——
            // 契约序（button-group 先注册先执行）下子钮是 x-button 原生标签：属性 stamp，
            // button 变换随后折叠进 props。但 button 插件模块可能被更早加载的页面/测试先
            // 引入（如 message-box 组合消费 button，其 precompile 回调先注册）——此时本
            // 变换跑在 button 变换之后，子钮已是折叠宿主（<button x-component:...>）：
            // 下发键与 data-value 经 props 字面量补齐（缺失键追加到字面量末尾，与形态一
            // 的折叠产物完全同构；显式声明判定见 literalDeclares）。两形态都处理，「组级
            // stamp 先于 button 折叠」从加载序契约降级为性能偏好（形态一免解析），
            // 正确性不再依赖脚本加载顺序。
            // 只处理本组直接归属的子钮：嵌套组的子钮归内层组（closest 判定）
            const ownButtons = Array.from(
                el.querySelectorAll(`x-button, ${BUTTON_HOST_SELECTOR}`),
            ).filter((btn) => btn.closest("x-button-group") === el);
            // 组级下发键的原始声明（静态与 :绑定两形态分开收集）
            const groupDecl = new Map<string, string>();
            for (const k of PROPAGATE_KEYS) {
                if (el.hasAttribute(k)) groupDecl.set(k, el.getAttribute(k)!);
                if (el.hasAttribute(`:${k}`)) groupDecl.set(`:${k}`, el.getAttribute(`:${k}`)!);
            }
            for (const btn of ownButtons) {
                if (btn.tagName === "X-BUTTON") {
                    // 形态一（契约序）：x-button 原生标签——属性 stamp，button 变换随后折叠
                    // data-value stamp：静态 value 落一份（v1 仅静态——:value 响应式子钮值不支持，
                    // :data-value 会被 button 变换按 : 前缀折叠为 prop dataValue，ADR-0014 决策 5）
                    const v = btn.getAttribute("value");
                    if (v != null) btn.setAttribute("data-value", v);
                    // 缺省下发：子钮未显式声明（静态 / 绑定任一形态）才继承——显式恒优先；
                    // disabled 静态 stamp 统一写 "true"（无值空串经类型推断为 "" falsy，不禁用的坑）
                    for (const [k, raw] of groupDecl) {
                        if (btn.hasAttribute(k) || btn.hasAttribute(`:${k.slice(1)}`)) continue;
                        btn.setAttribute(k, k.startsWith(":") ? raw : k === "disabled" ? "true" : raw);
                    }
                    continue;
                }
                // 形态二（防御序）：button 变换已折叠——字面量补齐（追加项与形态一折叠产物同构）
                const literal = btn.getAttribute(BUTTON_HOST_ATTR) ?? "{ }";
                const extra: string[] = [];
                // data-value stamp：从字面量静态 value 键恢复（生成形态恒 JSON 双引号字符串）
                if (btn.getAttribute("data-value") == null) {
                    const v = literalStaticValue(literal);
                    if (v != null) btn.setAttribute("data-value", v);
                }
                // 缺省下发：字面量未显式声明才继承；静态值 JSON 化（disabled 恒 true，同形态一
                // 的 "true" 归一）、:绑定以圆括号表达式原样转发（button 变换 :expr 同款约定）
                for (const [k, raw] of groupDecl) {
                    const key = k.startsWith(":") ? k.slice(1) : k;
                    if (literalDeclares(literal, key)) continue;
                    extra.push(
                        `${key}: ${k.startsWith(":") ? `(${raw})` : JSON.stringify(k === "disabled" ? true : inferPropValue(raw))}`,
                    );
                }
                if (extra.length > 0) {
                    // 追加到字面量末尾（空字面量 `{  }` 无前导逗号），产物与形态一折叠结果同构
                    const base = literal.replace(/\}\s*$/, "").replace(/\s+$/, "");
                    const head = base.endsWith("{") ? base : `${base},`;
                    btn.setAttribute(BUTTON_HOST_ATTR, `${head} ${extra.join(", ")} }`);
                }
            }
            // —— 组自身折叠（button 变换同款）——
            const root = document.createElement("div");
            const parts: string[] = [];
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith(":")) {
                    parts.push(`${propKey(kebabToCamel(attr.name.slice(1)))}: (${attr.value})`);
                    continue;
                }
                const kept =
                    attr.name === "class" ||
                    attr.name === "style" ||
                    attr.name === "id" ||
                    attr.name === "name" || // 透传内嵌 hidden input（表单提交载体）
                    attr.name === "title" ||
                    attr.name.startsWith("data-") ||
                    attr.name.startsWith("x-") || // 指令/选项族（x-model、x-on 等）留给引擎编译消费
                    attr.name.startsWith("@"); // 事件绑定（化身封闭域求值，外层状态事件写包裹元素）
                if (kept) {
                    root.setAttribute(attr.name, attr.value);
                    continue;
                }
                // 布尔键无值形态归一 true（裸 vertical/block）；其余走通用类型推断
                const camelName = kebabToCamel(attr.name);
                const val =
                    attr.value === "" && GROUP_BOOL_PROPS.has(camelName)
                        ? true
                        : inferPropValue(attr.value);
                parts.push(`${propKey(camelName)}: ${JSON.stringify(val)}`);
            }
            // x-model 在场 → 选中模式激活（ADR-0014 决策 4；塞内部键非公开 API）
            if (el.hasAttribute("x-model")) parts.push("modelBound: true");
            root.setAttribute(`x-component:${BUTTON_GROUP_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) root.appendChild(el.firstChild);
            el.replaceWith(root);
        }
    });
}

bootstrapButtonGroupPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapButtonGroupPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountButtonGroupPlugin(autospark);
    });
}

export { bootstrapButtonGroupPlugin };
