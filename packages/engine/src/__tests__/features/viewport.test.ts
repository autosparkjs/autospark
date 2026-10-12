import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount } from "../helpers";
import { AutoSpark } from "../../engine/engine";
import { ViewportManager, resolveViewportBreakpoints } from "../../features/viewport/manager";
import { META_KEY, META_MARK } from "../../consts";

/**
 * viewport 全局视口特性测试（ADR-0105）。
 *
 * 覆盖面：阈值表解析纯函数（缺省回退 / xs 与非法项 warn 忽略 / number 与 px 串双收 /
 * 全无效回退内置）、状态真相（`$.viewport` 构造期初值 + 跨档响应式写入 + 根元素
 * `data-viewport`）、`$` 元容器（严格保留键 warn+delete / META 标记复用 / destroy 残留）、
 * 三态配置（缺省开启 / `false` 整体关闭 / breakpoints 自定义）、生命周期（destroy 反注册）。
 *
 * 约定：happy-dom 的 matchMedia 无 change 事件通道——经可控 matchMedia 桩驱动
 * （宽度改值 + 手动触发监听）。断言面只落标量与属性标记（重型对象不进比较面）。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];

/** 挂载并登记待清理（viewport manager 不依赖 DOM 连接，无需 append body） */
function mountV(html: string, state: any, options?: any) {
    const m = mount(html, state, options);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
}

afterEach(() => {
    for (const e of engines.splice(0)) e.destroy();
    for (const r of roots.splice(0)) r.remove();
    restoreMatchMedia();
});

/** 劫持 console.warn 收集（同步窗口），透传 open 返回值 */
function captureWarns<T>(open: () => T): { result: T; warns: string[] } {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
    try {
        return { result: open(), warns };
    } finally {
        console.warn = orig;
    }
}

// ── 可控 matchMedia 桩（宽度驱动 matches + 手动派发 change）────────────────

const mqlFakes: any[] = [];
let realMatchMedia: any = null;

/** 安装桩：视口宽度 → 各 (min-width:Npx) 的 matches；setWidth 触发全部 change 监听 */
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
        /** 改视口宽度并广播（一次跨多档由全量重读兜住） */
        setWidth(w: number) {
            state.width = w;
            for (const f of mqlFakes) for (const cb of f._cb) cb();
        },
    };
}

/** 摘除 matchMedia（无环境 warn 场景；先保存真值供恢复） */
function deleteMatchMedia() {
    realMatchMedia ??= (globalThis as any).matchMedia;
    (globalThis as any).matchMedia = undefined;
    (window as any).matchMedia = undefined;
}

function restoreMatchMedia() {
    if (realMatchMedia == null) return;
    (globalThis as any).matchMedia = realMatchMedia;
    (window as any).matchMedia = realMatchMedia;
    realMatchMedia = null;
    mqlFakes.length = 0;
}

// ── 阈值表解析纯函数 ────────────────────────────────────────────────────

describe("resolveViewportBreakpoints", () => {
    test("缺省 → 内置缺省表（Bootstrap 5 对齐，升序）", () => {
        const t = resolveViewportBreakpoints(undefined);
        expect(t.tiers).toEqual(["sm", "md", "lg", "xl", "xxl"]);
        expect(t.thresholds).toEqual([576, 768, 992, 1200, 1400]);
    });

    test("xs 入阈值表与未知档位 warn + 忽略", () => {
        const warns: string[] = [];
        const t = resolveViewportBreakpoints({ xs: 300, huge: 800, sm: 600 }, (m) =>
            warns.push(m),
        );
        expect(warns.join("\n")).toContain("xs 是 < sm 的隐含兜底档");
        expect(warns.join("\n")).toContain("未知档位");
        expect(t.tiers).toEqual(["sm"]);
        expect(t.thresholds).toEqual([600]);
    });

    test("阈值 number 与 px 串双收、升序排序", () => {
        const t = resolveViewportBreakpoints({ lg: 900, sm: "600px", xxl: 1600 });
        expect(t.tiers).toEqual(["sm", "lg", "xxl"]);
        expect(t.thresholds).toEqual([600, 900, 1600]);
    });

    test("非 px 阈值 warn + 忽略（rem 等依赖布局基准）", () => {
        const warns: string[] = [];
        const t = resolveViewportBreakpoints({ sm: "40rem", md: 768 }, (m) => warns.push(m));
        expect(warns.join("\n")).toContain("无法解析为 px");
        expect(t.tiers).toEqual(["md"]);
    });

    test("整表无有效项 → 回退内置缺省表 + warn", () => {
        const warns: string[] = [];
        const t = resolveViewportBreakpoints({}, (m) => warns.push(m));
        expect(warns.join("\n")).toContain("无任何有效项");
        expect(t.tiers).toEqual(["sm", "md", "lg", "xl", "xxl"]);
    });
});

