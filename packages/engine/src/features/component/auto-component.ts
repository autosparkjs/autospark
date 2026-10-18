import type { AutoSpark } from "../../engine/engine";
import { presetDirectives } from "../../directives";
import { ComponentDirective } from "../../directives/x-component";
import { relaxedToJson } from "../../utils/relaxedToJson";

/**
 * 元素名组件（ADR-0117）：组件**缺省注册**为 **元素名形态指令**（`x-define-options.tag`
 * 缺省 `true` 自动推导 `x-{组件名}`，`false` 显式关闭）——`<x-counter>` 直接写元素标签
 * 即实例化，与 `<div x-component:counter>` 完全等价（宿主化身组件根、插槽/props/事件全量同构）。
 *
 * ## 机制（编译期剥除 + created 折叠，两段协作）
 *
 * - **编译期**（compiler.compileElement）：元素名命中自动组件类时，把 `:expr` 形态的
 *   响应式 props 属性从模板**临时剥除**（防被通用管线误实例化为 bind 指令）并 stash，
 *   scope 构建完成后原样恢复（原树不留痕，重编译幂等）；
 * - **运行期**（{@link createAutoComponentClass} 生成类的 created）：在调用 super 前
 *   注入组件名（`this.attr`）与折叠产物（`this.value` props 字面量 + `this.options`），
 *   随后走 ComponentDirective 既有通道——props 响应式、loader、边界覆盖、pending 重试
 *   等机制零复制。静态 props 属性折叠后从宿主移除（不留结果 DOM 残留）。
 *
 * ## props 折叠规则（元素名形态专属）
 *
 * - 保留属性（不折叠）：`class` / `style` / `id` / `data-*` / `x-*` / `@event`（事件
 *   本就是同元素 OnDirective）；
 * - `:name="expr"`：表达式条目（binding.watch 响应式），同名**覆盖**静态条目；
 * - 其余静态属性：类型推断——纯数字 → number、`true`/`false` → boolean、`{`/`[` 开头 →
 *   宽松 JSON（失败回退原字符串）、否则原样字符串；
 * - 优先级（ADR-0117 决策）：`:expr` > 静态属性 > `x-{组件名}-options.props`（兼容
 *   `x-component-options` 别名）——由值通道覆盖 options 通道的既有合并序天然保证。
 */

/** 自动组件生成类的静态标记（撞名判定 / 所有权豁免的判定依据） */
const AUTO_COMPONENT_MARKER = "__autosparkAutoComponent__";

/** 自动组件类的形态（工厂产物；静态携带组件名与元素名）——类型面由 typeof ComponentDirective 承载 */

/** 判定指令类是否为本机制生成的自动组件类 */
export function isAutoComponentClass(cls: unknown): cls is typeof ComponentDirective {
    return (
        !!cls &&
        typeof cls === "function" &&
        (cls as { [AUTO_COMPONENT_MARKER]?: true })[AUTO_COMPONENT_MARKER] === true
    );
}

/**
 * 元素名形态的保留属性（不折叠为 props，ADR-0117）：布局/标识属性留给宿主化身，
 * `x-*` 前缀是指令/选项族、`@` 前缀是事件绑定（同元素 OnDirective 承接）。
 */
export function isReservedElementAttr(name: string): boolean {
    return (
        name === "class" ||
        name === "style" ||
        name === "id" ||
        name.startsWith("data-") ||
        name.startsWith("x-")
    );
}

/** 静态属性值类型推断（ADR-0117 决策）：数字 / 布尔 / 宽松 JSON / 原样字符串 */
function inferStaticPropValue(raw: string): unknown {
    const value = raw.trim();
    if (value === "") return "";
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    if (value === "true") return true;
    if (value === "false") return false;
    if (value.startsWith("{") || value.startsWith("[")) {
        try {
            return JSON.parse(relaxedToJson(value));
        } catch {
            return raw; // 非法 JSON 回退原字符串
        }
    }
    return raw;
}

/** props 字面量键的合法性（标识符形态裸键，否则 JSON 引号键） */
function propLiteralKey(key: string): string {
    return /^[$A-Za-z_][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

/**
 * 折叠宿主元素属性为 props 对象字面量表达式文本。
 *
 * @param el     宿主元素（浅克隆，静态 props 属性在场；`:expr` 已被编译期剥除）
 * @param exprs  编译期 stash 的响应式 props（属性名 → 表达式文本）
 * @returns `{ value, foldedKeys }`；无任何可折叠属性时 value 为 undefined。
 *          字面量内表达式条目后置（同名覆盖静态条目，ADR-0117 优先级）。
 */
function foldElementProps(
    el: HTMLElement,
    exprs: Record<string, string>,
): { value: string | undefined; foldedKeys: string[] } {
    const staticEntries: string[] = [];
    const foldedKeys: string[] = [];
    for (const attr of Array.from(el.attributes)) {
        const name = attr.name;
        if (isReservedElementAttr(name) || name.startsWith(":") || name.startsWith("@")) continue;
        staticEntries.push(`${propLiteralKey(name)}: ${JSON.stringify(inferStaticPropValue(attr.value))}`);
        foldedKeys.push(name);
    }
    const exprEntries = Object.entries(exprs).map(
        ([key, expr]) => `${propLiteralKey(key)}: ${expr.trim()}`,
    );
    const entries = [...staticEntries, ...exprEntries];
    return { value: entries.length > 0 ? `{ ${entries.join(", ")} }` : undefined, foldedKeys };
}

/**
 * 读取元素名形态的组件选项属性（`x-{组件名}-options` 打底，`x-component-options` 兼容别名）。
 *
 * 元素名形态无同名主指令，该族属性在 getDirectives 解析中是孤儿（静默丢弃）——由本函数
 * 原始读取。解析失败 warn + 忽略（与 x-define-options 容错纪律一致）。
 */
function readElementComponentOptions(
    template: HTMLElement,
    componentName: string,
    warn: (msg: string) => void,
): Record<string, any> | undefined {
    let merged: Record<string, any> | undefined;
    const legacy = template.getAttribute("x-component-options");
    if (legacy != null && legacy.trim() !== "") {
        try {
            const parsed = JSON.parse(relaxedToJson(legacy));
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) merged = parsed;
            else warn(`x-component-options: 值须为普通对象，已忽略`);
        } catch (e: any) {
            warn(`x-component-options 解析失败，已忽略: ${e?.message ?? e}`);
        }
    }
    const own = template.getAttribute(`x-${componentName}-options`);
    if (own != null && own.trim() !== "") {
        try {
            const parsed = JSON.parse(relaxedToJson(own));
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                merged = { ...merged, ...parsed };
            } else {
                warn(`x-${componentName}-options: 值须为普通对象，已忽略`);
            }
        } catch (e: any) {
            warn(`x-${componentName}-options 解析失败，已忽略: ${e?.message ?? e}`);
        }
    }
    return merged;
}

