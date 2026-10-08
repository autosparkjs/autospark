import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { AutoSpark } from "../../engine/engine";

/**
 * 全局工具提示测试（ADR-0061）：data-tooltip 属性约定 + title 编译期转换 + 委托监听 +
 * 单例浮层 + floating-ui 定位 + 双通道事件 + 命令式 API。
 *
 * 断言走 document 级选择器（浮层容器挂 body）；委托事件经 dispatchEvent 派发（bubbles，
 * detached 树内照样冒泡到 engine 根监听）。定位断言循 x-overlay 模式（await nextTick 等
 * computePosition 微任务）。默认配置 showDelay: 0 / hideDelay: 80——多数用例配
 * `{ hideDelay: 0 }` 简化时序，延迟语义专项用例再显式配长延迟。
 */

const engines: any[] = [];

const containerOf = (): HTMLElement | null => document.querySelector(".autospark-tooltips");
const tipOf = (): HTMLElement | null =>
    (containerOf?.()?.querySelector(":scope > .autospark-tooltip") as HTMLElement) ?? null;

const mountTip = (html: string, state: any = {}, options: any = {}) => {
    // 默认 hideDelay: 0 简化时序（显式配置优先；tooltip: false 原样透传——全关语义）
    const tooltip =
        options.tooltip === false ? (false as const) : { hideDelay: 0, ...(options.tooltip ?? {}) };
    const m = mount(html, state, { ...options, tooltip });
    engines.push(m.engine);
    return m;
};

/** 劫持 engine.logger.warn 收集悬停期告警（parseTooltipValue 的 warn 出口） */
function hijackWarns(engine: any, fn: () => void): string[] {
    const warns: string[] = [];
    const orig = engine.logger.warn;
    engine.logger.warn = (...args: any[]) => warns.push(args.join(" "));
    try {
        fn();
    } finally {
        engine.logger.warn = orig;
    }
    return warns;
}

const hover = (el: Element, related?: Element | null) =>
    el.dispatchEvent(
        new MouseEvent("mouseover", { bubbles: true, relatedTarget: (related ?? null) as any }),
    );
const unhover = (el: Element, related?: Element | null) =>
    el.dispatchEvent(
        new MouseEvent("mouseout", { bubbles: true, relatedTarget: (related ?? null) as any }),
    );
const focusIn = (el: Element) => el.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
const focusOut = (el: Element) => el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));

/**
 * 确定性收敛 leave 动画（ADR-0039 六类名 + happy-dom 无真实 transition，finishAnim 同款思路）：
 * 内置 slide 过渡 transform + opacity 双属性——结束检测按 computed transition-property 收齐
 * 两个 transitionend 才 finish，须逐属性派发（带 propertyName 过滤）。
 */
const fireTipEnd = (tip: Element) => {
    for (const p of ["transform", "opacity"]) {
        const e = new Event("transitionend");
        (e as any).propertyName = p;
        tip.dispatchEvent(e);
    }
};

const shown = (tip: HTMLElement | null) => tip != null && tip.style.display === "block";

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("title → data-tooltip 编译期转换（ADR-0061 决策 4/5）", () => {
    test("title 转移值并剥除；原生 tooltip 属性不进结果 DOM", () => {
        const { root } = mountTip(`<div id="app"><button id="t" title="你好">B</button></div>`);
        const t = root.querySelector("#t")!;
        expect(t.hasAttribute("title")).toBe(false);
        expect(t.getAttribute("data-tooltip")).toBe("你好");
    });

    test("title 与 data-tooltip 并存：data-tooltip 优先，仅剥 title", () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" title="旧" data-tooltip="新">B</button></div>`,
        );
        const t = root.querySelector("#t")!;
        expect(t.hasAttribute("title")).toBe(false);
        expect(t.getAttribute("data-tooltip")).toBe("新");
    });

    test("tooltip: false 全关：title 原样保留（原生行为）", () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" title="原生">B</button></div>`,
            {},
            { tooltip: false as const },
        );
        const t = root.querySelector("#t")!;
        expect(t.getAttribute("title")).toBe("原生");
        expect(t.hasAttribute("data-tooltip")).toBe(false);
    });

    test("x-for 项模板统一覆盖：每项克隆各自转换", async () => {
        const { root } = mountTip(
            `<div id="app"><div x-for="item of items"><button :title="item.tip" :data-tooltip="item.tip">x</button></div></div>`,
            { items: [{ tip: "a" }, { tip: "b" }] },
        );
        await nextTick();
        const tips = Array.from(root.querySelectorAll("button")).map((b) =>
            b.getAttribute("data-tooltip"),
        );
        expect(tips).toEqual(["a", "b"]);
        expect(root.querySelector("button[title]")).toBeNull();
    });
});