// ── 状态真相 ────────────────────────────────────────────────────────────

describe("viewport 状态真相", () => {
    test("构造期初值：$.viewport + 根元素 data-viewport + META 标记", () => {
        stubMatchMedia(1000); // ≥992 <1200 → lg
        const m = mountV("<div></div>", {});
        const state = m.engine.store.state as any;
        expect(state.$.viewport).toBe("lg");
        expect(m.engine.el.getAttribute("data-viewport")).toBe("lg");
        expect((state.$ as any)[META_MARK]).toBe(META_MARK);
        expect(m.engine.viewport instanceof ViewportManager).toBe(true);
        expect(m.engine.viewport.enabled).toBe(true);
    });

    test("跨档：$.viewport 响应式写入 + data-viewport 跟随（一次跨多档由全量重读兜住）", () => {
        const stub = stubMatchMedia(1000);
        const m = mountV("<div></div>", {});
        stub.setWidth(1500); // lg → xxl（跨 2 档）
        const state = m.engine.store.state as any;
        expect(state.$.viewport).toBe("xxl");
        expect(m.engine.el.getAttribute("data-viewport")).toBe("xxl");
        stub.setWidth(500); // → xs（兜底档）
        expect(state.$.viewport).toBe("xs");
        expect(m.engine.el.getAttribute("data-viewport")).toBe("xs");
    });
});

// ── $ 元容器（严格保留键）───────────────────────────────────────────────

describe("$ 元容器", () => {
    test("用户注入 state.$：warn + delete + 引擎重建", () => {
        stubMatchMedia(1000);
        const { result, warns } = captureWarns(() =>
            mountV("<div></div>", { $: { user: 1 } as any }),
        );
        expect(warns.join("\n")).toContain("保留键");
        const state = (result as any).engine.store.state as any;
        expect(state.$.user).toBeUndefined();
        expect(state.$.viewport).toBe("lg");
    });

    test("META 标记复用：同 state 重建 engine 不误删（无第二条 warn）", () => {
        stubMatchMedia(1000);
        const state: any = {};
        const el1 = document.createElement("div");
        const e1 = new AutoSpark(el1, state);
        engines.push(e1);
        roots.push(el1);
        expect(state.$.viewport).toBe("lg");
        e1.destroy(); // destroy 不清保留键——state.$ 残留（带 META 标记）
        const { warns } = captureWarns(() => {
            const el2 = document.createElement("div");
            const e2 = new AutoSpark(el2, state);
            engines.push(e2);
            roots.push(el2);
        });
        expect(warns.join("\n")).not.toContain("保留键");
        expect(state.$.viewport).toBe("lg"); // 档位随新 engine 重算，容器对象复用
    });

    test("destroy：mql 反注册 + data-viewport 摘除 + $.viewport 残留", () => {
        const stub = stubMatchMedia(1000);
        const m = mountV("<div></div>", {});
        m.engine.destroy();
        stub.setWidth(1500); // 销毁后跨档广播不触达
        expect(m.engine.el.hasAttribute("data-viewport")).toBe(false);
        expect((m.engine.store.state as any).$.viewport).toBe("lg");
    });
});

// ── 三态配置 ────────────────────────────────────────────────────────────

describe("options.viewport 三态", () => {
    test("false：整体关闭（不写 $、不挂属性、enabled false）", () => {
        stubMatchMedia(1000);
        const m = mountV("<div></div>", {}, { viewport: false });
        const state = m.engine.store.state as any;
        expect(state.$).toBeUndefined();
        expect(m.engine.el.hasAttribute("data-viewport")).toBe(false);
        expect(m.engine.viewport.enabled).toBe(false);
        m.engine.destroy(); // 未挂过属性，dispose 幂等
        expect(m.engine.el.hasAttribute("data-viewport")).toBe(false);
    });

    test("breakpoints 自定义：阈值生效（engine 级唯一真相）", () => {
        const stub = stubMatchMedia(600); // 自定义 sm:600 → 命中
        const m = mountV("<div></div>", {}, { viewport: { breakpoints: { sm: 600 } } });
        const state = m.engine.store.state as any;
        expect(state.$.viewport).toBe("sm");
        stub.setWidth(100); // < 600 → xs
        expect(state.$.viewport).toBe("xs");
    });

    test("无 matchMedia：warn 一次 + enabled false（状态不可用）", () => {
        deleteMatchMedia();
        const { result, warns } = captureWarns(() => mountV("<div></div>", {}));
        expect(warns.join("\n")).toContain("matchMedia");
        expect((result as any).engine.viewport.enabled).toBe(false);
        expect(((result as any).engine.store.state as any).$).toBeUndefined();
    });
});
