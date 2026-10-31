// 显式引入 layout 家族插件（外移后测试须自挂双路径自举）
import "../../directives/layout/index";

import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { parseViewportTiers, VIEWPORT_HIDDEN_CLASS } from "../../directives/layout/viewport";

/**
 * x-viewport 视口档位显隐测试（ADR-0106）。
 *
 * 覆盖面：值解析纯函数（单/多档 + trim / 未知档静默跳过 / 空值与全无效 null）、
 * 正反向显隐（隐藏类随 $.viewport 跨档切换）、值语法边界（未知档静默 / 空值与全无效
 * warn 忽略）、失效语义（viewport: false 恒可见零告警 / 非法 $.viewport 写入不动作）、
 * 与 x-show 组合（档位隐藏恒胜）。
 *
 * 约定：happy-dom 的 matchMedia 无 change 事件通道——经可控 matchMedia 桩驱动
 * （宽度改值 + 手动触发监听，档位经 ViewportManager → $.viewport 反映）。
 * 断言面只落标量与属性标记。
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

/** 宿主上的隐藏类开关态 */
const hiddenOf = (host: Element) => host.classList.contains(VIEWPORT_HIDDEN_CLASS);

afterEach(() => {
    for (const e of engines.splice(0)) e.destroy();
    for (const r of roots.splice(0)) r.remove();
    restoreMatchMedia();
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

// ── 可控 matchMedia 桩（宽度驱动 matches + 手动派发 change）────────────────

const mqlFakes: any[] = [];
let realMatchMedia: any = null;

function stubMatchMedia(initialWidth = 1000) {
    const state = { width: initialWidth };
    realMatchMedia ??= (globalThis as any).matchMedia;
    const factory = (query: string) => {
        const min = parseFloat(query.match(/min-width:\s*([\d.]+)px/)?.[1] ?? "0");
        const fake: any = {
            media: query,
            get matches() {
                return state.width >= min;
            },
            _cb: new Set<() => void>(),
            addEventListener(_t: string, cb: () => void) {
                fake._cb.add(cb);
            },
            removeEventListener(_t: string, cb: () => void) {
                fake._cb.delete(cb);
            },
        };
        mqlFakes.push(fake);
        return fake;
    };
    (globalThis as any).matchMedia = factory;
    (window as any).matchMedia = factory;
    return {
        setWidth(w: number) {
            state.width = w;
            for (const f of mqlFakes) for (const cb of f._cb) cb();
        },
    };
}

function restoreMatchMedia() {
    if (realMatchMedia == null) return;
    (globalThis as any).matchMedia = realMatchMedia;
    (window as any).matchMedia = realMatchMedia;
    realMatchMedia = null;
    mqlFakes.length = 0;
}

// ── 值解析纯函数 ────────────────────────────────────────────────────────

describe("parseViewportTiers", () => {
    test("单档与多档（含空白容忍）", () => {
        expect(parseViewportTiers("md")!.tiers).toEqual(new Set(["md"]));
        expect(parseViewportTiers("xs, sm")!.tiers).toEqual(new Set(["xs", "sm"]));
    });

    test("未知档名静默跳过", () => {
        expect(parseViewportTiers("md,foo")!.tiers).toEqual(new Set(["md"]));
    });

    test("空值与全无效返回 null（调用方 warn + 整体忽略）", () => {
        expect(parseViewportTiers(undefined)).toBeNull();
        expect(parseViewportTiers("")).toBeNull();
        expect(parseViewportTiers("foo,bar")).toBeNull();
    });
});

// ── 正反向显隐 ──────────────────────────────────────────────────────────

describe("x-viewport 显隐", () => {
    test("正向单档：仅 md 可见（跨档类切换）", async () => {
        const stub = stubMatchMedia(1000); // lg
        const m = mountV('<div x-viewport="md">内容</div>', {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(true); // lg ∉ {md} → 隐藏
        stub.setWidth(800); // md（store 通知走微任务批处理）
        await nextTick();
        expect(hiddenOf(host)).toBe(false);
        stub.setWidth(500); // xs
        await nextTick();
        expect(hiddenOf(host)).toBe(true);
    });

    test("正向多档：xs,sm 可见", async () => {
        const stub = stubMatchMedia(500); // xs
        const m = mountV('<div x-viewport="xs,sm">小屏内容</div>', {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(false);
        stub.setWidth(1000); // lg
        await nextTick();
        expect(hiddenOf(host)).toBe(true);
        stub.setWidth(600); // sm（自定义前内置表 576~768）
        await nextTick();
        expect(hiddenOf(host)).toBe(false);
    });

    test(".hide 反向：除 md 外可见", async () => {
        const stub = stubMatchMedia(800); // md
        const m = mountV('<div x-viewport.hide="md">md 上藏掉</div>', {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(true); // md ∈ 列出档 → 隐藏
        stub.setWidth(1000); // lg
        await nextTick();
        expect(hiddenOf(host)).toBe(false);
    });

    test("inline display 不被触碰（x-show 组合语义的物理前提）", () => {
        stubMatchMedia(1000);
        const m = mountV('<div x-viewport="md" style="display:flex">内容</div>', {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(host.style.display).toBe("flex"); // 隐藏走类，inline 原样
    });

    test("与 x-show 组合：档位隐藏恒胜", async () => {
        const stub = stubMatchMedia(1000); // lg → x-viewport="md" 隐藏
        const m = mountV('<div x-viewport="md" x-show="flag">内容</div>', { flag: true });
        const host = m.root.firstElementChild as HTMLElement;
        // 档位隐藏（类 ！important 恒胜）——即便 x-show 为真、inline display 可见
        expect(hiddenOf(host)).toBe(true);
        expect(host.style.display).toBe(""); // x-show 的通道照常（真 → 未写 none）
        stub.setWidth(800); // md 档 → 摘类，x-show 接管（flag true → 可见）
        await nextTick();
        expect(hiddenOf(host)).toBe(false);
    });
});

// ── 值语法边界 ──────────────────────────────────────────────────────────

describe("x-viewport 值语法边界", () => {
    test("未知档名静默跳过（零告警）+ 合法档照常生效", () => {
        const stub = stubMatchMedia(800); // md
        const warns = catchWarns(() => mountV('<div x-viewport="md,foo">内容</div>', {}));
        expect(warns.join("\n")).not.toContain("x-viewport");
        const host = (roots[roots.length - 1].firstElementChild) as HTMLElement;
        expect(hiddenOf(host)).toBe(false); // md ∈ {md} → 可见
    });

    test("空值：warn + 指令整体忽略（恒可见）", () => {
        stubMatchMedia(1000);
        const warns = catchWarns(() => mountV("<div x-viewport>内容</div>", {}));
        expect(warns.join("\n")).toContain("为空或无有效档位");
        const host = roots[roots.length - 1].firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(false);
    });

    test("全无效档名：warn + 指令整体忽略（恒可见）", () => {
        stubMatchMedia(1000);
        const warns = catchWarns(() => mountV('<div x-viewport="foo,bar">内容</div>', {}));
        expect(warns.join("\n")).toContain("为空或无有效档位");
        const host = roots[roots.length - 1].firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(false);
    });
});

// ── 失效语义 ────────────────────────────────────────────────────────────

describe("x-viewport 失效语义", () => {
    test("viewport: false：静默恒可见（正向 + 反向，零告警）", () => {
        stubMatchMedia(1000);
        const warns = catchWarns(() => {
            mountV('<div x-viewport="md">A</div>', {}, { viewport: false });
            mountV('<div x-viewport.hide="lg">B</div>', {}, { viewport: false });
        });
        expect(warns.join("\n")).not.toContain("x-viewport");
        const hosts = roots.slice(-2).map((r) => r.firstElementChild as HTMLElement);
        expect(hiddenOf(hosts[0])).toBe(false);
        expect(hiddenOf(hosts[1])).toBe(false);
    });

    test("非法 $.viewport 写入：不动作（保持原态）", () => {
        const stub = stubMatchMedia(1000); // lg ∉ {md} → 初始隐藏
        const m = mountV('<div x-viewport="md">内容</div>', {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(hiddenOf(host)).toBe(true);
        (m.engine.store.state as any).$.viewport = "foo"; // 违约写入
        expect(hiddenOf(host)).toBe(true); // 短路不动作——不摘类
    });

    test("全局样式表注入（幂等 id）", () => {
        stubMatchMedia(1000);
        mountV('<div x-viewport="md">内容</div>', {});
        const style = document.getElementById("autospark-viewport-styles");
        expect(style).toBeTruthy();
        expect(style!.textContent).toContain("display:none !important");
    });
});
