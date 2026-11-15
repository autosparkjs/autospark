/**
 * timeline 组件插件测试（组件库 P2 展示轻件，ADR-0018 清单权威表 display 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + items 状态引用注入（字面量数组死环
 *   规避，ADR-0019 后果 2）+ 内部 x-for 装配 + 主题档位继承（autospark.base）；
 * - 节点变体：type 语义色（data-type）/ hollow 空心（data-hollow）/ icon 自定义节点
 *   （data-icon + x-icon 值通道）；
 * - mode 标签侧：left 缺省 / alternate 交错 / right 右侧（JS 通道写 body data-mode）；
 * - time / content 渲染与克隆体 x-show 纪律（x-if 串台缺陷规避）；
 * - precompile 元素名变换：<x-timeline> → div 宿主 + <x-timeline-item> → data-items
 *   JSON 通道（breadcrumb 范式）；
 * - 样式通道字符串断言（button 范式 ADR-0012）+ 暗色兜底变体。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { TIMELINE_NAME, bootstrapTimelinePlugin } from "../../../components/display/timeline/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[TIMELINE_NAME] as string).replace(/\s+/g, " ");

/**
 * 可见元素过滤：克隆体内 x-show 显隐（display:none 元素仍在 DOM，P0 规避清单第 4 条
 * 的 x-show 形态），存在性断言须沿祖先链过滤隐藏分支。
 */
const visible = (sel: string, root: Element): Element[] =>
    Array.from(root.querySelectorAll(sel)).filter((el) => {
        for (let n: Element | null = el; n && n !== root.parentElement; n = n.parentElement) {
            if ((n as HTMLElement).style.display === "none") return false;
        }
        return true;
    });

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.timeline 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[TIMELINE_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${TIMELINE_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
        expect(template).toContain('x-for="item of items"'); // 内部 x-for 装配（ADR-0018 决策 2）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[TIMELINE_NAME];
        bootstrapTimelinePlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[TIMELINE_NAME]).toBe(before);
    });
});

describe("items 数据驱动渲染（状态引用注入）", () => {
    test("逐项渲染：轴线段 + 节点 + content 正文", async () => {
        const { root } = mount(
            `<div x-component:autospark.timeline="{ items: steps }"></div>`,
            {
                steps: [
                    { content: "创建项目" },
                    { content: "开发联调" },
                    { content: "发布上线" },
                ],
            },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-timeline-item").length).toBe(3);
        const bodies = Array.from(root.querySelectorAll(".asc-timeline-item-body")).map((n) => n.textContent);
        expect(bodies).toEqual(["创建项目", "开发联调", "发布上线"]);
        // 轴线段逐项在场（末项 CSS :last-child 隐藏视觉、DOM 仍在）
        expect(root.querySelectorAll(".asc-timeline-item-tail").length).toBe(3);
        // 节点逐项在场 + default 中性档缺省
        const heads = root.querySelectorAll(".asc-timeline-item-head");
        expect(heads.length).toBe(3);
        expect(heads[0]!.getAttribute("data-type")).toBe("default");
    });

    test("time 时间行：有值渲染 / 无值 x-show 隐藏（DOM 仍在）", async () => {
        const { root } = mount(
            `<div x-component:autospark.timeline="{ items: steps }"></div>`,
            { steps: [{ content: "带时间", time: "2026-11-13 09:00" }, { content: "无时间" }] },
        );
        await nextTick();
        const times = visible(".asc-timeline-item-time", root);
        expect(times.length).toBe(1); // 无 time 项经 x-show 隐藏
        expect(times[0]!.textContent).toBe("2026-11-13 09:00");
    });

    test("items 响应式：数组整体替换驱动重渲（原地变更不触发为引擎跨域信号边界，文档披露）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.timeline="{ items: steps }"></div>`,
            { steps: [{ content: "一" }] },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-timeline-item").length).toBe(1);
        engine.store.state.steps = [{ content: "一" }, { content: "二" }];
        await nextTick();
        expect(root.querySelectorAll(".asc-timeline-item").length).toBe(2);
    });
});

describe("节点变体（type / hollow / icon）", () => {
    test("type 语义色：data-type 逐项落节点（primary/success/warning/danger）", async () => {
        const { root } = mount(
            `<div x-component:autospark.timeline="{ items: steps }"></div>`,
            {
                steps: [
                    { content: "开始", type: "primary" },
                    { content: "完成", type: "success" },
                    { content: "告警", type: "warning" },
                    { content: "失败", type: "danger" },
                ],
            },
        );
        await nextTick();
        const types = Array.from(root.querySelectorAll(".asc-timeline-item-head")).map((n) => n.getAttribute("data-type"));
        expect(types).toEqual(["primary", "success", "warning", "danger"]);
    });

    test("hollow 空心节点：data-hollow=true 在场 / 缺席不落属性（假值属性移除家族约定）", async () => {
        const { root } = mount(
            `<div x-component:autospark.timeline="{ items: steps }"></div>`,
            { steps: [{ content: "空心", type: "primary", hollow: true }, { content: "实心" }] },
        );
        await nextTick();
        const heads = root.querySelectorAll(".asc-timeline-item-head");
        expect(heads[0]!.getAttribute("data-hollow")).toBe("true");
        expect(heads[1]!.hasAttribute("data-hollow")).toBe(false);
    });

    test("icon 自定义节点：data-icon=true + x-icon 值通道渲染图标位", async () => {
        const { root } = mount(
            `<div x-component:autospark.timeline="{ items: steps }"></div>`,
            { steps: [{ content: "自定义节点", icon: "star", type: "success" }, { content: "圆点节点" }] },
        );
        await nextTick();
        const heads = root.querySelectorAll(".asc-timeline-item-head");
        expect(heads[0]!.getAttribute("data-icon")).toBe("true");
        expect(visible(".asc-timeline-item-icon", root).length).toBe(1); // icon 在场项可见
        expect(heads[1]!.getAttribute("data-icon")).toBe("false"); // 缺席项仍落 false（CSS 分支判据）
    });
});

