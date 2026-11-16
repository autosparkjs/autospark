/**
 * button 组件插件 + installPlugin 自举单点测试（ADR-0003）：
 * - 组件形态官方样板：`AutoSpark.components["autospark.button"]` 全局表注册 + 化身渲染；
 * - installPlugin 直注册路径（setup 预置全局类）与冻结队列 error 路径（响而不哑）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { BUTTON_NAME, bootstrapButtonPlugin } from "../../../components/general/button/index";
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
            // 钉死原生 title 通道：tooltip 特性在场与否取决于进程内是否加载过
            // autospark.tooltip（全量跑时 tooltip.test.ts 先跑置位、单跑缺席），
            // 显式关闭使 title 断言与加载序解耦（组件双轨 tipAttr 判定同步收敛到 title）
            { tooltip: false },
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
            { tooltip: false }, // 同上：钉死原生 title 通道，断言与 tooltip 加载序解耦
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

describe("caret 尾部方向箭头（none | left | top | right | bottom）", () => {
    test("none 缺省不渲染；方向落 data-caret，同一枚 arrow 经 rotate 选项转到对应角度", async () => {
        const plain = mount(`<button x-component:autospark.button="{ label: '无箭头' }"></button>`, {});
        await nextTick();
        expect(plain.root.querySelector(".asc-button-caret")).toBeNull();

        const cases = [
            ["right", ""], // 基准姿态不写 transform（rotate 0 不启用）
            ["bottom", "rotate(90deg)"],
            ["left", "rotate(180deg)"],
            ["top", "rotate(-90deg)"],
        ] as const;
        for (const [caret, transform] of cases) {
            const { root } = mount(
                `<button x-component:autospark.button="{ label: '箭头', caret: '${caret}' }"></button>`,
                {},
            );
            await nextTick();
            const caretEl = root.querySelector(".asc-button-caret") as HTMLElement;
            expect(caretEl).not.toBeNull();
            expect(caretEl.getAttribute("data-caret")).toBe(caret);
            const svg = caretEl.querySelector("svg") as SVGElement;
            expect(svg).not.toBeNull();
            expect(svg.style.getPropertyValue("transform")).toBe(transform);
        }
    });

    test("响应式切换方向：图标节点复用（只旋转），切回 none 即移除", async () => {
        const { root, engine } = mount(
            `<button x-component:autospark.button="{ label: '切换', caret }"></button>`,
            { caret: "right" },
        );
        await nextTick();
        const caretEl = root.querySelector(".asc-button-caret") as HTMLElement;
        const svg = caretEl.querySelector("svg") as SVGElement;
        const use = svg.querySelector("use")!;
        const href = use.getAttribute("href");
        expect(href).toBeTruthy();

        engine.store.state.caret = "bottom";
        await nextTick();
        expect(caretEl.querySelector("svg")).toBe(svg); // 同一枚 arrow 载体
        expect(use.getAttribute("href")).toBe(href);
        expect(svg.style.getPropertyValue("transform")).toBe("rotate(90deg)");

        engine.store.state.caret = "none";
        await nextTick();
        expect(root.querySelector(".asc-button-caret")).toBeNull();
    });
});

describe("icon 对象透传 x-icon-options（string | 选项对象）", () => {
    const mountIcon = (icon: Record<string, unknown>) => mount(
        `<button x-component:autospark.button="buttonProps"></button>`,
        { buttonProps: { label: "图标", icon } },
    );

    test("视觉键全量透传：size / color / strokeWidth / padding / shape / button / pointer / rotate", async () => {
        const { root } = mountIcon({
            name: "star",
            size: 20,
            color: "red",
            strokeWidth: 2,
            shape: "circle",
            button: true,
            pointer: true,
            rotate: 90,
        });
        await nextTick();
        const span = root.querySelector(".asc-button-icon") as HTMLElement;
        expect(span).not.toBeNull();
        expect(span.style.width).toBe("20px");
        expect(span.style.height).toBe("20px");
        expect(span.style.color).toBe("red");
        expect(span.style.getPropertyValue("--as-icon-sw")).toBe("2");
        expect(span.style.cursor).toBe("pointer");
        // shape 启用：底板包裹层由 x-icon 建于宿主父级，button 动效随板落在包裹层
        const wrap = span.parentElement as HTMLElement;
        expect(wrap.classList.contains("as-icon-circle")).toBe(true);
        expect(wrap.classList.contains("as-icon-button")).toBe(true);
        // rotate 作用于常驻 svg 载体
        const svg = span.querySelector("svg") as SVGElement;
        expect(svg.style.getPropertyValue("transform")).toBe("rotate(90deg)");
    });

    test("padding 选项：无板内联宿主，有板落到包裹层（与 x-icon 原生一致）", async () => {
        const plain = mountIcon({ name: "star", padding: 4 });
        await nextTick();
        const plainSpan = plain.root.querySelector(".asc-button-icon") as HTMLElement;
        expect(plainSpan.style.padding).toBe("4px");

        const shaped = mountIcon({ name: "star", padding: 6, shape: "radius" });
        await nextTick();
        const shapedSpan = shaped.root.querySelector(".asc-button-icon") as HTMLElement;
        expect(shapedSpan.style.padding).toBe("");
        expect((shapedSpan.parentElement as HTMLElement).style.padding).toBe("6px");
    });

    test("响应式更新：icon 对象换新即重放样式与角度（svg 载体复用）", async () => {
        const { root, engine } = mountIcon({ name: "star", size: 20, rotate: 0 });
        await nextTick();
        const span = root.querySelector(".asc-button-icon") as HTMLElement;
        const svg = span.querySelector("svg") as SVGElement;
        expect(span.style.width).toBe("20px");
        expect(svg.style.getPropertyValue("transform")).toBe("");

        const props = (engine.store.state as any).buttonProps;
        props.icon = { name: "star", size: 32, color: "blue", rotate: 180 };
        await nextTick();
        expect(root.querySelector(".asc-button-icon")).toBe(span); // 同一图标位
        expect(span.style.width).toBe("32px");
        expect(span.style.color).toBe("blue");
        expect(svg.style.getPropertyValue("transform")).toBe("rotate(180deg)");
    });

    test("按钮自有 badge 保留：true 挂角标类（板距走 CSS 缺省），数值/字符串写内联板距", async () => {
        const on = mountIcon({ name: "bell", badge: true });
        await nextTick();
        const onSpan = on.root.querySelector(".asc-button-icon") as HTMLElement;
        expect(onSpan.classList.contains("asc-button-icon-badge")).toBe(true);
        expect(onSpan.style.padding).toBe(""); // 缺省板距由 .asc-button-icon-badge 规则承载

        const custom = mountIcon({ name: "bell", badge: 6 });
        await nextTick();
        const customSpan = custom.root.querySelector(".asc-button-icon") as HTMLElement;
        expect(customSpan.classList.contains("asc-button-icon-badge")).toBe(true);
        expect(customSpan.style.padding).toBe("6px");
    });
});

describe("图标放大倍率（icon.scale，ADR-0138 修订：纵排或 memo 在场）", () => {
    // 对象 props 一律路径引用（字面量嵌套对象触发引擎更新环缺陷，家族惯用法）
    const mountIconAt = (labelPos: string, icon: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
        mount(`<button x-component:autospark.button="buttonProps"></button>`, {
            buttonProps: { label: "图标", labelPos, icon, ...extra },
        });
    const iconWidth = (root: HTMLElement | Document) => (root.querySelector(".asc-button-icon") as HTMLElement)?.style.width ?? "<无图标位>";

    test("CSS 载体（theme 两态一致）：纵排与 memo 合并为单一 1.5× 规则，独立 memo 2× 与旧 font-size 已废除", () => {
        const tpl = ((AutoSpark as { components: Record<string, string> }).components[BUTTON_NAME] as string).replace(/\s+/g, " ");
        // 三选择器合并同值 ×1.5：倍率乘在 --auto-icon-size 上（theme 档位绝对值与 1em 回落两态一致生效）
        expect(tpl).toContain('.asc-button-body[data-label-pos="top"] .asc-button-icon.as-icon, .asc-button-body[data-label-pos="bottom"] .asc-button-icon.as-icon, .asc-button:has(.asc-button-memo) .asc-button-icon.as-icon { width: calc(var(--auto-icon-size, 1em) * 1.5); height: calc(var(--auto-icon-size, 1em) * 1.5); }');
        expect(tpl).not.toContain("* 2)");
        expect(tpl).not.toContain(".asc-button-icon { font-size: 2em");
    });

    test("缺省链：纵排/横排 + size/scale 均缺省 → 零内联（交 CSS：纵排 1.5×、横排 1×）", async () => {
        const vertical = mountIconAt("bottom", { name: "star" });
        await nextTick();
        expect(iconWidth(vertical.root)).toBe("");
        const horizontal = mountIconAt("right", { name: "star" });
        await nextTick();
        expect(iconWidth(horizontal.root)).toBe("");
    });

    test("scale 显式（size 缺省）：纵排输出 calc 接管内联；非法值（0/负/字符串）静默剪枝回退内建", async () => {
        const on = mountIconAt("top", { name: "star", scale: 2 });
        await nextTick();
        expect(iconWidth(on.root)).toBe("calc(var(--auto-icon-size, 1em) * 2)");
        for (const bad of [0, -1, "big"]) {
            const off = mountIconAt("bottom", { name: "star", scale: bad });
            await nextTick();
            expect(iconWidth(off.root)).toBe("");
        }
    });

    test("size × scale 叠加：number 直乘出 px（scale 缺省 1.5 参与乘），字符串 size 包 calc()", async () => {
        const mul = mountIconAt("bottom", { name: "star", size: 20, scale: 2 });
        await nextTick();
        expect(iconWidth(mul.root)).toBe("40px");

        const byDefault = mountIconAt("top", { name: "star", size: 20 });
        await nextTick();
        expect(iconWidth(byDefault.root)).toBe("30px"); // scale 缺省 1.5 纵排参与

        const css = mountIconAt("bottom", { name: "star", size: "2rem", scale: 2 });
        await nextTick();
        expect(iconWidth(css.root)).toBe("calc(2rem * 2)");

        const badScale = mountIconAt("bottom", { name: "star", size: 20, scale: 0 });
        await nextTick();
        expect(iconWidth(badScale.root)).toBe("30px"); // 非法剪枝 → 回退 1.5
    });

    test("横排 scale 静默忽略：size 原样透传（不乘），scale-only 不产生内联", async () => {
        const withSize = mountIconAt("right", { name: "star", size: 20, scale: 3 });
        await nextTick();
        expect(iconWidth(withSize.root)).toBe("20px");
        const scaleOnly = mountIconAt("left", { name: "star", scale: 2 });
        await nextTick();
        expect(iconWidth(scaleOnly.root)).toBe("");
    });

    test("响应式切换 labelPos：乘积随绑定重求值（right 20px → bottom 30px）", async () => {
        const { root, engine } = mountIconAt("right", { name: "star", size: 20 });
        await nextTick();
        expect(iconWidth(root)).toBe("20px");
        (engine.store.state as any).buttonProps.labelPos = "bottom";
        await nextTick();
        expect(iconWidth(root)).toBe("30px");
    });

    test("loading 位只吃 CSS 内建 1.5×：无 scale 通道、不内联（icon 的 size/scale 均不转移）", async () => {
        const { root, engine } = mountIconAt("bottom", { name: "star", size: 24, scale: 2 }, { loading: false });
        await nextTick();
        expect(iconWidth(root)).toBe("48px"); // icon 位正常乘积（24 × 2）
        (engine.store.state as any).buttonProps.loading = true;
        await nextTick();
        expect(iconWidth(root)).toBe(""); // 转圈位零内联（放大由纵排 CSS 规则承载）
    });

    test("纵排 + memo：无显式零内联（CSS 1.5× 统一承载）；显式 scale 恒赢（内联压过内建）", async () => {
        const byDefault = mountIconAt("bottom", { name: "star" }, { memo: "备注" });
        await nextTick();
        expect(iconWidth(byDefault.root)).toBe("");
        const explicit = mountIconAt("bottom", { name: "star", scale: 1.2 }, { memo: "备注" });
        await nextTick();
        expect(iconWidth(explicit.root)).toBe("calc(var(--auto-icon-size, 1em) * 1.2)");
    });

    test("横排 + memo（修订：memo 即放大场景，scale 生效域扩展）：size 参与叠加、scale-only 接管、无显式零内联", async () => {
        const byDefault = mountIconAt("right", { name: "star" }, { memo: "备注" });
        await nextTick();
        expect(iconWidth(byDefault.root)).toBe(""); // CSS 1.5× 承载（不再原样 1×）
        const withSize = mountIconAt("right", { name: "star", size: 20 }, { memo: "备注" });
        await nextTick();
        expect(iconWidth(withSize.root)).toBe("30px"); // size × 内建 1.5（原「横排 size 原样」在 memo 场景让位叠加）
        const scaleOnly = mountIconAt("right", { name: "star", scale: 2 }, { memo: "备注" });
        await nextTick();
        expect(iconWidth(scaleOnly.root)).toBe("calc(var(--auto-icon-size, 1em) * 2)");
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

describe("checkable 回归（化身 checkbox 表单字段，2026-11-13 / ADR-0016 修订记）", () => {
    const mountCheck = (props: string, state: any = {}) =>
        mount(`<button x-component:autospark.button="{ label: '勾选', ${props} }"></button>`, state);

    test("缺省非表单字段：不内嵌 input、无勾选类", async () => {
        const { root } = mountCheck("label: '普通'");
        await nextTick();
        expect(root.querySelector("button")!.querySelector("input")).toBeNull();
        expect(root.querySelector("button")!.className.includes("asc-check-")).toBe(false);
    });

    test("内嵌 checkbox：name 透传、未勾选不提交（提交值 = String(checkValues[0])）", async () => {
        const { root } = mountCheck("checkable: true", {});
        await nextTick();
        const real = root.querySelector("button")!.querySelector("input")!;
        expect(real.type).toBe("checkbox");
        expect(real.style.display).toBe("none");
        const named = mount(`<button name="agree" x-component:autospark.button="{ label: '同意', checkable: true }"></button>`, {});
        await nextTick();
        expect(named.root.querySelector("button")!.querySelector("input")!.name).toBe("agree");
    });

    test("点击翻转：value 真假循环 + asc-checked 类 + change detail 新值；默认 checkStyle=corner", async () => {
        const { root } = mountCheck("checkable: true");
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).toContain("asc-check-corner"); // 缺省渲染类（静态挂载）
        expect(host.className).not.toContain("asc-checked");
        const details: any[] = [];
        host.addEventListener("change", (e) => details.push((e as CustomEvent).detail));
        host.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(host.className).toContain("asc-checked");
        expect(details.length).toBe(1);
        expect(details[0].value).toBe(true);
        host.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(host.className).not.toContain("asc-checked");
        expect(details[1]?.value).toBe(false);
    });

    test("checkValues 任意值：翻转在二元组内循环（路径引用注入）", async () => {
        const { root, engine } = mountCheck("checkable: true, checkValues: cv, value: 'off'", { cv: ["on", "off"] });
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).not.toContain("asc-checked"); // 'off' === 假值
        host.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(host.className).toContain("asc-checked");
        expect(engine.store.state.cv).toEqual(["on", "off"]); // checkValues 不被擅改
    });

    test("checkStyle 热切换：watch 摘旧类挂新类", async () => {
        const { root, engine } = mountCheck("checkable: true, checkStyle: style", { style: "solid" });
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).toContain("asc-check-solid");
        engine.store.state.style = "ripple";
        await nextTick();
        expect(host.className).not.toContain("asc-check-solid");
        expect(host.className).toContain("asc-check-ripple");
    });

    test("ripple 形态勾选视觉由 x-ripple 承载：勾选宿主恒开 echo 双环、取消回退原配置", async () => {
        const { root } = mountCheck("checkable: true, checkStyle: 'ripple'");
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.querySelector(".asc-button-check")).toBeNull(); // 无占位指示器（宿主整体承载）
        const opts = () => host.getAttribute("x-ripple-options") ?? "";
        expect(opts()).not.toContain("always"); // 未勾选：保持 ripple prop 原配置（click）
        expect(opts()).toContain('"click"');
        host.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(opts()).toContain('"always"'); // 勾选：恒开
        expect(opts()).toContain('"echo"'); // echo 双环（外扩形态非 inside）
        expect(opts()).toContain('"inside":false');
        host.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(opts()).toContain('"click"'); // 取消：回退用户 ripple 原值
        expect(opts()).not.toContain('"always"');
    });

    test("x-model 布尔桥：宿主 x-model.boolean 点击回写 state 真布尔", async () => {
        const { root, engine } = mount(
            `<button x-model.boolean="flag" x-component:autospark.button="{ label: '桥', checkable: true }"></button>`,
            { flag: false },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).not.toContain("asc-checked");
        host.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(engine.store.state.flag).toBe(true);
        expect(host.className).toContain("asc-checked");
    });
});
