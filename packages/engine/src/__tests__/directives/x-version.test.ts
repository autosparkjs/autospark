import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import {
    matchVersion,
    parseVersionMatch,
    VERSION_HIDDEN_CLASS,
} from "../../directives/x-version";
import type { VersionClause } from "../../directives/x-version";

/**
 * x-version 版本显隐测试（ADR-0119）。
 *
 * 覆盖面：值解析纯函数（裸值/显式算子 + 空白容忍、多子句 OR、正则内逗号不分割、
 * 转义斜杠、非法子句 invalid+token、空值 null）、匹配语义（字符串全等 + 数值相等
 * 兜底、!= 取反、有序数值与点分短段补零比较、不可比 false）、表达式矩阵（经
 * options.version 注入首值同步断言）、失效语义（空值零告警恒渲染 / $.version 未知
 * 恒渲染 / 非法子句 warn 整体忽略）、响应式（$.version 直写切类）、与 x-show 组合
 *（版本隐藏恒胜）、options.version 构造期注入（含 viewport:false 路径）。
 *
 * 约定：$.version 初值经 options.version 注入（构造期写元容器，首值即真值，同步可
 * 断言）；运行时切换经 engine.store.state.$.version 直写 + nextTick（store 通知走
 * 微任务批处理）。断言面只落 classList / style / state 标量。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];

/** 挂载并登记待清理 */
function mountV(html: string, state: any, options?: any) {
    const m = mount(html, state, options);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
}

/** 宿主上的版本隐藏类开关态 */
const hiddenOf = (host: Element) => host.classList.contains(VERSION_HIDDEN_CLASS);

/** 运行时直写 $.version（store 响应式代理——版本切换入口） */
const setVersion = (m: any, v: unknown) => {
    (m.engine.store.state as any).$.version = v;
};

afterEach(() => {
    for (const e of engines.splice(0)) e.destroy();
    for (const r of roots.splice(0)) r.remove();
});

/** 劫持 console.warn 收集（同步窗口） */
function catchWarns(open: () => void): string[] {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
    try {
        open();
    } finally {
        console.warn = orig;
    }
    return warns;
}

// ── 值解析纯函数 ────────────────────────────────────────────────────────

describe("parseVersionMatch", () => {
    test("裸值 ≡ =；显式算子与子句/token 空白容忍", () => {
        expect(parseVersionMatch("2")).toEqual({
            invalid: false,
            clauses: [{ type: "literal", op: "=", value: "2" }],
        });
        expect(parseVersionMatch(" <= 3 ")).toEqual({
            invalid: false,
            clauses: [{ type: "literal", op: "<=", value: "3" }],
        });
    });

    test("多子句 OR 切分 + 空白子句静默跳过", () => {
        const parsed = parseVersionMatch("<=3, =1 , 2 ,,")!;
        expect(parsed.invalid).toBe(false);
        expect((parsed as any).clauses).toHaveLength(3);
    });

    test("正则子句：/.../ 区间内逗号不分割，flags 保留", () => {
        const parsed = parseVersionMatch("/1,2/i")!;
        expect(parsed.invalid).toBe(false);
        const clause = (parsed as any).clauses[0];
        expect(clause.type).toBe("regex");
        expect(clause.re.source).toBe("1,2");
        expect(clause.re.flags).toBe("i");
    });

    test("正则内转义斜杠不提前收尾", () => {
        const parsed = parseVersionMatch("/a\\/b/")!;
        expect(parsed.invalid).toBe(false);
        expect((parsed as any).clauses[0].re.source).toBe("a\\/b");
        expect(matchVersion("a/b", (parsed as any).clauses)).toBe(true);
    });

    test("非法子句：悬空运算符 / 未闭合正则 / 非法 pattern → invalid + token", () => {
        expect(parseVersionMatch("<=")).toEqual({ invalid: true, token: "<=" });
        expect(parseVersionMatch("2,>")).toEqual({ invalid: true, token: ">" });
        expect(parseVersionMatch("/abc")).toEqual({ invalid: true, token: "/abc" });
        expect(parseVersionMatch("/a[/")).toEqual({ invalid: true, token: "/a[/" });
    });

    test("空值返回 null（静默忽略恒渲染）", () => {
        expect(parseVersionMatch(undefined)).toBeNull();
        expect(parseVersionMatch("")).toBeNull();
        expect(parseVersionMatch("   ")).toBeNull();
    });
});

// ── 匹配语义纯函数 ──────────────────────────────────────────────────────

