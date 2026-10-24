/**
 * 插件闭包构建插件（`@autospark/plugins/vite` 公开工具，ADR-0004）：
 *
 * 将 autospark 插件源码打包为「插件闭包」IIFE 脚本——产物外壳契约：
 *
 * ```js
 * (function (AutoSpark) { /* 打包体（源码 static import 已剥除，引用经闭包参数落定） *\/ })
 * (globalThis.AutoSpark);
 * ```
 *
 * 三项职责（一产物一次 vite build，本插件注入其中）：
 *
 * 1. **autospark 导入剥除**（transform 钩子，enforce: pre）：
 *    - `AutoSpark` 本名绑定 → 闭包参数直接落定，import 语句移除、引用零改写；
 *    - 其他具名导入（如 `markRaw`）→ 闭包体内 `const { markRaw } = AutoSpark`（语义即
 *      「命名空间成员」，与运行时桥 nsMember 同构）；
 *    - namespace / default 导入 → `const NS = AutoSpark`；
 *    - type 修饰的导入原样保留（TS 编译期剥除，产物零痕迹）。
 * 2. **exports 面剥除**（generateBundle）：闭包无 exports 面，入口的具名导出语句
 *    （`export {...}`）整体移除；残留其他 export 形态即报错（响而不哑）。
 * 3. **闭包外壳包裹**（generateBundle）：按定谳模板包裹打包体，`AutoSpark === undefined`
 *    （插件先于引擎加载，ADR-0114）时插件体入 `__AUTOSPARK_PLUGINS__` 预加载队列，
 *    engine 构造 drain 时以命名空间回放——**双路径自举的产物级载体**；冻结队列守卫与
 *    installPlugin「响而不哑」纪律对齐。包裹经换行对齐保持 sourcemap 行映射有效
 *    （sourcemap 注释先行剥除再回接，同 engine 产物后处理先例）。
 *
 * 产物零静态导入（脚本即契约，ADR-0003 决策 4）；源码级 static import 仅为构建期
 * 剥除的创作糖。工具自身为包内私有实现公开化，运行时插件开发仍走引擎裸机制词汇
 * （ADR-0003 决策 5），本工具不引入第二套插件抽象。
 */
import type { Plugin } from "vite";

/** 闭包参数名（外壳契约，与引擎全局命名空间同名——jQuery $ 同构，ADR-0111 决策 1） */
export const CLOSURE_PARAM = "AutoSpark";

/** 预加载队列键（engine 构造 drain，ADR-0114） */
export const PRELOAD_QUEUE_KEY = "__AUTOSPARK_PLUGINS__";

/**
 * autospark 完整形态导入（default + named / default + namespace / named / namespace）。
 * g1 type 修饰 | g2 default 本名 | g3 named 列表 | g4 namespace 本名 | g5 引号
 */
