import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount } from "../helpers";

/**
 * versions 版本清单归一测试（ADR-0120）。
 *
 * 覆盖面：`versions` 非空时构造期把 `$.version` 归一为清单值（未设/空回退末项默认
 * 版本；`version` 预置命中尊重；预置未命中 warn + 回退末项）；空/缺省清单不注入；
 * 运行时赋值自由（无校验、无告警——清单仅渲染侧语义，无导航/重载）。
 *
 * 约定：断言面只落 state 标量与告警收集；viewport:false 路径验证 ensureMetaContainer
 * 独立可用（归一不依赖视口特性）。
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

afterEach(() => {
    for (const e of engines.splice(0)) e.destroy();
    for (const r of roots.splice(0)) r.remove();
});

/** 劫持 console.warn 收集（同步窗口） */
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

describe("versions 清单归一（ADR-0120）", () => {
    test("versions 非空 + 未设 version → 写入默认版本（末项）", () => {
        const m = mountV("<div></div>", {}, { versions: ["1", "2"] });
        expect((m.engine.store.state as any).$.version).toBe("2");
    });

    test("versions 非空 + version 预置命中清单 → 尊重原值", () => {
        const m = mountV("<div></div>", {}, { version: "1", versions: ["1", "2"] });
        expect((m.engine.store.state as any).$.version).toBe("1");
    });

    test("versions 非空 + version 预置未命中清单 → warn + 回退默认版本（末项）", () => {
        const { result, warns } = captureWarns(() =>
            mountV("<div></div>", {}, { version: "9", versions: ["1", "2"] }),
        );
        expect(warns.join("\n")).toContain("不在 versions 清单中");
        expect((result.engine.store.state as any).$.version).toBe("2");
    });

    test("versions 空数组/缺省 → 不注入 $.version", () => {
        const m1 = mountV("<div></div>", {}, { versions: [] });
        expect((m1.engine.store.state as any).$.version).toBeUndefined();
        const m2 = mountV("<div></div>", {}, {});
        expect((m2.engine.store.state as any).$.version).toBeUndefined();
    });

    test("运行时赋值自由：未命中清单的值原样生效（无校验、无告警）", () => {
        const m = mountV("<div></div>", {}, { versions: ["1", "2"] });
        (m.engine.store.state as any).$.version = "9";
        expect((m.engine.store.state as any).$.version).toBe("9");
        (m.engine.store.state as any).$.version = undefined;
        expect((m.engine.store.state as any).$.version).toBeUndefined();
    });

    test("viewport:false 路径：归一走 ensureMetaContainer 独立可用", () => {
        const m = mountV("<div></div>", {}, { viewport: false, versions: ["1", "2"] });
        expect((m.engine.store.state as any).$.version).toBe("2");
    });
});