describe("委托监听与单例浮层（决策 10/11）", () => {
    test("悬停显示：容器懒创建 + 内容渲染 + placement 默认 top 写回", async () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" data-tooltip="提示<b>加粗</b>">B</button></div>`,
        );
        expect(containerOf()).toBeNull(); // 懒创建
        hover(root.querySelector("#t")!);
        const tip = tipOf()!;
        expect(tip).not.toBeNull();
        expect(shown(tip)).toBe(true);
        expect(tip.innerHTML).toContain("提示<b>加粗</b>");
        await nextTick(); // computePosition 微任务
        expect(tip.getAttribute("data-tooltip-placement")).toBe("top");
    });

    test("移出隐藏（hideDelay: 0）+ tooltip:hide 广播", async () => {
        const { root, engine } = mountTip(
            `<div id="app"><button id="t" data-tooltip="x">B</button></div>`,
        );
        const t = root.querySelector("#t")!;
        const events: string[] = [];
        engine.on("tooltip:show", (m: any) => events.push("show"));
        engine.on("tooltip:hide", (m: any) => events.push("hide"));
        hover(t);
        expect(shown(tipOf())).toBe(true);
        unhover(t);
        fireTipEnd(tipOf()!); // leave 动画立即收敛（teardown 同步执行）
        expect(shown(tipOf())).toBe(false);
        expect(events).toEqual(["show", "hide"]);
    });

    test("DOM 通道：浮层元素 dispatchEvent 冒泡至 document（body 侧监听可达）", async () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" data-tooltip="x">B</button></div>`,
        );
        const t = root.querySelector("#t")!;
        const events: string[] = [];
        document.body.addEventListener("tooltip:show", ((e: CustomEvent) => {
            events.push(`dom:${e.detail.el === t}:${!!e.detail.tip}`);
        }) as EventListener);
        hover(t);
        expect(events).toEqual(["dom:true:true"]);
    });

    test("closest 命中最近祖先：悬停子元素触发父 data-tooltip；嵌套取最近", () => {
        const { root } = mountTip(
            `<div id="app">
                <div data-tooltip="外"><span id="inner">内</span></div>
                <div data-tooltip="祖"><div data-tooltip="近" id="mid"><i id="leaf">叶</i></div></div>
            </div>`,
        );
        hover(root.querySelector("#inner")!);
        expect(tipOf()!.textContent).toContain("外");
        unhover(root.querySelector("#inner")!);
        hover(root.querySelector("#leaf")!);
        expect(tipOf()!.textContent).toContain("近");
    });

    test("showDelay / hideDelay 延迟防抖：期间移出取消显示，离场延迟收敛", async () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" data-tooltip="x">B</button></div>`,
            {},
            { tooltip: { showDelay: 40, hideDelay: 40 } },
        );
        const t = root.querySelector("#t")!;
        hover(t);
        expect(shown(tipOf())).toBe(false); // 延迟窗口内未显示
        unhover(t); // 显示前移出：取消
        await new Promise((r) => setTimeout(r, 80));
        expect(shown(tipOf())).toBe(false);
        // 完整流程：进入 → 延迟后显示 → 离开 → 延迟窗口内仍显示 → 收敛隐藏
        hover(t);
        await new Promise((r) => setTimeout(r, 80));
        expect(shown(tipOf())).toBe(true);
        unhover(t);
        expect(shown(tipOf())).toBe(true); // 隐藏延迟窗口内仍可见（防闪烁）
        await new Promise((r) => setTimeout(r, 80));
        fireTipEnd(tipOf()!);
        expect(shown(tipOf())).toBe(false);
    });

    test("显示中切换目标：单例内容随悬停目标替换", async () => {
        const { root } = mountTip(
            `<div id="app">
                <button id="a" data-tooltip="甲">A</button>
                <button id="b" data-tooltip="乙">B</button>
            </div>`,
        );
        hover(root.querySelector("#a")!);
        expect(tipOf()!.textContent).toContain("甲");
        hover(root.querySelector("#b")!);
        expect(tipOf()!.textContent).toContain("乙");
        unhover(root.querySelector("#b")!);
        fireTipEnd(tipOf()!);
        expect(shown(tipOf())).toBe(false);
    });

    test("focusin/focusout 键盘同管道（决策 12）", async () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" data-tooltip="键盘可达">B</button></div>`,
        );
        const t = root.querySelector("#t")!;
        focusIn(t);
        expect(shown(tipOf())).toBe(true);
        focusOut(t);
        fireTipEnd(tipOf()!);
        expect(shown(tipOf())).toBe(false);
    });

    test("离场动画播中移回浮层：取消离场恢复显示（可交互 tooltip）", () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" data-tooltip="x">B</button></div>`,
        );
        const t = root.querySelector("#t")!;
        hover(t);
        const tip = tipOf()!;
        unhover(t); // 隐藏发起，leave 动画播放中（display 仍 block）
        hover(tip); // 鼠标进入浮层（容器监听点收到）→ 恢复显示
        expect(shown(tip)).toBe(true);
        expect(tip.textContent).toContain("x");
        // 从浮层移出：可交互 tooltip 的出口 → 延迟隐藏收敛
        unhover(tip);
        fireTipEnd(tip);
        expect(shown(tip)).toBe(false);
    });

    test("内部移动（relatedTarget 在触发元素/浮层内）不触发隐藏", async () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" data-tooltip="x"><i id="child">i</i></button></div>`,
        );
        const t = root.querySelector("#t")!;
        hover(t);
        const tip = tipOf()!;
        // 子元素间移动：伪离场
        unhover(t, t.querySelector("#child")!);
        expect(shown(tip)).toBe(true);
        // 移入浮层：可交互 tooltip（取消隐藏）
        unhover(t, tip);
        await new Promise((r) => setTimeout(r, 20));
        expect(shown(tip)).toBe(true);
    });

    test("空值静默：data-tooltip 为空串不显示", () => {
        const { root } = mountTip(`<div id="app"><button id="t" data-tooltip="">B</button></div>`);
        hover(root.querySelector("#t")!);
        expect(shown(tipOf())).toBe(false);
    });
});