describe("matchVersion", () => {
    const clausesOf = (raw: string): VersionClause[] => {
        const parsed = parseVersionMatch(raw);
        if (parsed == null || parsed.invalid) throw new Error(`解析失败: ${raw}`);
        return parsed.clauses;
    };

    test("相等：trim 后字符串全等 + 数值相等兜底", () => {
        expect(matchVersion("2", clausesOf("2"))).toBe(true);
        expect(matchVersion(" 2 ", clausesOf("2"))).toBe(true);
        expect(matchVersion(2, clausesOf("2"))).toBe(true); // $.version 写为数字
        expect(matchVersion("2.0", clausesOf("2"))).toBe(true); // 两侧均有限数值
        expect(matchVersion("3", clausesOf("2"))).toBe(false);
    });

    test("!= 取反；有序数值 / 点分短段补零比较；不可比 false", () => {
        expect(matchVersion("3", clausesOf("!=2"))).toBe(true);
        expect(matchVersion("2", clausesOf("!=2"))).toBe(false);
        expect(matchVersion("2", clausesOf(">=2"))).toBe(true);
        expect(matchVersion("1.9.9", clausesOf(">=2"))).toBe(false);
        expect(matchVersion("2.1.3", clausesOf("<=2.1.5"))).toBe(true);
        expect(matchVersion("2.1.6", clausesOf("<=2.1.5"))).toBe(false);
        expect(matchVersion("3", clausesOf("<=2.1.5"))).toBe(false);
        expect(matchVersion("abc", clausesOf("<3"))).toBe(false); // 不可比 → 子句 false
    });

    test("任一子句命中即 true（OR）", () => {
        const clauses = clausesOf("<=3,=1,2");
        expect(matchVersion("1", clauses)).toBe(true);
        expect(matchVersion("2", clauses)).toBe(true);
        expect(matchVersion("3", clauses)).toBe(true);
        expect(matchVersion("4", clauses)).toBe(false);
    });

    test("正则对原始字符串 test", () => {
        expect(matchVersion("2.1.3", clausesOf("/^2\\./"))).toBe(true);
        expect(matchVersion("3.0", clausesOf("/^2\\./"))).toBe(false);
        expect(matchVersion("1,2", clausesOf("/1,2/"))).toBe(true);
    });
});

// ── 表达式矩阵 ──────────────────────────────────────────────────────────

describe("x-version 表达式矩阵", () => {
    test('裸值 "2"：$.version="2" 可见 / "3" 隐藏', () => {
        const m1 = mountV('<div x-version="2">内容</div>', {}, { version: "2" });
        const m2 = mountV('<div x-version="2">内容</div>', {}, { version: "3" });
        expect(hiddenOf(m1.root.firstElementChild as HTMLElement)).toBe(false);
        expect(hiddenOf(m2.root.firstElementChild as HTMLElement)).toBe(true);
    });

    test('多子句 "<=3,=1,2"：任一命中即可见', () => {
        for (const v of ["1", "2", "3"]) {
            const m = mountV('<div x-version="<=3,=1,2">内容</div>', {}, { version: v });
            expect(hiddenOf(m.root.firstElementChild as HTMLElement)).toBe(false);
        }
        const m4 = mountV('<div x-version="<=3,=1,2">内容</div>', {}, { version: "4" });
        expect(hiddenOf(m4.root.firstElementChild as HTMLElement)).toBe(true);
    });

    test('!=2：非 2 可见 / 2 隐藏', () => {
        const m1 = mountV('<div x-version="!=2">内容</div>', {}, { version: "2" });
        const m2 = mountV('<div x-version="!=2">内容</div>', {}, { version: "3" });
        expect(hiddenOf(m1.root.firstElementChild as HTMLElement)).toBe(true);
        expect(hiddenOf(m2.root.firstElementChild as HTMLElement)).toBe(false);
    });

    test('>=2 数值有序：2 可见 / 1 隐藏', () => {
        const m1 = mountV('<div x-version=">=2">内容</div>', {}, { version: "2" });
        const m2 = mountV('<div x-version=">=2">内容</div>', {}, { version: "1" });
        expect(hiddenOf(m1.root.firstElementChild as HTMLElement)).toBe(false);
        expect(hiddenOf(m2.root.firstElementChild as HTMLElement)).toBe(true);
    });

    test('点分比较 "<=2.1.5"：2.1.3 可见 / 2.1.6 隐藏', () => {
        const m1 = mountV('<div x-version="<=2.1.5">内容</div>', {}, { version: "2.1.3" });
        const m2 = mountV('<div x-version="<=2.1.5">内容</div>', {}, { version: "2.1.6" });
        expect(hiddenOf(m1.root.firstElementChild as HTMLElement)).toBe(false);
        expect(hiddenOf(m2.root.firstElementChild as HTMLElement)).toBe(true);
    });

    test('正则 "/^2\\./"：2.x 可见 / 3.0 隐藏', () => {
        const m1 = mountV('<div x-version="/^2\\./">内容</div>', {}, { version: "2.1.3" });
        const m2 = mountV('<div x-version="/^2\\./">内容</div>', {}, { version: "3.0" });
        expect(hiddenOf(m1.root.firstElementChild as HTMLElement)).toBe(false);
        expect(hiddenOf(m2.root.firstElementChild as HTMLElement)).toBe(true);
    });

    test('正则内逗号 "/1,2/"：$.version="1,2" 可见（tokenizer 不分割）', () => {
        const m1 = mountV('<div x-version="/1,2/">内容</div>', {}, { version: "1,2" });
        const m2 = mountV('<div x-version="/1,2/">内容</div>', {}, { version: "3" });
        expect(hiddenOf(m1.root.firstElementChild as HTMLElement)).toBe(false);
        expect(hiddenOf(m2.root.firstElementChild as HTMLElement)).toBe(true);
    });

    test("inline display 不被触碰（x-show 组合语义的物理前提）", () => {
        const m = mountV(
            '<div x-version="2" style="display:flex">内容</div>',
            {},
            { version: "3" },
        );
        const host = m.root.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(true); // 隐藏走类
        expect(host.style.display).toBe("flex"); // inline 原样
    });
});

