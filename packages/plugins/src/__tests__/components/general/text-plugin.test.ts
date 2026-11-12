/**
 * text 组件插件测试（组件库 P0 轻件，ADR-0019）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 变体数据属性通道；
 * - ellipsis 双形态（单行省略号类 / 多行 clamp 变量下发）；
 * - copyable 复制链路（clipboard 写入 + copy 事件冒泡 + 成功反馈窗）；
 * - 溢出自动挂 title 双轨（对齐 button 范式 ADR-0012 补记）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { TEXT_NAME, bootstrapTextPlugin } from "../../../components/general/text/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[TEXT_NAME] as string).replace(/\s+/g, " ");

describe("text 组件插件（ADR-0019 P0 轻件）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.text 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[TEXT_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${TEXT_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：label 兜底 + type/strong 变体落 body 数据属性", async () => {
        const { root } = mount(
            `<span x-component:autospark.text="{ label: '正文文案' }"></span>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-text")!;
        expect(host).toBeTruthy();
        const body = host.querySelector(".asc-text-body")!;
        expect(body.getAttribute("data-type")).toBe("default");
        expect(host.textContent).toContain("正文文案");
        expect(host.querySelector(".asc-text-copy")).toBeNull(); // copyable 缺省无复制按钮
    });

    test("插槽内容优先于 label 兜底", async () => {
        const { root } = mount(
            `<span x-component:autospark.text="{ label: '兜底' }">插槽内容</span>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-text-content")!.textContent).toContain("插槽内容");
        expect(root.querySelector(".asc-text-content")!.textContent).not.toContain("兜底");
    });

    test("层级/语义色轴：secondary 与 danger 落 body data-type；strong 落 data-strong", async () => {
        const { root } = mount(
            `<span x-component:autospark.text="{ label: '次要', type: 'secondary', strong: true }"></span>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-text-body")!;
        expect(body.getAttribute("data-type")).toBe("secondary");
        expect(body.getAttribute("data-strong")).toBe("true");
    });

    test("样式通道：层级色与暗色兜底变体均在模板中（三级回退链，ADR-0129）", () => {
        const t = tpl();
        expect(t).toContain('.asc-text-body[data-type="secondary"] { color: var(--auto-secondary-color, var(--asc-text-secondary,');
        expect(t).toContain(".asc-text-ellipsis { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;");
        expect(t).toContain("-webkit-line-clamp: var(--asc-text-lines, 3);");
        expect(t).toContain("[dark] .asc-text-body[data-type=\"danger\"],");
    });
});

describe("ellipsis 溢出省略（ADR-0019）", () => {
    test("单行（true）：出口挂 asc-text-ellipsis 类", async () => {
        const { root } = mount(
            `<span x-component:autospark.text="{ label: '长文案', ellipsis: true }"></span>`,
            {},
        );
        await nextTick();
        const content = root.querySelector(".asc-text-content")!;
        expect(content.className).toContain("asc-text-ellipsis");
    });

    test("多行（number n）：出口挂 asc-text-clamp 类 + 行数经 --asc-text-lines 内联下发", async () => {
        const { root } = mount(
            `<span x-component:autospark.text="{ label: '多行文案', ellipsis: 2 }"></span>`,
            {},
        );
        await nextTick();
        const content = root.querySelector(".asc-text-content") as HTMLElement;
        expect(content.className).toContain("asc-text-clamp");
        // :style 自定义属性键引擎走 setProperty 通道（Chromium 属性赋值对 -- 键静默失效）
        expect(content.style.getPropertyValue("--asc-text-lines")).toBe("2");
    });

    test("缺省（false）：无省略类，无内联变量", async () => {
        const { root } = mount(
            `<span x-component:autospark.text="{ label: '常规' }"></span>`,
            {},
        );
        await nextTick();
        const content = root.querySelector(".asc-text-content") as HTMLElement;
        expect(content.className).not.toContain("asc-text-ellipsis");
        expect(content.className).not.toContain("asc-text-clamp");
        expect(content.style.getPropertyValue("--asc-text-lines")).toBe("");
    });

    test("溢出自动挂提示 + 显式提示永不覆盖（对齐 button 范式）", async () => {
        const { root, engine } = mount(
            `<span title="自定义提示" x-component:autospark.text="{ label: text, ellipsis: true }"></span>`,
            { text: "长文案" },
            // 钉死原生 title 通道：tooltip 特性在场与否取决于进程内是否加载过
            // autospark.tooltip（全量跑时 tooltip.test.ts 先跑置位），显式关闭使
            // title 断言与加载序解耦（组件双轨 tipAttr 判定同步收敛到 title）
            { tooltip: false },
        );
        await nextTick();
        const host = root.querySelector(".asc-text")!;
        const content = root.querySelector(".asc-text-content") as HTMLElement;
        // happy-dom 无布局：mock 几何值模拟截断态（scrollWidth > clientWidth 即溢出）
        Object.defineProperty(content, "scrollWidth", { configurable: true, get: () => 200 });
        Object.defineProperty(content, "clientWidth", { configurable: true, get: () => 100 });
        engine.store.state.text = "变更后"; // label 变化触发重查 → 显式提示在场，自挂永不覆盖
        await nextTick();
        expect(host.getAttribute("title")).toBe("自定义提示");
    });

    test("溢出自动挂提示（宿主无显式提示时自挂，label 变化换新文本）", async () => {
        const { root, engine } = mount(
            `<span x-component:autospark.text="{ label: text, ellipsis: true }"></span>`,
            { text: "初始文案" },
            { tooltip: false }, // 同上：钉死原生 title 通道，断言与 tooltip 加载序解耦
        );
        await nextTick();
        const host = root.querySelector(".asc-text")!;
        const content = root.querySelector(".asc-text-content") as HTMLElement;
        Object.defineProperty(content, "scrollWidth", { configurable: true, get: () => 200 });
        Object.defineProperty(content, "clientWidth", { configurable: true, get: () => 100 });
        engine.store.state.text = "溢出文案"; // label 变化触发重查 → 挂 title
        await nextTick();
        expect(host.getAttribute("title")).toBe("溢出文案");
    });
});

describe("copyable 复制（ADR-0019）", () => {
    /** 注入 clipboard mock（happy-dom 无安全上下文剪贴板） */
    const mockClipboard = (impl?: (text: string) => Promise<void>) => {
        const calls: string[] = [];
        const writeText = impl ?? ((text: string) => { calls.push(text); return Promise.resolve(); });
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        });
        return calls;
    };

    test("copyable=true：复制按钮渲染 + 点击写剪贴板 + copy 事件冒泡 + 成功反馈窗", async () => {
        const calls = mockClipboard();
        const { root } = mount(
            `<span x-component:autospark.text="{ label: '可复制内容', copyable: true }"></span>`,
            {},
        );
        await nextTick();
        const copyBtn = root.querySelector(".asc-text-copy") as HTMLElement;
        expect(copyBtn).toBeTruthy();

        let detail: { text?: string } | null = null;
        root.querySelector(".asc-text")!.addEventListener("copy", (e) => {
            detail = (e as CustomEvent).detail;
        });
        copyBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(calls).toEqual(["可复制内容"]); // 缺省复制渲染文本
        expect((detail as { text: string } | null)?.text).toBe("可复制内容");
        expect(copyBtn.hasAttribute("data-copied")).toBe(true); // 成功反馈窗：图标换勾 + success 色
    });

    test("copyable={ text }：显式文本优先于渲染文本（对象 props 经状态引用注入）", async () => {
        const calls = mockClipboard();
        // 对象 props 经状态引用注入（button tags 同款规避）：引擎对值对象内的字面量
        // 对象/数组 props 存在 _propsEqual 引用比较死循环缺陷（修复在途），引用形态稳定
        const { root } = mount(
            `<span x-component:autospark.text="{ label: '展示文案', copyable: conf }"></span>`,
            { conf: { text: "原始值" } },
        );
        await nextTick();
        root.querySelector(".asc-text-copy")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(calls).toEqual(["原始值"]);
    });

    test("写入失败：console.warn 响而不哑，不误报成功（data-copied 不置位）", async () => {
        const savedError = console.warn;
        const warns: string[] = [];
        console.warn = ((msg: unknown) => warns.push(String(msg))) as typeof console.warn;
        mockClipboard(() => Promise.reject(new Error("denied")));
        try {
            const { root } = mount(
                `<span x-component:autospark.text="{ label: '文案', copyable: true }"></span>`,
                {},
            );
            await nextTick();
            const copyBtn = root.querySelector(".asc-text-copy") as HTMLElement;
            copyBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            await nextTick();
            await nextTick(); // rejection 微任务传播
            expect(copyBtn.hasAttribute("data-copied")).toBe(false);
            expect(warns.length).toBe(1);
            expect(warns[0]).toContain("autospark.text");
        } finally {
            console.warn = savedError;
        }
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapTextPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[TEXT_NAME];
        bootstrapTextPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[TEXT_NAME]).toBe(before);
    });
});