describe("值语法与配置（决策 7/8/9）", () => {
    test("JSON 形态：placement 覆盖 + className + content 载体", async () => {
        const { root } = mountTip(
            `<div id="app"><button id="t" data-tooltip="{content: '左弹', placement: 'left', className: 'theme-x'}">B</button></div>`,
        );
        hover(root.querySelector("#t")!);
        const tip = tipOf()!;
        // enter 的结束检测在切换帧（rAF+宏任务）注册，先等帧再手动收敛动画类
        await nextTick();
        fireTipEnd(tip);
        expect(tip.textContent).toContain("左弹");
        expect(tip.className).toBe("autospark-tooltip theme-x");
        await nextTick();
        expect(tip.getAttribute("data-tooltip-placement")).toBe("left");
    });

    test("未知配置键 warn + 忽略；缺 content 键 warn 不显示", () => {
        const { root, engine } = mountTip(
            `<div id="app">
                <button id="bad" data-tooltip="{contnt: '拼错'}">B</button>
                <button id="noc" data-tooltip="{placement: 'left'}">C</button>
            </div>`,
        );
        let warns = hijackWarns(engine, () => hover(root.querySelector("#bad")!));
        expect(warns.some((w) => w.includes('未知配置键 "contnt"'))).toBe(true);
        expect(shown(tipOf())).toBe(false); // 无 content → 不显示
        warns = hijackWarns(engine, () => hover(root.querySelector("#noc")!));
        expect(warns.some((w) => w.includes("缺少 content 键"))).toBe(true);
    });

    test("HTML 内容经 options.sanitizer 消毒（x-html 同通道）", () => {
        // sanitizer 是函数选项（无法经 HTML 字面量挂载），直接构造 engine
        const root = document.createElement("div");
        root.innerHTML = `<button id="t" data-tooltip="a<script>alert(1)</script>b">B</button>`;
        const engine = new AutoSpark(root, {}, {
            tooltip: { hideDelay: 0 },
            sanitizer: (h: string) => h.replace(/script/g, ""),
        } as any);
        engines.push(engine);
        hover(root.querySelector("#t")!);
        expect(tipOf()!.innerHTML).not.toContain("<script");
    });

    test("border / arrow 默认开；显式关闭移除标记与载体", () => {
        const { root } = mountTip(
            `<div id="app">
                <button id="t1" data-tooltip="x">A</button>
                <button id="t2" data-tooltip="{content: '无框', border: false, arrow: false}">B</button>
            </div>`,
        );
        hover(root.querySelector("#t1")!);
        let tip = tipOf()!;
        expect(tip.hasAttribute("data-tooltip-border")).toBe(true);
        expect(tip.querySelector(".autospark-tooltip-arrow")).not.toBeNull();
        hover(root.querySelector("#t2")!);
        tip = tipOf()!;
        expect(tip.textContent).toContain("无框");
        expect(tip.hasAttribute("data-tooltip-border")).toBe(false);
        expect(tip.querySelector(".autospark-tooltip-arrow")).toBeNull();
    });

    test("插值内容响应式：属性更新后下次悬停读到新值（显示中不热更）", async () => {
        const { root, engine } = mountTip(
            `<div id="app"><button id="t" data-tooltip="共 {{n}} 项">B</button></div>`,
            { n: 1 },
        );
        const t = root.querySelector("#t")!;
        hover(t);
        expect(tipOf()!.textContent).toContain("共 1 项");
        engine.state.n = 2;
        await nextTick();
        expect(t.getAttribute("data-tooltip")).toBe("共 2 项");
        expect(tipOf()!.textContent).toContain("共 1 项"); // 显示中不热更
        unhover(t);
        await nextTick();
        hover(t);
        expect(tipOf()!.textContent).toContain("共 2 项"); // 下次悬停生效
    });

    test("maxWidth / maxHeight：inline 覆盖 CSS 变量默认（数字 px / 字符串透传）", () => {
        const { root } = mountTip(
            `<div id="app">
                <button id="a" data-tooltip="{content: 'x', maxWidth: 200, maxHeight: '30vh'}">A</button>
                <button id="b" data-tooltip="无配置吃默认">B</button>
            </div>`,
        );
        hover(root.querySelector("#a")!);
        let tip = tipOf()!;
        expect(tip.style.maxWidth).toBe("200px");
        expect(tip.style.maxHeight).toBe("30vh");
        hover(root.querySelector("#b")!);
        tip = tipOf()!;
        expect(tip.style.maxWidth).toBe(""); // 未配置 → 清 inline，吃 CSS 变量默认（50vw/50vh）
        expect(tip.style.maxHeight).toBe("");
    });

    test("options.tooltip 全局默认：元素级覆盖", async () => {
        const { root } = mountTip(
            `<div id="app">
                <button id="a" data-tooltip="全局向">A</button>
                <button id="b" data-tooltip="{content: '右弹', placement: 'right'}">B</button>
            </div>`,
            {},
            { tooltip: { hideDelay: 0, placement: "bottom" } },
        );
        hover(root.querySelector("#a")!);
        await nextTick();
        expect(tipOf()!.getAttribute("data-tooltip-placement")).toBe("bottom");
        hover(root.querySelector("#b")!);
        await nextTick();
        expect(tipOf()!.getAttribute("data-tooltip-placement")).toBe("right");
    });
});

