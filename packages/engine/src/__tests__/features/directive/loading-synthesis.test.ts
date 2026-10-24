import { describe, expect, test } from "bun:test";
import "../../setup";
import type { AutoSparkScope } from "../../../engine/scope";
import {
    createLoadingMask,
    injectLoadMeta,
    type LoadingMaskOptions,
} from "../../../features/directive/loading-synthesis";

/**
 * x-loading 合成共享层单测（ADR-0126）：DOM-free（遮罩部分只操作传入元素），
 * 覆盖守卫 / 所有权闸 / toggle 与 release 两协议 / options 透传 / 元键注入。
 */

/** 空白 div 宿主 */
const host = (): HTMLElement => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    return el;
};

/** 最小 scope 替身（injectLoadMeta 只读写字段 + 调 invalidateScopeView / 遍历 children） */
const fakeScope = (children: AutoSparkScope[] = []) =>
    ({
        locals: undefined,
        children,
        invalidateScopeView() {},
    }) as unknown as AutoSparkScope;

describe("createLoadingMask 守卫与所有权闸（ADR-0126 决策 5）", () => {
    test("默认合成：show 置 x-loading=true，synthed=true", () => {
        const el = host();
        const mask = createLoadingMask(el);
        expect(mask.synthed).toBe(false);
        mask.show();
        expect(el.getAttribute("x-loading")).toBe("true");
        expect(mask.synthed).toBe(true);
    });

    test("宿主手写 x-loading → 不合成不触碰（synthed 恒 false）", () => {
        const el = host();
        el.setAttribute("x-loading", "true");
        const mask = createLoadingMask(el);
        mask.show({ message: "x" });
        expect(el.getAttribute("x-loading")).toBe("true"); // 原值未被改写
        expect(el.hasAttribute("x-loading-options")).toBe(false); // 未透传
        expect(mask.synthed).toBe(false);
        mask.hide();
        mask.release();
        expect(el.getAttribute("x-loading")).toBe("true"); // 所有权闸：hide/release 全 no-op
    });

    test("loading:false → 不合成", () => {
        const el = host();
        const mask = createLoadingMask(el);
        mask.show(false);
        expect(el.hasAttribute("x-loading")).toBe(false);
        expect(mask.synthed).toBe(false);
    });

    test("重入 show 不重判守卫：已合成的属性直接翻 true（teardown 后重新守卫判定）", () => {
        const el = host();
        const mask = createLoadingMask(el);
        mask.show();
        mask.hide();
        expect(el.getAttribute("x-loading")).toBe("false");
        mask.show(); // 所有权仍在 → 直接翻 true
        expect(el.getAttribute("x-loading")).toBe("true");
        mask.release(); // 摘除 + 所有权释放
        expect(el.hasAttribute("x-loading")).toBe(false);
        expect(mask.synthed).toBe(false);
        // release 后 show 重新走守卫判定（无手写 → 重新合成）
        mask.show();
        expect(el.getAttribute("x-loading")).toBe("true");
    });

    test("release 后宿主手写 x-loading → 再 show 不覆盖", () => {
        const el = host();
        const mask = createLoadingMask(el);
        mask.show();
        mask.release();
        el.setAttribute("x-loading", "progressbar");
        mask.show();
        expect(el.getAttribute("x-loading")).toBe("progressbar");
        expect(mask.synthed).toBe(false);
    });
});

describe("createLoadingMask options 透传（ADR-0126 决策 2）", () => {
    test("对象 → x-loading-options JSON 透传", () => {
        const el = host();
        const mask = createLoadingMask(el);
        mask.show({ message: "加载中", delay: 100 });
        expect(el.getAttribute("x-loading-options")).toBe(
            JSON.stringify({ message: "加载中", delay: 100 }),
        );
    });

    test("字符串 → {message} 包装透传", () => {
        const el = host();
        const mask = createLoadingMask(el);
        mask.show("正在保存…");
        expect(el.getAttribute("x-loading-options")).toBe(
            JSON.stringify({ message: "正在保存…" }),
        );
    });

    test("无 options → 不写 x-loading-options", () => {
        const el = host();
        const mask = createLoadingMask(el);
        mask.show();
        expect(el.hasAttribute("x-loading-options")).toBe(false);
    });

    test("重入 show 不重写 options（透传仅首合成时）", () => {
        const el = host();
        const mask = createLoadingMask(el);
        mask.show("首轮");
        mask.hide();
        mask.show(); // 无 options 重入
        expect(el.getAttribute("x-loading-options")).toBe(JSON.stringify({ message: "首轮" }));
    });
});

describe("injectLoadMeta 元键注入（ADR-0126 决策 4）", () => {
    test("写 $loading/$error 进 locals + 刷新子 scope 不刷宿主", () => {
        let refreshed = 0;
        const child = { refresh: () => refreshed++ } as unknown as AutoSparkScope;
        const scope = fakeScope([child]);
        let invalidated = 0;
        (scope as any).invalidateScopeView = () => invalidated++;
        const err = new Error("boom");
        injectLoadMeta(scope, true, undefined);
        expect(scope.locals).toEqual({ $loading: true, $error: undefined });
        injectLoadMeta(scope, false, err);
        expect(scope.locals).toEqual({ $loading: false, $error: err });
        expect(refreshed).toBe(2);
        expect(invalidated).toBe(2);
    });

    test("原地改写不换引用（子 scope 经 _linkParent 共享同一对象，替换会断链）", () => {
        const scope = fakeScope();
        injectLoadMeta(scope, true, undefined);
        const first = scope.locals;
        injectLoadMeta(scope, false, undefined);
        expect(scope.locals).toBe(first);
    });
});

describe("类型冒烟：LoadingMaskOptions 值域", () => {
    test("三种形态均可传入 show", () => {
        const mask = createLoadingMask(host());
        const cases: LoadingMaskOptions[] = [false, "msg", { message: "x" }, undefined as never];
        for (const c of cases) mask.show(c);
    });
});
