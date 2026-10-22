import { relaxedToJson } from "../../../utils/relaxedToJson";
import { CompileError } from "../../../errors";
import type { AutoDirectiveInfo } from "../types";

/** 指令整包 options 的解析策略（方案 A：静态优先，含函数降级表达式通道） */
interface FullOptionsParseResult {
    /** 静态快照（relaxedToJson → JSON.parse 成功才有；失败且含函数则 undefined） */
    static?: Record<string, any>;
    /** 表达式文本（套括号后）——仅 degraded 时在场，供运行期 eval + 响应式 */
    expr?: string;
    /** 是否函数降级（静态解析失败、含函数语法）——仅存表达式层，静态层留空让无 watcher 指令跳过 */
    degraded?: boolean;
}

/**
 * 解析整包 options（方案 A）：
 *
 * 1. 先试 relaxedToJson → JSON.parse（零开销静态快照）——成功即纯 JSON 对象
 *    （JSON 语义保证无状态引用、无表达式），**只写静态层**，不建表达式订阅；
 * 2. 失败且检测到函数语法（箭头 / function 关键字 / 简写方法） → **降级**：只存表达式层
 *    （expr 套括号 `(${raw})`，运行期 `new Function` 求值 + 响应式），静态层留空；
 * 3. 其他失败（纯语法错） → 正常抛 CompileError。
 */
function parseFullOptions(rawValue: string): FullOptionsParseResult {
    // 静态解析尝试
    try {
        const parsed: unknown = JSON.parse(relaxedToJson(rawValue));
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new CompileError(
                "options-invalid-object",
                `指令 options 必须是对象字符串，实际解析得到：${JSON.stringify(parsed)}`,
            );
        }
        return { static: parsed as Record<string, any> };
    } catch (err: any) {
        // 非 JSON.parse 失败 → 继续抛
        if (!(err instanceof SyntaxError)) throw err;
        // 检测是否函数语法（箭头 / function 关键字 / 对象简写方法 `{method(){}}`）
        if (rawOptionsHasFunc(rawValue)) {
            return { expr: `(${rawValue})`, degraded: true };
        }
        // 纯语法错，抛原错误
        throw new CompileError(
            "options-invalid-syntax",
            `指令 options 语法错误：${err.message}`,
        );
    }
}

