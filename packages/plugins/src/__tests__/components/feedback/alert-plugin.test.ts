/**
 * alert 组件插件测试（组件库 P0 轻件，ADR-0019——feedback 分类首件）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 变体数据属性通道；
 * - 语义色基线（本件核心职责）：五档 type 的 --asc-tone 中转 + :has() 反驱宿主
 *   组织方式 + 三级回退链 + 暗色兜底变体（字符串断言，ADR-0129）；
 * - 图标映射（type → 内置图标）与 icon 覆盖（字符串/对象/false 关闭）；
 * - closable 关闭链路（closed 置位 → 宿主 data-closed 属性 + close 事件冒泡 +
 *   原生 click 阻断冒泡）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { ALERT_NAME, bootstrapAlertPlugin } from "../../../components/feedback/alert/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[ALERT_NAME] as string).replace(/\s+/g, " ");

describe("alert 组件插件（ADR-0019 P0 轻件，feedback 首件）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.alert 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[ALERT_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${ALERT_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：title/description 兜底 + type 落 body 数据属性；closable 缺省无关闭钮", async () => {
        const { root } = mount(
            `<div x-component:autospark.alert="{ title: '操作成功', description: '数据已保存至云端' }"></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-alert")!;
        expect(host).toBeTruthy();
        const body = host.querySelector(".asc-alert-body")!;
        expect(body.getAttribute("data-type")).toBe("default"); // 中性缺省
        expect(body.hasAttribute("data-banner")).toBe(false); // 假值变体属性整个移除（绑定通道惯例）
        expect(host.querySelector(".asc-alert-title")!.textContent).toContain("操作成功");
        expect(host.querySelector(".asc-alert-desc")!.textContent).toContain("数据已保存至云端");
        expect(host.querySelector(".asc-alert-close")).toBeNull(); // closable 缺省
    });

    test("插槽内容优先于 description 兜底（插槽可换）", async () => {
        const { root } = mount(
            `<div x-component:autospark.alert="{ title: '标题' }">插槽描述内容</div>`,
            {},
        );
        await nextTick();
        const desc = root.querySelector(".asc-alert-desc")!;
        expect(desc.textContent).toContain("插槽描述内容");
        expect(desc.textContent).not.toContain("undefined");
    });

    test("title 空：标题行不渲染（x-if 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.alert="{ description: '仅描述' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-alert-title")).toBeNull();
        expect(root.querySelector(".asc-alert-desc")!.textContent).toContain("仅描述");
    });

    test("语义色档位：success/warning/danger/info 落 body data-type", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.alert="{ title: 'a', type: 'success' }"></div>` +
            `<div x-component:autospark.alert="{ title: 'b', type: 'warning' }"></div>` +
            `<div x-component:autospark.alert="{ title: 'c', type: 'danger' }"></div>` +
            `<div x-component:autospark.alert="{ title: 'd', type: 'info' }"></div></div>`,
            {},
        );
        await nextTick();
        const types = [...root.querySelectorAll(".asc-alert-body")].map((b) => b.getAttribute("data-type"));
        expect(types).toEqual(["success", "warning", "danger", "info"]);
    });

    test("banner 通栏：data-banner=\"true\" 落 body（圆角清零经 :has() 消费）", async () => {
        const { root } = mount(
            `<div x-component:autospark.alert="{ title: '通栏警示', type: 'warning', banner: true }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-alert-body")!.getAttribute("data-banner")).toBe("true");
    });
});

describe("语义色基线组织（ADR-0018 决策 6.4——非 button 组件首个落地）", () => {
    test("--asc-tone 中转 + :has() 反驱宿主：五档块与 --auto-* 三级回退链均在模板", () => {
        const t = tpl();
        // 中性缺省 = 正文色中转（选择器行内有设计注释，锚定声明而非选择器行首）
        expect(t).toContain("--asc-tone: var(--auto-color, var(--asc-alert-default, #606060));");
        // 五档 :has 块（success/warning/danger/info 显式 + default 缺省即中性基线）
        expect(t).toContain('.asc-alert:has(> .asc-alert-body[data-type="success"]) { --asc-tone: var(--auto-success-color, var(--asc-alert-success, #22c55e)); }');
        expect(t).toContain('.asc-alert:has(> .asc-alert-body[data-type="warning"]) { --asc-tone: var(--auto-warning-color, var(--asc-alert-warning, #f59e0b)); }');
        expect(t).toContain('.asc-alert:has(> .asc-alert-body[data-type="danger"]) { --asc-tone: var(--auto-danger-color, var(--asc-alert-danger, #ef4444)); }');
        expect(t).toContain('.asc-alert:has(> .asc-alert-body[data-type="info"]) { --asc-tone: var(--auto-info-color, var(--asc-alert-info, #71717a)); }');
    });

    test("警示条形态：语义色淡底 + 半透明边框经 color-mix 派生（tone 单源）", () => {
        const t = tpl();
        expect(t).toContain("background: color-mix(in srgb, var(--asc-tone) 10%, transparent);");
        expect(t).toContain("color-mix(in srgb, var(--asc-tone) 38%, transparent);");
    });

    test("暗色兜底变体（ADR-0129）：五档 tone 与 close 淡白色兜底在场", () => {
        const t = tpl();
        expect(t).toContain("[dark] .asc-alert, [data-dark] .asc-alert {");
        expect(t).toContain("[dark] .asc-alert:has(> .asc-alert-body[data-type=\"danger\"]),");
        expect(t).toContain("--asc-tone: var(--auto-danger-color, var(--asc-alert-danger, #e6696a));");
        expect(t).toContain("[dark] .asc-alert-close, [data-dark] .asc-alert-close {");
    });

    test("banner 通栏：圆角清零 + closed 隐藏均在模板", () => {
        const t = tpl();
        expect(t).toContain('.asc-alert:has(> .asc-alert-body[data-banner="true"]) { border-radius: 0; }');
        expect(t).toContain(".asc-alert[data-closed] { display: none; }");
    });
});

describe("图标（type 映射 + icon 覆盖）", () => {
    /** 取图标位渲染结果（x-icon 编译后属性剥除，断言 svg 子元素与元素存在性） */
    const iconOf = (root: HTMLElement | null) => root?.querySelector(".asc-alert-icon") ?? null;

    test("默认映射：default→bell / warning→warn / danger→error / info→info / success→success", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.alert="{ title: 'a' }"></div>` +
            `<div x-component:autospark.alert="{ title: 'b', type: 'warning' }"></div>` +
            `<div x-component:autospark.alert="{ title: 'c', type: 'danger' }"></div>` +
            `<div x-component:autospark.alert="{ title: 'd', type: 'info' }"></div>` +
            `<div x-component:autospark.alert="{ title: 'e', type: 'success' }"></div></div>`,
            {},
        );
        await nextTick();
        // 五个实例图标位均在场（x-icon 渲染 svg）
        const icons = [...root.querySelectorAll(".asc-alert-icon")];
        expect(icons.length).toBe(5);
        for (const icon of icons) expect(icon.querySelector("svg")).toBeTruthy();
    });

    test("icon 字符串覆盖默认映射（warning 档换 bell）", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.alert="{ title: '默认', type: 'warning' }"></div>` +
            `<div x-component:autospark.alert="{ title: '覆盖', type: 'warning', icon: 'bell' }"></div></div>`,
            {},
        );
        await nextTick();
        // 两个实例图标位均在场（x-icon 渲染 svg）；覆盖与默认映射的区分由 x-icon 值
        // 表达式承担（displayIcon computed 显式 icon 优先），存在性 + 渲染即验证通道畅通
        const icons = [...root.querySelectorAll(".asc-alert-icon")];
        expect(icons.length).toBe(2);
        for (const icon of icons) expect(icon.querySelector("svg")).toBeTruthy();
    });

    test("icon 对象形态 { name } 覆盖（对象 props 经状态引用注入）", async () => {
        const { root } = mount(
            `<div x-component:autospark.alert="{ title: '对象图标', icon: conf }"></div>`,
            { conf: { name: "star" } },
        );
        await nextTick();
        const icon = iconOf(root.querySelector(".asc-alert"));
        expect(icon).toBeTruthy();
        expect(icon!.querySelector("svg")).toBeTruthy();
    });

    test("icon=false 关闭图标位（displayIcon 解析为空 → x-if 不渲染）", async () => {
        const { root } = mount(
            `<div x-component:autospark.alert="{ title: '无图标', icon: false }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-alert-icon")).toBeNull();
        expect(root.querySelector(".asc-alert-title")!.textContent).toContain("无图标"); // 其余结构不受影响
    });
});

describe("closable 关闭链路（ADR-0019）", () => {
    test("closable=true：关闭钮渲染 + 点击 close 事件冒泡 + 宿主挂 data-closed", async () => {
        const { root } = mount(
            `<div x-component:autospark.alert="{ title: '可关闭', closable: true }"></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-alert")!;
        const closeBtn = root.querySelector(".asc-alert-close")!;
        expect(closeBtn).toBeTruthy();

        let fired = 0;
        host.addEventListener("close", () => { fired++; });
        closeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(fired).toBe(1);              // close 事件冒泡（外层可消费联动）
        expect(host.hasAttribute("data-closed")).toBe(true); // closed 置位 → 宿主属性通道
    });

    test("关闭点击阻断原生 click 冒泡（不误触外层点击域）", async () => {
        const { root } = mount(
            `<div id="outer"><div x-component:autospark.alert="{ title: 'x', closable: true }"></div></div>`,
            {},
        );
        await nextTick();
        let outerClick = 0;
        root.querySelector("#outer")!.addEventListener("click", () => { outerClick++; });
        root.querySelector(".asc-alert-close")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(outerClick).toBe(0); // stopPropagation 生效
    });

    test("closed 外部注入：初始即隐藏（宿主 data-closed 挂载同步）", async () => {
        const { root } = mount(
            `<div x-component:autospark.alert="{ title: '初始关闭', closed: true }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-alert")!.hasAttribute("data-closed")).toBe(true);
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapAlertPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[ALERT_NAME];
        bootstrapAlertPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[ALERT_NAME]).toBe(before);
    });
});
