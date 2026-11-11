/**
 * button 组件插件 + installPlugin 自举单点测试（ADR-0003）：
 * - 组件形态官方样板：`AutoSpark.components["autospark.button"]` 全局表注册 + 化身渲染；
 * - installPlugin 直注册路径（setup 预置全局类）与冻结队列 error 路径（响而不哑）。
 */
import "../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../helpers";
import { BUTTON_NAME, bootstrapButtonPlugin } from "../../components/button/index";
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
        expect(host.querySelector(".asc-button-body")?.getAttribute("data-type")).toBe("primary");
        expect(host.textContent.replace(/\s/g, "")).toContain("保存"); // 新版模板字距排版，空白归一后断言
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

    test("标签形态（ADR-0133）：<x-button> 经引擎原生元素名通道实例化（无插件自举）", async () => {
        const { root, engine } = mount(
            `<div><x-button id="b" label="标签按钮" type="primary"></x-button></div>`,
            {},
        );
        await nextTick();
        // 归一化推导：autospark.button 剥离官方前缀 → x-button；懒预编译缺口由编译期反查修复
        expect(engine.directives.findByElementName("x-button")).toBe("autospark.button");
        const host = root.querySelector("#b") as HTMLElement;
        expect(engine.getComponent(host)?.name).toBe("autospark.button");
        expect(host.querySelector(".asc-button-body")?.getAttribute("data-type")).toBe("primary");
        expect(host.textContent.replace(/\s/g, "")).toContain("标签按钮");
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

describe("wrap 选项（label 换行与截断 title，ADR-0012 决策 7）", () => {
    test("样式通道：label 基础规则承载单行截断，data-wrap=true 解除折行", () => {
        // 归一化空白后断言（oxfmt 折行使逐字匹配假红）
        const tpl = ((AutoSpark as { components: Record<string, string> }).components[BUTTON_NAME] as string).replace(/\s+/g, " ");
        expect(tpl).toContain(".asc-button-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }");
        expect(tpl).toContain('.asc-button-body[data-wrap="true"] .asc-button-label { white-space: normal; }');
    });

    test("data-wrap 属性通道：wrap=true 落 body，缺省（假值）属性移除不命中", async () => {
        const { root } = mount(
            `<button x-component:autospark.button="{ label: '换行按钮', wrap: true }"></button>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-button-body")!.getAttribute("data-wrap")).toBe("true");

        const plain = mount(`<button x-component:autospark.button="{ label: '常规' }"></button>`, {});
        await nextTick();
        expect(plain.root.querySelector(".asc-button-body")!.getAttribute("data-wrap")).toBe(null);
    });

    test("溢出自动挂 title + label 变化换新文本 + 溢出消失摘自挂的", async () => {
        const { root, engine } = mount(
            `<button x-component:autospark.button="{ label: text }"></button>`,
            { text: "初始长文案" },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        const span = root.querySelector(".asc-button-label") as HTMLElement;
        // happy-dom 无布局：mock 几何值模拟截断态（scrollWidth > clientWidth 即溢出）
        let overflow = true;
        Object.defineProperty(span, "scrollWidth", { configurable: true, get: () => (overflow ? 200 : 100) });
        Object.defineProperty(span, "clientWidth", { configurable: true, get: () => 100 });
        engine.store.state.text = "变更后的长文案"; // label 变化触发重查 → 挂 title（textContent 同源）
        await nextTick();
        expect(host.getAttribute("title")).toBe("变更后的长文案");
        // 溢出消失（label 再变、几何恢复）→ 摘自挂的 title
        overflow = false;
        engine.store.state.text = "短";
        await nextTick();
        expect(host.getAttribute("title")).toBe(null);
    });

    test("显式 title 永不覆盖；不溢出（含 wrap 折行态）不挂无残留", async () => {
        const { root, engine } = mount(
            `<button title="自定义提示" x-component:autospark.button="{ label: text }"></button>`,
            { text: "初始文案" },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        const span = root.querySelector(".asc-button-label") as HTMLElement;
        let overflow = true;
        Object.defineProperty(span, "scrollWidth", { configurable: true, get: () => (overflow ? 200 : 100) });
        Object.defineProperty(span, "clientWidth", { configurable: true, get: () => 100 });
        engine.store.state.text = "改一下"; // 溢出态重查：显式 title 在场永不覆盖
        await nextTick();
        expect(host.getAttribute("title")).toBe("自定义提示");
        overflow = false; // 折行/宽度充裕态（几何不溢出）→ 从未自挂、无残留
        engine.store.state.text = "再改一下";
        await nextTick();
        expect(host.getAttribute("title")).toBe("自定义提示");
    });
});

describe("tag checkable（点击翻转 value，2026-11-09）", () => {
    const mountTags = (tags: unknown[]) => mount(
        `<button x-component:autospark.button="{ label: '文档', tags }"></button>`,
        { tags },
    );

    test("默认值域 [true,false]：value===true 呈 checked，点击翻转联动 data-checked 且写穿外部状态", async () => {
        const { root, engine } = mountTags([
            { name: "like", icon: "star", checkable: true, value: true },
            { name: "plain", icon: "bell" },
        ]);
        await nextTick();
        const tags = [...root.querySelectorAll(".asc-button-tag")] as HTMLElement[];
        expect(tags.length).toBe(2);
        expect(tags[0].hasAttribute("data-checked")).toBe(true); // value true === 真值
        expect(tags[1].hasAttribute("data-checked")).toBe(false); // 非 checkable 恒无

        let detail: { name: string; value: unknown } | null = null;
        root.querySelector("button")!.addEventListener("tag-click", (e) => {
            const d = (e as CustomEvent).detail;
            detail = { name: d.name, value: d.value };
        });
        tags[0].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect((engine.store.state.tags as any[])[0].value).toBe(false); // 写穿外部状态
        expect(tags[0].hasAttribute("data-checked")).toBe(false); // 勾选视觉随绑定重算
        expect((detail as any)?.name).toBe("like");
        expect((detail as any)?.value).toBe(false); // detail 携切换后新值

        tags[0].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect((engine.store.state.tags as any[])[0].value).toBe(true);
        expect(tags[0].hasAttribute("data-checked")).toBe(true);
    });

    test("自定义 checkValues：真值在前判定归属，残缺项逐项回退", async () => {
        const { root, engine } = mountTags([
            { name: "a", icon: "star", checkable: true, checkValues: ["on", "off"], value: "off" },
            { name: "b", icon: "bell", checkable: true, checkValues: ["on"], value: "on" },
        ]);
        await nextTick();
        const tags = [...root.querySelectorAll(".asc-button-tag")] as HTMLElement[];
        expect(tags[0].hasAttribute("data-checked")).toBe(false); // 'off' === 假值
        expect(tags[1].hasAttribute("data-checked")).toBe(true); // 真值 'on' 命中（残缺只回退缺的假值项）

        tags[0].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect((engine.store.state.tags as any[])[0].value).toBe("on"); // 假值 → 真值
        expect(tags[0].hasAttribute("data-checked")).toBe(true);

        tags[1].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect((engine.store.state.tags as any[])[1].value).toBe(false); // 残缺假值项回退 false
        expect(tags[1].hasAttribute("data-checked")).toBe(false);
    });
});

// 宿主级 checkable / checkStyle / checkValues 已随 ADR-0016 从 button 移除（迁移动作
// checkable:true → <x-state-button>），相关用例迁往 state-button-plugin.test.ts
// （decorate 项键语义）；tag 级 checkable 为 tags 速记族独立轴功能，保留在上。
