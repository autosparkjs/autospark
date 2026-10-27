/**
 * button 组件插件 + installPlugin 自举单点测试（ADR-0003）：
 * - 组件形态官方样板：`AutoSpark.components["autospark.button"]` 全局表注册 + 化身渲染；
 * - installPlugin 直注册路径（setup 预置全局类）与冻结队列 error 路径（响而不哑）。
 */
import "../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../helpers";
import { BUTTON_NAME, bootstrapButtonPlugin } from "../../plugins/button/index";
import { installPlugin } from "@autospark/utils";

describe("button 组件插件（ADR-0003 组件形态样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.button 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[BUTTON_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${BUTTON_NAME}"`);
    });

    test("化身渲染：x-component 查找链兜底命中全局表（无 options.components 声明）", async () => {
        const { root } = mount(
            `<button x-component:autospark.button="{ label: '保存', type: 'primary' }"></button>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).toContain("asc-button");
        expect(host.querySelector(".asc-button-label")?.getAttribute("data-type")).toBe("primary");
        expect(host.textContent).toContain("保存");
        expect(host.hasAttribute("disabled")).toBe(false);
    });

    test("disabled 同步：data.disabled=true 经 mounted 钩子落到宿主", async () => {
        const { root } = mount(
            `<button x-component:autospark.button="{ label: '禁用', disabled: true }"></button>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("button")!.hasAttribute("disabled")).toBe(true);
    });
});

describe("installPlugin 自举单点（ADR-0003）", () => {
    test("直注册路径：全局类可达时同步执行 register（setup 预置时序）", () => {
        let called = 0;
        installPlugin(() => {
            called++;
        });
        expect(called).toBe(1);
    });

    test("冻结队列路径：注册通道关闭时 console.error 响而不哑，register 不执行", () => {
        // 模拟 ADR-0114 首个 engine 构造 drain 后的冻结态，且清空全局类
        const g = globalThis as {
            AutoSpark?: unknown;
            __AUTOSPARK_PLUGINS__?: unknown[];
        };
        const savedNs = g.AutoSpark;
        const savedQueue = g.__AUTOSPARK_PLUGINS__;
        g.AutoSpark = undefined;
        g.__AUTOSPARK_PLUGINS__ = Object.freeze([]);
        const errors: string[] = [];
        const savedError = console.error;
        console.error = (msg: unknown) => errors.push(String(msg));
        try {
            let called = 0;
            installPlugin(() => {
                called++;
            });
            expect(called).toBe(0);
            expect(errors.length).toBe(1);
            expect(errors[0]).toContain("installPlugin");
            expect(errors[0]).toContain("插件注册通道已关闭");
        } finally {
            console.error = savedError;
            g.AutoSpark = savedNs;
            g.__AUTOSPARK_PLUGINS__ = savedQueue;
        }
    });

    test("bootstrapButtonPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[BUTTON_NAME];
        bootstrapButtonPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[BUTTON_NAME]).toBe(before);
    });
});