/**
 * 生成元素名组件指令类（ADR-0117）。
 *
 * 继承 {@link ComponentDirective} 全量机制（宿主化身、插槽、props 响应式、loader、
 * pending 重试、递归保护），仅两处特化：
 * - `static elementName = tag`：元素名触发（scope 构造期 findByElementName 命中即实例化）；
 * - `created()`：先注入组件名 + 折叠产物（props 字面量 → 值通道、选项属性 → options 通道），
 *   清理宿主残留属性，再走 super 既有流程。
 *
 * 属性参数形态兼容：若指令信息已带 attr/value（显式 `x-{组件名}="..."` 属性写法）或同元素
 * 存在显式 `x-component:*` 声明，则本类完全让位（不注入、不折叠，走解析管线既有语义）。
 */
export function createAutoComponentClass(componentName: string, tag: string) {
    class AutoSparkElementComponent extends ComponentDirective {
        static override readonly elementName = tag;
        static readonly [AUTO_COMPONENT_MARKER] = true;
        static readonly autoComponentName = componentName;

        override created() {
            // 让位三态：属性参数形态（info 已带 attr/value）/ 同元素显式 x-component 声明——
            // 均按既有解析语义走，不注入元素名形态的合成信息
            if (
                this.info.attr !== undefined ||
                this.info.value !== undefined ||
                this.binding.directives.some((d) => d !== this && d.info.name === "component")
            ) {
                return;
            }
            const warn = (msg: string) => this.engine.logger.warn(msg);
            const template = this.template as HTMLElement;
            // ① 组件名（元素名形态无属性参数，静态注入）
            this.attr = componentName;
            // ② 选项属性合成（孤儿读取，见 readElementComponentOptions）——仅元素形态
            //    （info.options 未被解析管线填充）时生效
            if (!this.info.options && !this.info.optionExprs) {
                const opts = readElementComponentOptions(template, componentName, warn);
                if (opts) this.options = opts;
            }
            // ③ props 折叠（`:expr` 来自编译期 stash，静态属性来自宿主克隆）
            const exprs = this.engine.compiler.consumeAutoComponentProps(template) ?? {};
            const { value, foldedKeys } = foldElementProps(this.el, exprs);
            if (value !== undefined) this.value = value;
            for (const key of foldedKeys) this.el.removeAttribute(key);
            super.created();
        }
    }
    return AutoSparkElementComponent;
}

/**
 * 安装元素名组件指令（ADR-0117，{@link createAutoComponentClass} 产物的注册收口）。
 *
 * 由 `engine.registerComponentDef` 在 def 携带 `tag` 时调用（五条组件注册路径
 * 统一收口，凡注册必安装）。撞名规则：
 *
 * - 同注册名 + 同元素名（本机制重复安装，嵌套声明随实例重复收集）：**静默幂等跳过**；
 * - 撞预设指令名 / 用户自定义指令名 / 元素名被其他指令占用：**warn + 跳过**（不覆盖
 *   既有注册，与 install 的预设保护同纪律）；
 * - 同注册名 + 元素名变化（组件重声明且 tag 声明不同）：warn + 覆盖（组件定义
 *   本身已按覆盖语义更新，指令注册随之对齐）。
 */
export function installAutoComponentTag(
    engine: AutoSpark<any>,
    name: string,
    tag: string,
): void {
    const directives = engine.directives;
    const existing = directives.get(name);
    if (existing) {
        if (isAutoComponentClass(existing)) {
            if (existing.elementName === tag) return; // 幂等：同名同 tag
            engine.logger.warn(
                `x-define-options.tag: 组件 "${name}" 重声明元素名为 "${tag}"（原 "${existing.elementName}"），指令注册已覆盖`,
            );
        } else {
            const preset = Object.prototype.hasOwnProperty.call(presetDirectives, name);
            engine.logger.warn(
                `x-define-options.tag: 组件 "${name}" 撞已注册${preset ? "预设" : "自定义"}指令名 "${name}"，元素名 "${tag}" 注册已跳过（ADR-0117）`,
            );
            return;
        }
    }
    const occupant = directives.findByElementName(tag);
    if (occupant !== undefined && occupant !== name) {
        engine.logger.warn(
            `x-define-options.tag: 元素名 "${tag}" 已被指令 "${occupant}" 占用，组件 "${name}" 的元素名注册已跳过（ADR-0117）`,
        );
        return;
    }
    directives.set(name, createAutoComponentClass(name, tag) as any);
}