describe("mode 标签侧（JS 通道写 body data-mode）", () => {
    test("left 缺省 / alternate / right 三形态 + mode 变化跟随（watch 重同步）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.timeline="{ items: steps, mode: m }"></div>`,
            { steps: [{ content: "一" }, { content: "二" }], m: "alternate" },
        );
        await nextTick();
        const body = root.querySelector(".asc-timeline-body")!;
        expect(body.getAttribute("data-mode")).toBe("alternate");
        engine.store.state.m = "right";
        await nextTick();
        expect(body.getAttribute("data-mode")).toBe("right");
        engine.store.state.m = "left";
        await nextTick();
        expect(body.getAttribute("data-mode")).toBe("left");
    });

    test("非法 mode 值回退 left（容错归一）", async () => {
        const { root } = mount(
            `<div x-component:autospark.timeline="{ items: steps, mode: 'diagonal' }"></div>`,
            { steps: [{ content: "一" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-timeline-body")!.getAttribute("data-mode")).toBe("left");
    });

    test("alternate 奇偶交错 + right 镜像 + 末项轴线隐藏（模板断言）", () => {
        const t = tpl();
        expect(t).toContain('.asc-timeline-body[data-mode="alternate"] .asc-timeline-item:nth-child(even) {');
        expect(t).toContain('.asc-timeline-body[data-mode="right"] .asc-timeline-item {');
        expect(t).toContain(".asc-timeline-item:last-child .asc-timeline-item-tail { display: none; }");
    });
});

describe("元素名快速写法（precompile 变换，breadcrumb 范式）", () => {
    test("<x-timeline> 替换为 div 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
        const { root } = mount(
            `<div><x-timeline mode="alternate"><span>占位</span></x-timeline></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("DIV");
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const props = attrOf(host, "x-component:autospark.timeline")!;
        expect(props).toContain('mode: "alternate"');
        expect(host.querySelector("span")!.textContent).toBe("占位");
    });

    test("<x-timeline-item> 子元素声明：折叠为 items JSON 落 data-items + 声明元素摘除 + 渲染还原", async () => {
        const { root } = mount(
            `<div><x-timeline>
                <x-timeline-item time="09:00" type="primary">创建项目</x-timeline-item>
                <x-timeline-item time="12:00" type="success" hollow="true">午间发布</x-timeline-item>
            </x-timeline></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("div.asc-timeline")!;
        expect(host).toBeTruthy();
        expect(root.querySelector("x-timeline-item")).toBe(null); // 声明元素不残留
        expect(root.querySelectorAll(".asc-timeline-item").length).toBe(2);
        const heads = root.querySelectorAll(".asc-timeline-item-head");
        expect(heads[0]!.getAttribute("data-type")).toBe("primary"); // type 折叠进 JSON 通道
        expect(heads[1]!.getAttribute("data-hollow")).toBe("true"); // hollow 布尔推断
        expect(visible(".asc-timeline-item-time", root).length).toBe(2); // time 折叠进 JSON 通道
        expect(root.querySelector(".asc-timeline-item-body")!.textContent).toBe("创建项目"); // content = textContent
        expect(host.hasAttribute("data-items")).toBe(false); // mounted 消费后摘除
    });

    test(":items 状态引用在场：data-items 不落盘（props 优先）+ 声明子元素仍摘除", async () => {
        const { root } = mount(
            `<div><x-timeline :items="steps"><x-timeline-item>声明形态被忽略</x-timeline-item></x-timeline></div>`,
            { steps: [{ content: "状态引用" }] },
        );
        await nextTick();
        const host = root.querySelector("div.asc-timeline")!;
        expect(host.hasAttribute("data-items")).toBe(false);
        expect(root.querySelector("x-timeline-item")).toBe(null);
        expect(root.querySelector(".asc-timeline-item-body")!.textContent).toBe("状态引用");
    });

    test("裸 items 属性（JSON 字符串）走 data-items 通道（不进 props 值对象——字面量数组死环规避）", async () => {
        const { root } = mount(
            `<div><x-timeline items='[{"content":"JSON 形态","time":"08:00"}]'></x-timeline></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-timeline-item-body")!.textContent).toBe("JSON 形态");
        expect(root.querySelector(".asc-timeline-item-time")!.textContent).toBe("08:00");
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + --asc-dot 语义色中转 + 暗色兜底（ADR-0129）", () => {
        const t = tpl();
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-timeline-font-size, 0.875rem));");
        expect(t).toContain("--asc-dot: var(--auto-primary-color, var(--asc-timeline-primary, #009aff));");
        expect(t).toContain('.asc-timeline-item-head[data-hollow="true"] {');
        expect(t).toContain('.asc-timeline-item-head[data-icon="true"] {');
        expect(t).toContain('[dark] .asc-timeline-item-head[data-type="success"],');
        expect(t).toContain('[data-dark] .asc-timeline-item-body {');
    });
});
