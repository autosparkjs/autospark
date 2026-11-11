/**
 * autospark.button-group 组件插件（ADR-0014）：
 * 将多个 autospark.button 子钮组织成一排（水平缺省 / vertical 垂直）的容器组件——
 * 三职责：布局（gap 间隔 / 无 gap 融合 / 方向）、外观缺省下发（variant / type /
 * disabled，子钮未显式声明才继承）、选中协调（x-model 在场激活的单选 segmented）。
 *
 * precompile DOM 变换（button 范式移植）承担两件**子钮级**处理，故本变换须先于
 * button 插件的变换执行——聚合入口 import 顺序（button-group 在 button 前）与页面
 * 脚本加载顺序（autospark.button-group.js 先于 autospark.button.js）都是契约：
 * - 缺省下发：组级 variant / type / disabled stamp 到未显式声明的子钮 x-button 上
 *   （静态值原样、:绑定表达式原样转发，经 button 变换折叠进 props 响应式求值）；
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
            // —— 子钮级处理（先于 button 变换，见文件头契约）——
            // 只处理本组直接归属的子钮：嵌套组的子钮归内层组（closest 判定）
            const ownButtons = Array.from(el.querySelectorAll("x-button")).filter(
                (btn) => btn.closest("x-button-group") === el,
            );
            // 组级下发键的原始声明（静态与 :绑定两形态分开收集）
            const groupDecl = new Map<string, string>();
            for (const k of PROPAGATE_KEYS) {
                if (el.hasAttribute(k)) groupDecl.set(k, el.getAttribute(k)!);
                if (el.hasAttribute(`:${k}`)) groupDecl.set(`:${k}`, el.getAttribute(`:${k}`)!);
            }
            for (const btn of ownButtons) {
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
