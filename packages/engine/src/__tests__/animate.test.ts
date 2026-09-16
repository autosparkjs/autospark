import { describe, expect, test } from "bun:test";
import "./setup";
import { mount, finishAnim } from "./helpers";

/**
 * Animator 高度型内置动画 expand（ADR-0039 决策 13）：height 0↔自然高度 + opacity
 * 同链 inline 过渡——布局高度参与动画，后续节点平滑跟随（x-tree 展开场景的修复面）。
 *
 * happy-dom 无布局（offsetHeight 恒 0）：在播态断言经 Object.defineProperty 覆写实例
 * offsetHeight 驱动；结束路径沿用 finishAnim 约定（手动派发 transitionend + 长 duration）。
 */

/** 覆写元素 offsetHeight（happy-dom 恒 0 → mock 出可测量的自然高度） */
function mockHeight(el: HTMLElement, h: number) {
    Object.defineProperty(el, "offsetHeight", { configurable: true, get: () => h });
}

describe("Animator expand 高度型动画（决策 13）", () => {
    test("enter：height 0→自然高度 + opacity/overflow/box-sizing inline，结束全还原", () => {
        const { root, engine } = mount("<div></div>", {});
        const el = document.createElement("div");
        root.appendChild(el);
        mockHeight(el, 100);
        expect(engine.animate.enter(el, { name: "expand", duration: 5000 })).toBe(true);
        // 在播态：目标帧 height=自然高、透明度 1、裁剪 + border-box 锁定测量语义
        expect(el.style.height).toBe("100px");
        expect(el.style.opacity).toBe("1");
        expect(el.style.overflow).toBe("hidden");
        expect(el.style.boxSizing).toBe("border-box");
        expect(el.style.transition).toContain("height 5000ms");
        expect(el.style.transition).toContain("opacity 5000ms");
        finishAnim(el);
        // 结束：inline 全还原（height:'' → 回归内容自然高度，不锁死后续内容变化）
        expect(el.style.height).toBe("");
        expect(el.style.overflow).toBe("");
        expect(el.style.opacity).toBe("");
        expect(el.style.boxSizing).toBe("");
        expect(el.style.transition).toBe("");
    });

    test("leave：锁定自然高度收到 0，onDone 延迟到结束（延迟隐藏/移除契约）", () => {
        const { root, engine } = mount("<div></div>", {});
        const el = document.createElement("div");
        root.appendChild(el);
        mockHeight(el, 80);
        let done = 0;
        expect(engine.animate.leave(el, { name: "expand", duration: 5000 }, () => done++)).toBe(true);
        expect(done).toBe(0);
        expect(el.style.height).toBe("0px");
        expect(el.style.opacity).toBe("0");
        finishAnim(el);
        expect(done).toBe(1);
        expect(el.style.height).toBe("");
    });

    test("自然高度为 0：不启动动画（返回 false，调用方同步处理），零 inline 写入", () => {
        const { root, engine } = mount("<div></div>", {});
        const el = document.createElement("div");
        root.appendChild(el); // happy-dom 原生 offsetHeight = 0
        expect(engine.animate.enter(el, { name: "expand" })).toBe(false);
        expect(engine.animate.leave(el, { name: "expand" }, () => {})).toBe(false);
        expect(el.style.height).toBe("");
        expect(el.style.overflow).toBe("");
        expect(el.style.transition).toBe("");
    });

    test("抢占：enter 在播时 leave 起手取消（还原 enter inline）后全新起播", () => {
        const { root, engine } = mount("<div></div>", {});
        const el = document.createElement("div");
        root.appendChild(el);
        mockHeight(el, 120);
        expect(engine.animate.enter(el, { name: "expand", duration: 5000 })).toBe(true);
        expect(el.style.height).toBe("120px");
        // 状态翻转 → leave 抢占（快速连点语义，决策 7）：height 走 leave 目标帧 0
        expect(engine.animate.leave(el, { name: "expand", duration: 5000 }, () => {})).toBe(true);
        expect(el.style.height).toBe("0px");
        expect(el.style.opacity).toBe("0");
        finishAnim(el);
        expect(el.style.height).toBe("");
    });

    test("默认时长 300ms（未配 duration，对齐内置类名动画 .3s 惯例）", () => {
        const { root, engine } = mount("<div></div>", {});
        const el = document.createElement("div");
        root.appendChild(el);
        mockHeight(el, 60);
        expect(engine.animate.enter(el, { name: "expand" })).toBe(true);
        expect(el.style.transition).toContain("height 300ms");
        finishAnim(el);
    });
});