const IMPORT_FULL_RE =
    /import\s+(type\s+)?(?:(\w+)\s*,\s*)?(?:\{([^}]+)\}|\*\s+as\s+(\w+))\s*from\s*(["'])autospark\5/g;

/** 仅 default 导入。g1 type 修饰 | g2 本名 | g3 引号 */
const IMPORT_DEFAULT_RE = /import\s+(type\s+)?(\w+)\s*from\s*(["'])autospark\3/g;

/** 仅副作用导入（整语句剥除）。g1 引号 */
const IMPORT_BARE_RE = /import\s*(["'])autospark\1/g;

/** named 导入说明符：`imported`（可 `type` 前缀）与 `as local` 别名 */
const SPECIFIER_RE = /^(type\s+)?(\w+)(?:\s+as\s+(\w+))?$/;

/** 产物尾部 sourcemap 注释（包裹前剥除、包裹后回接，保证注解恒在产物末行） */
const SOURCEMAP_COMMENT_RE = /\n?\/\/#\s*sourceMappingURL=\S+\s*$/;

/**
 * 以空行补齐被替换语句的原行数：transform 钩子返回 null map 即「位置恒等」映射，
 * 行数对齐保证后续语句的 sourcemap 行坐标不漂移。
 */
function padToSameLineCount(replacement: string, original: string): string {
    const originalLines = original.split("\n").length;
    const emittedLines = replacement ? replacement.split("\n").length : 0;
    return replacement + "\n".repeat(Math.max(0, originalLines - emittedLines));
}

/**
 * 剥除模块源码中来自 "autospark" 的值导入（ADR-0004 创作糖）：
 * - `AutoSpark` 本名（named 未别名 / default 本名）→ 闭包参数直接绑定，零发射；
 * - 其他具名 → 合并为一条解构 `const { a: b } = AutoSpark`（`default` 键经类静态取用）；
 * - namespace / 别名本名 → `const NS = AutoSpark`；
 * - type 修饰 → 原样保留（TS 编译期剥除）；副作用导入 → 整语句剥除。
 *
 * 行数逐语句对齐（见 {@link padToSameLineCount}），无 autospark 导入的模块原样返回。
 */
export function transformAutosparkImports(code: string, id = "<unknown>"): string {
    if (!/["']autospark["']/.test(code)) return code;

    /** named 列表 → 发射语句数组（default / 别名本名走独立 const，其余合并解构） */
    const emitNamed = (list: string, id_: string): string[] => {
        const destructured: string[] = [];
        const plains: string[] = [];
        for (const raw of list.split(",")) {
            const spec = raw.trim();
            if (!spec) continue;
            const m = SPECIFIER_RE.exec(spec);
            if (!m) {
                throw new Error(`[autospark/plugins/vite] ${id_}: 无法解析导入说明符 "${spec}"`);
            }
            if (m[1]) continue; // 行内 type 修饰：TS 编译期剥除，零发射
            const imported = m[2];
            const local = m[3] ?? m[2];
            // default 与 AutoSpark 本名语义同为命名空间本体：default 经类静态不挂载
            // （engine IIFE 重排跳过 default 键），统一映射闭包参数
            if (imported === "default") {
                if (local !== CLOSURE_PARAM) plains.push(`const ${local} = ${CLOSURE_PARAM};`);
                continue;
            }
            if (imported === CLOSURE_PARAM && local === CLOSURE_PARAM) continue; // 闭包参数直接绑定
            destructured.push(imported === local ? imported : `${imported}: ${local}`);
        }
        const parts = plains;
        if (destructured.length) parts.push(`const { ${destructured.join(", ")} } = ${CLOSURE_PARAM};`);
        return parts;
    };

    let out = code;

    // 完整形态：default + named / default + namespace / named / namespace
    out = out.replace(IMPORT_FULL_RE, (stmt, typeKw, defaultLocal, namedList, nsLocal) => {
        if (typeKw) return padToSameLineCount("", stmt); // 类型导入零发射（TS 剥除）
        const parts: string[] = [];
        if (defaultLocal && defaultLocal !== CLOSURE_PARAM) {
            parts.push(`const ${defaultLocal} = ${CLOSURE_PARAM};`);
        }
        if (namedList) parts.push(...emitNamed(namedList, id));
        if (nsLocal) parts.push(`const ${nsLocal} = ${CLOSURE_PARAM};`);
        return padToSameLineCount(parts.join(" "), stmt);
    });

    // 仅 default
    out = out.replace(IMPORT_DEFAULT_RE, (stmt, typeKw, local) => {
        if (typeKw) return padToSameLineCount("", stmt);
        const emitted = local === CLOSURE_PARAM ? "" : `const ${local} = ${CLOSURE_PARAM};`;
        return padToSameLineCount(emitted, stmt);
    });

    // 仅副作用：整语句剥除
    out = out.replace(IMPORT_BARE_RE, (stmt) => padToSameLineCount("", stmt));

    return out;
}

/**
 * 剥除打包产物的 exports 面（闭包无 exports）：`export {...}` 语句（含 minified
 * `export{a as b};`）整体移除；残留任何其他 export 形态即报错——闭包体内 export 是
 * 语法错误，静默放行会把故障推迟到浏览器控制台。
 */
export function stripBundleExports(code: string): string {
    const stripped = code.replace(/\bexport\s*\{[^}]*\}\s*;?/g, "");
    const residual = /\bexport\s+(?:default\b|const\b|let\b|var\b|function\b|class\b|async\b)/.exec(stripped);
    if (residual) {
        throw new Error(
            "[autospark/plugins/vite] 产物存在闭包不支持的 export 形态" +
            `（"${residual[0]}…"）——插件闭包无 exports 面，请移除入口的具名导出（ADR-0004）`,
        );
    }
    return stripped;
}

/**
 * 闭包外壳包裹（定谳模板，ADR-0004）：
 * - 直路径：引擎已加载，插件体即刻执行（命名空间经闭包参数落定）；
 * - 队列路径：`AutoSpark === undefined` → 插件体入预加载队列，engine 构造 drain 时
 *   以 `(engine, autospark)` 回放（第二参即命名空间）；冻结队列守卫与 installPlugin
 *   「响而不哑」纪律对齐（队列已消费且全局不可达是集成错误，静默丢弃更难排查）。
 *
 * 返回 prefixLines 供 sourcemap 行偏移修正（包裹注入的前置行数）。
 */
export function wrapInPluginClosure(body: string): { code: string; prefixLines: number } {
    const prefix =
        `(function (${CLOSURE_PARAM}) {\n` +
        `    "use strict";\n` +
        `var run = function (${CLOSURE_PARAM}) {\n`;
    const suffix =
        `};\n` +
        `    if (${CLOSURE_PARAM} === undefined) {\n` +
        `        // 插件先于引擎加载（ADR-0114）：入预加载队列，engine 构造 drain 时以命名空间回放\n` +
        `        var queue = (globalThis.${PRELOAD_QUEUE_KEY} ??= []);\n` +
        `        if (Object.isFrozen(queue)) {\n` +
        `            console.error(` +
        `"插件闭包: 预加载队列已消费且全局 ${CLOSURE_PARAM} 不可达，插件未注册");\n` +
        `            return;\n` +
        `        }\n` +
        `        queue.push(function (engine, ns) { run(ns); });\n` +
        `    } else {\n` +
        `        run(${CLOSURE_PARAM});\n` +
        `    }\n` +
        `})(globalThis.${CLOSURE_PARAM});\n`;
    // 前置 3 行：(function …) / "use strict" / var run = function …
    return { code: prefix + body + suffix, prefixLines: 3 };
}

/** 产物内禁止残留的 autospark 引用（闭包体内 import 是语法错误，构建期即拦） */
function assertNoAutosparkRefs(code: string, fileName: string): void {
    if (/from\s*(["'])autospark\1/.test(code) || /import\s*\(\s*(["'])autospark\1/.test(code)) {
        throw new Error(
            `[autospark/plugins/vite] ${fileName}: 产物残留 autospark 导入——` +
            "闭包体内 import 是语法错误，请确认源码导入均来自 \"autospark\" 且未被重导出",
        );
    }
}

/**
 * 工厂：注入 vite build 即得单产物闭包打包（一产物一次 `vite build`，入口与输出
 * 文件名由构建配置决定——见包内 vite.config.ts 编排先例）。
 */
export function installAutosparkPlugin(): Plugin {
    return {
        name: "autospark-plugin-closure",
        enforce: "pre",
        transform(code, id) {
            const transformed = transformAutosparkImports(code, id);
            return transformed === code ? null : { code: transformed, map: null };
        },
        generateBundle(_options, bundle) {
            for (const chunk of Object.values(bundle)) {
                if (chunk.type !== "chunk") continue;
                // sourcemap 注释先行剥除（包裹后回接产物末行，注解位置契约不变）
                const smMatch = SOURCEMAP_COMMENT_RE.exec(chunk.code);
                const mapComment = smMatch ? smMatch[0].replace(/^\n/, "") : "";
                const body = smMatch ? chunk.code.slice(0, smMatch.index) : chunk.code;

                const stripped = stripBundleExports(body);
                assertNoAutosparkRefs(stripped, chunk.fileName);
                const wrapped = wrapInPluginClosure(stripped);

                chunk.code = wrapped.code + (mapComment ? `\n${mapComment}\n` : "");
                if (chunk.map) {
                    // 包裹注入的前置行数 → 全部映射段整体下移（VLQ 分号行分隔语义）
                    chunk.map.mappings = ";".repeat(wrapped.prefixLines) + chunk.map.mappings;
                }
            }
        },
    };
}