describe("命令式 API（决策 18）", () => {
    test("engine.tooltip.show：opts 单次覆盖，content 可无 DOM 属性注入；hide 立即", async () => {
        const { root, engine } = mountTip(`<div id="app"><button id="t">B</button></div>`);
        const t = root.querySelector("#t") as HTMLElement;
        engine.tooltip.show(t, { content: "命令式", placement: "right" });
        const tip = tipOf()!;
        expect(tip.textContent).toContain("命令式");
        engine.tooltip.hide();
        fireTipEnd(tip);
        expect(shown(tip)).toBe(false);
    });

    test("tooltip: false 时命令式 warn + no-op、委托不生效", () => {
        const { root, engine } = mountTip(
            `<div id="app"><button id="t" data-tooltip="x">B</button></div>`,
            {},
            { tooltip: false as const },
        );
        const warns = hijackWarns(engine, () =>
            engine.tooltip.show(root.querySelector("#t") as HTMLElement),
        );
        expect(warns.some((w) => w.includes("已通过 options.tooltip: false 关闭"))).toBe(true);
        hover(root.querySelector("#t")!);
        expect(containerOf()).toBeNull(); // 监听未挂、容器未建
    });
});

describe("边界与生命周期（决策 13/15）", () => {
    test("断连兜底：显示中触发元素被移除 → 立即隐藏", async () => {
        // 兜底语义 = 「曾连接 → 断开」跳变（detached 悬停不误杀）——须真实挂载复现
        const root = document.createElement("div");
        root.innerHTML = `<button id="t" data-tooltip="x">B</button>`;
        document.body.appendChild(root);
        const engine = new AutoSpark(root, {}, { tooltip: { hideDelay: 0 } } as any);
        engines.push(engine);
        try {
            const t = root.querySelector("#t")!;
            hover(t);
            const tip = tipOf()!;
            expect(shown(tip)).toBe(true);
            t.remove();
            await new Promise((r) => setTimeout(r, 60)); // rAF 兜底推进
            expect(shown(tip)).toBe(false);
        } finally {
            root.remove();
        }
    });

    test("engine.stop() 同步隐藏；destroy() 摘除容器", async () => {
        const { root, engine } = mountTip(
            `<div id="app"><button id="t" data-tooltip="x">B</button></div>`,
        );
        hover(root.querySelector("#t")!);
        expect(shown(tipOf())).toBe(true);
        engine.stop();
        expect(shown(tipOf())).toBe(false);
        expect(containerOf()).not.toBeNull(); // stop 摘容器不发生（仅隐藏）
        engine.destroy();
        expect(containerOf()).toBeNull();
    });

    test("嵌套引擎归属过滤：外层监听不响应内层引擎树内的命中（防双显）", () => {
        const outer = document.createElement("div");
        outer.innerHTML = `<div><button id="in" data-tooltip="内层">N</button></div>`.trim();
        document.body.appendChild(outer);
        engines.push(new AutoSpark(outer, {}));
        // 内层引擎根放外层引擎树内：其内部事件冒泡至外层根监听
        const inner = document.createElement("div");
        inner.innerHTML = `<button id="deep" data-tooltip="深层">D</button>`.trim();
        outer.querySelector("div")!.appendChild(inner);
        engines.push(new AutoSpark(inner, {}));

        hover(outer.querySelector("#in")!);
        expect(tipOf()!.textContent).toContain("内层"); // 外层引擎正常响应自己的树
        hover(inner.querySelector("#deep")!);
        // 内层引擎响应（外层委托被归属过滤忽略）——每引擎独立容器，浮层互不相扰：
        // 内层浮层显示「深层」、外层浮层不被内层悬停切换（保持其上一个目标的内容）
        const tips = document.querySelectorAll(".autospark-tooltips > .autospark-tooltip");
        expect(tips.length).toBe(2);
        expect(tips[1]!.textContent).toContain("深层");
        expect(tips[0]!.textContent).toContain("内层");
    });
});