/** 检测原始整包 options 是否含函数语法（箭头 / function 关键字 / 对象简写方法） */
function rawOptionsHasFunc(rawValue: string): boolean {
    return (
        /\(\s*\)\s*=>/.test(rawValue) ||
        /=>/.test(rawValue) ||
        /\bfunction\s*\(/.test(rawValue) ||
        /{\s*\w+\s*\([^)]*\)\s*\{/.test(rawValue)
    );
}

/** 事件绑定快捷前缀 */
const EVENT_PREFIX = "@";
/** 属性绑定快捷前缀 */
const BIND_PREFIX = ":";
/**
 * 指令 options 后缀家族匹配（ADR-0007 修订：选项定向与成员属性四形态）：
 * `<指令名>-options`（整包）| `<指令名>-options:<参数>[.成员]`（定向整包/定向成员/无定向成员）
 * | `<指令名>-options.<成员>`（成员属性）。非贪婪 + 回溯正确处理指令名自身含连字符的形态。
 */
const OPTIONS_SUFFIX_RE = /^(.+?)-options([:.].+)?$/;
/** 事件绑定指令名称（x-event 已过时重命名为 x-on，@ 与 x-on 均产出此名） */
const ON_DIRECTIVE_NAME = "on";
/** 属性绑定指令名称 */
const BIND_DIRECTIVE_NAME = "bind";
/** x-class / x-style 作为 x-bind 特化别名的指令名（解析期归一化为 bind+attr，零运行时实体） */
const CLASS_ALIAS_NAME = "class";
const STYLE_ALIAS_NAME = "style";

/**
 * `-options` 补充参数暂存（四形态；冒号形态的消歧延后到合并期——需主指令集合在场）。
 *
 * - 整包：`{ name, value }`（扫描期已 parseOptions）；
 * - 无定向成员：`{ name, member, expr }`（值 = 表达式文本）；
 * - 冒号形态：`{ name, colon, ... }`——`colon`（冒号后首段）匹配同名主指令 attr → 定向
 *   （带 `member` 为定向成员、不带为定向整包）；不匹配 → colon 降为（无定向）成员名。
 */
interface PendingOption {
    name: string;
    /** 整包解析结果（方案 A：静态 + expr 双通道） */
    fullParse?: FullOptionsParseResult;
    /** 冒号后首段原文（消歧候选：定向参数 or 成员名） */
    colon?: string;
    /** 成员名（dot 形态恒有） */
    member?: string;
    /** 成员表达式文本 */
    expr?: string;
    /** 冒号形态原始值（消歧定型后再 parseOptions 或作表达式文本） */
    rawValue?: string;
    /** 消歧后确定为「定向整包」形态（替换语义）——合并期 read */
    replace?: boolean;
}

/**
 * 拆分名称主体与修饰符
 *
 * 句点（.）为首段与其后修饰符的分隔符。首段可能进一步含冒号分隔的属性参数
 * （由调用方处理），这里只负责按 . 切分。
 *
 * @example
 * splitHeadAndModifiers("click")            // { head:"click", modifiers:[] }
 * splitHeadAndModifiers("click.debounce")   // { head:"click", modifiers:["debounce"] }
 * splitHeadAndModifiers("if.once.y")        // { head:"if", modifiers:["once","y"] }
 */
function splitHeadAndModifiers(rest: string): { head: string; modifiers: string[] } {
    const segments = rest.split(".");
    const head = segments[0] ?? "";
    const modifiers = segments.slice(1).filter((mod) => mod.length > 0);
    return { head, modifiers };
}

/** 取指令名匹配的**最后一个**指令信息（无定向 -options 的合并目标，"后声明生效"） */
function findLastByName(infos: AutoDirectiveInfo[], name: string): AutoDirectiveInfo | undefined {
    let target: AutoDirectiveInfo | undefined;
    for (const info of infos) {
        if (info.name === name) target = info;
    }
    return target;
}

/**
 * 成员名 kebab-case → camelCase 归一（ADR-0007 修订附则）。
 *
 * HTML 属性名被 DOM 全量小写化（`closeOnMask` 存取均为 `closeonmask`），camelCase 选项键
 * 须以 kebab-case 写法声明（`x-dialog-options.close-on-mask`，Web 平台惯例、Vue 同款）；
 * 纯小写单词成员（`props` / `message`）不受影响。归一在写入 optionExprs 前统一完成。
 */
function kebabToCamel(member: string): string {
    return member.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * 解析 options 补充参数值
 *
 * 使用 relaxedToJson 解析宽松 JSON（允许无引号键、尾逗号等），
 * 解析结果必须是普通对象，否则抛出错误。
 *
 * @param rawValue - 属性原始值，如 `{a:1}` 或 `{ name: "x", count: 3 }`
 */
function parseOptions(rawValue: string): Record<string, any> {
    const parsed: unknown = JSON.parse(relaxedToJson(rawValue));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new CompileError(
            "options-invalid-object",
            `指令 options 必须是对象字符串，实际解析得到：${JSON.stringify(parsed)}`,
        );
    }
    return parsed as Record<string, any>;
}

/**
 * 解析长前缀指令体
 *
 * 将形如 `bind:title.once` 的字符串解析为指令信息：
 * - 冒号（:）分隔指令名称与属性参数（attr）
 * - 句点（.）分隔修饰符（modifiers）
 *
 * @example
 * parsePrefixedDirective("if", "xxx")             // { name:"if", value:"xxx" }
 * parsePrefixedDirective("bind:title", "xxx")     // { name:"bind", attr:"title", value:"xxx" }
 * parsePrefixedDirective("if.once.y", "xxx")      // { name:"if", value:"xxx", modifiers:["once","y"] }
 */
function parsePrefixedDirective(rest: string, rawValue: string): AutoDirectiveInfo {
    const { head, modifiers } = splitHeadAndModifiers(rest);
    const info: AutoDirectiveInfo = { name: head };

    // head 可能形如 "name:attr"
    const colonIndex = head.indexOf(":");
    if (colonIndex >= 0) {
        info.name = head.slice(0, colonIndex);
        info.attr = head.slice(colonIndex + 1);
    }

    // 空值视为无值指令（如 x-calk），不输出 value 字段
    if (rawValue !== "") {
        info.value = rawValue;
    }
    if (modifiers.length > 0) {
        info.modifiers = modifiers;
    }
    return info;
}

/**
 *
 * 解析返回元素上的所有指令信息
 *
 * 指令形式：
 * <div x-if="xxx"></div>  // 普通指令，{name:"if",value:"xxx"}
 * <div x-calk></div>          // 只有名称没有值 {name:"calk"}
 * <div @click="xxxx"></div>    // 事件绑定指令,{name:"event",value:"xxx"}
 * <div x-event:click="xxx"></div>    // 事件绑定指令,{name:"event",value:"xxx"}
 * <div @click.debounce="xxx"></div>    // 事件绑定指令,{name:"event",value:"xxxx",attr:"click",modifiers:[debounce]}     *
 * <div x-bind:title="xxx"></div>   //   {name:"bind",value:"xxx",attr:"title"}
 * <div :title="xxx"></div>   //  {name:"bind",value:"xxx",attr:"title"},:title是快捷方式
 * <div x-if.once.y="xxx"></div> //{name:"if",value:"xxx",modifiers:["once","y"]}
 * <div x-if="xxx" x-if-options="{a:1}"></div> // {name:"if",value:"xxx",options:{a:1}}   以-options结性的视为对x-if指令的补充额外的选项参数
 *
 * x-if-options值必须是一个对象字符串，使用 relaxedToJson 进行解析
 *
 * 按顺序进行解析并返回结果
 *
 * 说明：
 * - 事件类指令（@event / x-on:name）统一解析为 name 为 "on"，事件名放入 attr，
 *   修饰符放入 modifiers；属性类指令（:attr / x-bind:name）统一解析为 name 为 "bind"。
 * - `@` 与 `:` 为固定快捷前缀，不受 prefix 参数影响；prefix 仅控制 x- 这类长前缀的识别。
 * - 指令选项（x-{name}-options）不单独占位，而是合并到同元素上同名指令的 options 字段；
 *   若找不到同名主指令则忽略（补充参数无主指令则无意义）。
 *   修订（ADR-0007）：-options 后缀家族扩展为四形态——整包 / 成员属性
 *   （`x-{name}-options.<成员>`，值为表达式，挂 optionExprs 字段）/ 定向整包 / 定向成员
 *   （`x-{name}-options:<参数>[.成员]`，冒号后首段匹配同名主指令 attr 即定向到该实例）。
 * - modifier（无参开关）在解析期注入为同名指令选项（options[name]=true，显式选项优先）；
 *   故指令层统一只读 options，不再读 modifiers（ADR-0007）。
 * - 元素级宿主选项（裸 x-options）不作为指令，由 getHostOptions 单独解析挂 scope。
 *
 * @param el
 */
export function getDirectives(el: HTMLElement, prefix = "x-"): AutoDirectiveInfo[] {
    if (!(el instanceof HTMLElement)) return [];
    const results: AutoDirectiveInfo[] = [];
    // 暂存 options 补充参数，待主指令收集完毕后合并（消歧需主指令集合在场）
    const pendingOptions: PendingOption[] = [];

    const attributes = el.attributes;
    for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        if (!attr) continue;
        const rawName = attr.name;
        const rawValue = attr.value;

        // 1. @ 事件快捷前缀：@click / @click.debounce -> { name:"on", attr:"click"[, modifiers] }
        if (rawName.startsWith(EVENT_PREFIX)) {
            const { head, modifiers } = splitHeadAndModifiers(rawName.slice(EVENT_PREFIX.length));
            const info: AutoDirectiveInfo = { name: ON_DIRECTIVE_NAME, attr: head };
            if (rawValue !== "") info.value = rawValue;
            if (modifiers.length > 0) info.modifiers = modifiers;
            results.push(info);
            continue;
        }

        // 2. : 属性绑定快捷前缀：:title / :title.mod -> { name:"bind", attr:"title"[, modifiers] }
        if (rawName.startsWith(BIND_PREFIX)) {
            const { head, modifiers } = splitHeadAndModifiers(rawName.slice(BIND_PREFIX.length));
            const info: AutoDirectiveInfo = { name: BIND_DIRECTIVE_NAME, attr: head };
            if (rawValue !== "") info.value = rawValue;
            if (modifiers.length > 0) info.modifiers = modifiers;
            results.push(info);
            continue;
        }

        // 3. x- 长前缀指令
        if (rawName.startsWith(prefix)) {
            const rest = rawName.slice(prefix.length);

            // 裸 x-options（元素级宿主选项）：不作为指令，由 getHostOptions 单独解析挂 scope（ADR-0007）
            if (rest === "options") continue;

            // 3a. -options 后缀家族（ADR-0007 修订四形态）——先于 3b 处理：
            //     `x-loading-options.delay` 的 .delay 是成员属性、不是 modifier。
            const optMatch = OPTIONS_SUFFIX_RE.exec(rest);
            if (optMatch) {
                const directiveName = optMatch[1]!;
                if (directiveName.length > 0) {
                    const suffix = optMatch[2] ?? "";
                    if (suffix === "") {
                        // ① 整包：parseFullOptions（静态快照 + expr 双通道，方案 A）
                        pendingOptions.push({
                            name: directiveName,
                            fullParse: parseFullOptions(rawValue),
                        });
                    } else if (suffix.startsWith(".")) {
                        // ② 成员属性（无定向）：值 = 表达式文本（指令经 binding.watch 求值）
                        const member = suffix.slice(1);
                        if (member === "" || member.includes(".")) {
                            throw new CompileError(
                                "options-member-invalid",
                                `指令选项成员属性须为单段成员名（${rawName}），多段/空成员不支持`,
                                { attr: rawName },
                            );
                        }
                        pendingOptions.push({ name: directiveName, member, expr: rawValue });
                    } else {
                        // ③ 冒号形态：定向整包 / 定向成员 / 无定向成员——消歧延后到合并期
                        const body = suffix.slice(1);
                        const dotIdx = body.indexOf(".");
                        pendingOptions.push(
                            dotIdx >= 0
                                ? {
                                      name: directiveName,
                                      colon: body.slice(0, dotIdx),
                                      member: body.slice(dotIdx + 1),
                                      expr: rawValue,
                                  }
                                : { name: directiveName, colon: body, rawValue },
                        );
                    }
                }
                continue;
            }

            // 3b. 普通长前缀指令：rest 形如 name | name:attr | name.mod | name:attr.mod
            const info = parsePrefixedDirective(rest, rawValue);
            // x-class / x-style 作为 x-bind 的特化别名（解析期归一化，零运行时实体）。
            // :class / x-bind:class 经短/长前缀分支已产出 bind+class，此处仅处理裸 x-class / x-style。
            if (info.name === CLASS_ALIAS_NAME) {
                info.name = BIND_DIRECTIVE_NAME;
                info.attr = "class";
            } else if (info.name === STYLE_ALIAS_NAME) {
                info.name = BIND_DIRECTIVE_NAME;
                info.attr = "style";
            }
            results.push(info);
            continue;
        }

        // 其余普通 HTML 属性（class、id 等）忽略
    }

    // 4. 将 -options 补充参数合并到已解析指令（ADR-0007 修订四形态 + 方案 A 函数降级）：
    //    - 整包 / 定向整包：纯静态 JSON（relaxedToJson 可解析——JSON 语义保证无状态引用）
    //      只写 target.options（零开销，不建订阅）；含函数（degraded）只写
    //      target.optionExprs.__directiveFull__（运行期 eval + 响应式），静态层留空；
    //    - 成员（含定向/无定向）：写入 optionExprs（既有行为不变，成员键优先于整包内嵌同名键）。
    //    消歧同既有：colon 首段匹配同名主指令 attr → 定向；否则 colon 降为无定向成员名。
    //    孤儿（找不到主指令）静默忽略。
    for (const opt of pendingOptions) {
        let target: AutoDirectiveInfo | undefined;
        let member = opt.member;
        let expr = opt.expr;
        let replace = opt.replace;
        let fullParse = opt.fullParse;
        if (opt.colon === undefined) {
            target = findLastByName(results, opt.name);
        } else {
            const targeted = results.find((i) => i.name === opt.name && i.attr === opt.colon);
            if (targeted) {
                target = targeted;
                if (member === undefined) {
                    // 定向整包（替换语义）
                    fullParse = parseFullOptions(opt.rawValue!);
                    replace = true;
                }
            } else if (opt.member !== undefined) {
                // `:a.b` 且 a 不匹配 attr：多段成员链——丢弃
                continue;
            } else {
                // 消歧为无定向成员：colon 即成员名，值 = 表达式文本
                target = findLastByName(results, opt.name);
                member = opt.colon;
                expr = opt.rawValue!;
            }
        }
        if (!target) continue; // 孤儿：静默忽略

        // 分支 1：整包 / 定向整包（fullParse 有值）
        if (fullParse) {
            if (fullParse.degraded) {
                // 含函数 → 只进表达式层（运行期 eval + 响应式；成员键优先守卫在 _watchOptionExprs）
                target.optionExprs = {
                    ...target.optionExprs,
                    __directiveFull__: fullParse.expr!,
                };
                // replace=true（定向整包）→ 清空旧静态层（旧值与新值不兼容）
                if (replace) target.options = undefined;
            } else if (fullParse.static) {
                // 纯静态 JSON → 只写静态层（零开销，不建订阅）
                target.options = replace || !target.options
                    ? fullParse.static
                    : { ...target.options, ...fullParse.static };
            }
            continue;
        }
        // 分支 2：成员属性（含定向/无定向）——既有行为不变
        if (member !== undefined && expr !== undefined) {
            target.optionExprs = { ...target.optionExprs, [kebabToCamel(member)]: expr };
        }
    }

    // 5. modifier 注入为指令选项（显式优先，ADR-0007）：modifier 是无参开关，等价 options[name]=true。
    //    纯数字段（已废 .debounce.500 的 "500"）不注入；显式 x-{name}-options 已写的键（含 false）不被覆盖。
    for (const info of results) {
        if (!info.modifiers || info.modifiers.length === 0) continue;
        if (!info.options) info.options = {};
        for (const m of info.modifiers) {
            if (/^\d+$/.test(m)) continue;
            if (!(m in info.options)) info.options[m] = true;
        }
    }

    return results;
}

/**
 * 解析元素级宿主选项 `x-options`（ADR-0007）。
 *
 * x-options 声明元素级共享配置，挂载到 scope.hostOptions，供同元素所有指令经
 * `getOption` 回退读取（指令选项未命中时回退到此）。值用宽松 JSON 解析，须为普通对象
 * （否则抛错，与 x-{name}-options 一致）。
 *
 * 与 getDirectives 分离：x-options 不是指令，不进入指令流（getDirectives 显式跳过裸 x-options）。
 *
 * @param el
 * @param prefix 指令前缀，默认 "x-"
 * @returns 解析后的宿主选项对象；元素无 x-options 属性时返回 undefined
 */
export function getHostOptions(
    el: HTMLElement,
    prefix = "x-",
): Record<string, any> | undefined {
    if (!(el instanceof HTMLElement)) return undefined;
    const raw = el.getAttribute(`${prefix}options`);
    if (raw == null) return undefined;
    return parseOptions(raw);
}