// ── 失效语义 ────────────────────────────────────────────────────────────

describe("x-version 失效语义", () => {
    test("无 x-version 值（空）：静默忽略恒渲染（零告警）", () => {
        const warns = catchWarns(() => mountV("<div x-version>内容</div>", {}, { version: "3" }));
        expect(warns.join("\n")).not.toContain("x-version");
        const host = roots[roots.length - 1]!.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(false);
    });

    test("$.version 未注入（版本未知）：静默短路恒渲染（零告警）", () => {
        const warns = catchWarns(() => mountV('<div x-version="2">内容</div>', {}));
        expect(warns.join("\n")).not.toContain("x-version");
        const host = roots[roots.length - 1]!.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(false);
    });

    test("非法子句（悬空运算符）：warn + 指令整体忽略（恒渲染）", () => {
        const warns = catchWarns(() =>
            mountV('<div x-version="2,>">内容</div>', {}, { version: "2" }),
        );
        expect(warns.join("\n")).toContain("非法子句");
        const host = roots[roots.length - 1]!.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(false);
    });

    test("非法子句（未闭合正则）：warn + 恒渲染", () => {
        const warns = catchWarns(() =>
            mountV('<div x-version="/abc">内容</div>', {}, { version: "2" }),
        );
        expect(warns.join("\n")).toContain("非法子句");
        const host = roots[roots.length - 1]!.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(false);
    });

    test("全局样式表注入（幂等 id）", () => {
        mountV('<div x-version="2">内容</div>', {}, { version: "2" });
        const style = document.getElementById("autospark-version-styles");
        expect(style).toBeTruthy();
        expect(style!.textContent).toContain("display:none !important");
    });
});

// ── 响应式 / 组合 / options 注入 ─────────────────────────────────────────

describe("x-version 响应式与组合", () => {
    test("响应式：$.version 赋值切换隐藏类（store watch 生效）", async () => {
        const m = mountV('<div x-version="2">内容</div>', {}, { version: "3" });
        const host = m.root.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(true);
        setVersion(m, "2");
        await nextTick();
        expect(hiddenOf(host)).toBe(false);
        setVersion(m, "3");
        await nextTick();
        expect(hiddenOf(host)).toBe(true);
    });

    test("与 x-show 组合：版本隐藏恒胜（类在即不可见，x-show 通道照常）", async () => {
        const m = mountV(
            '<div x-version="2" x-show="flag">内容</div>',
            { flag: true },
            { version: "3" },
        );
        const host = m.root.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(true); // 版本隐藏类（!important 恒胜）
        expect(host.style.display).toBe(""); // x-show（flag true）未写 none——通道互不覆盖
        setVersion(m, "2");
        await nextTick();
        expect(hiddenOf(host)).toBe(false); // 版本可见 → x-show 接管
    });

    test("options.version 构造期注入 $.version（首值即真值）", () => {
        const m = mountV('<div x-version="2.1.3">内容</div>', {}, { version: "2.1.3" });
        expect((m.engine.store.state as any).$.version).toBe("2.1.3");
        expect(hiddenOf(m.root.firstElementChild as HTMLElement)).toBe(false);
    });

    test("options.version 与 viewport:false 共存（元容器由版本注入建立）", () => {
        const m = mountV('<div x-version="2">内容</div>', {}, { version: "2", viewport: false });
        expect((m.engine.store.state as any).$.version).toBe("2");
        expect(hiddenOf(m.root.firstElementChild as HTMLElement)).toBe(false);
    });

    test('数值相等兜底：$.version 运行时写为数字 2 时 x-version="2" 可见', async () => {
        const m = mountV('<div x-version="2">内容</div>', {}, { version: "3" });
        const host = m.root.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(true);
        setVersion(m, 2);
        await nextTick();
        expect(hiddenOf(host)).toBe(false);
    });
});
