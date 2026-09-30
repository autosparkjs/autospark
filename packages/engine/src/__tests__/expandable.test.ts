import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick, finishAnim } from "./helpers";

/**
 * x-expandable 展开折叠指令测试（ADR-0069）。
 *
 * 覆盖面：值与双向绑定（简单路径回写 / 表达式只读降级 / 字面量恒态 / 空值不作为）、
 * direction（默认与四方向 margin/transform 分派、非法回退）、margin 通道（负 margin 滑出 +
 * 宽度保持 + 终态不归零）、slide 通道（transform 平移占位不变）、minSize>0（尺寸收缩 +
 * 子内容不隐藏 + 把手不迁移）、maxSize（有值内联 / 缺省移除自己写的 inline、用户 inline 不动）、
 * 把手（DOM 契约 / 键盘 / pos 三态与热应用）、reparent（折叠完成迁父容器 / 展开前迁回 /
 * 初始折叠立即迁移）、父容器注入（dock/clip 挂摘 / 幂等 / injectOverflow:false 回落 warn /
 * 多实例引用计数）、事件（expand/collapse detail / 初始不派发）、初始态与销毁、
 * 宿主样式契约（static 补 relative / overflow 非 visible 检测 warn）、把手显隐
 * （showTrigger 三态：默认 hover / always / 非法回退）、渐变遮盖（fadeSize 启用标记
 * 与厚度变量 / data-shrunk 收缩态钩子 / 非法回退）、把手偏移（offset 三形态与两态
 * 定位规则的跨轴符号契约）。
 *
 * 约定：happy-dom 无布局——滑出距离走 inline 数值优先路径（模板给宿主 inline 尺寸），
 * 动画结束用 finishAnim 手动派发 transitionend（helpers 惯例）。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];
const mountExpandable = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    document.body.appendChild(m.root);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
};

function catchWarns(open: () => void): string[] {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
    try {
        open();
    } finally {
        console.warn = orig;
    }
    return warns;
}

/**
 * 标准模板：box（父容器，flex 布局模拟侧栏场景）> host（x-expandable 宿主，inline 尺寸
 * 供滑出距离测量）+ main（兄弟元素）。attrs 透传 x-expandable-options 等。
 */
const tmpl = (attrs = "", inner = "<span>侧栏内容</span>", style = "width:200px") =>
    `<div id="app"><div id="box" style="display:flex;width:600px;height:400px">` +
    `<div id="host" x-expandable="ui.open" ${attrs} style="${style}">${inner}</div>` +
    `<div id="main">主区</div></div></div>`;

const hostOf = (root: HTMLElement) => root.querySelector("#host") as HTMLElement;
const boxOf = (root: HTMLElement) => root.querySelector("#box") as HTMLElement;
const triggerOf = (root: HTMLElement) => root.querySelector(".autospark-expandable-trigger") as HTMLElement;

/** 点击把手翻转（回写经 scheduler 微任务合并，须 await nextTick） */
const clickToggle = (t: HTMLElement) => t.dispatchEvent(new MouseEvent("click", { bubbles: true }));

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    while (roots.length) roots.pop()?.remove();
});

// ── 值与双向绑定 ──────────────────────────────────────────────────────

describe("值与双向绑定", () => {
    test("简单路径双向：点击把手回写状态翻转（true → false → true）", async () => {
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        const host = hostOf(root);
        const t = triggerOf(root);
        expect(engine.store.state.ui.open).toBe(true);

        clickToggle(t);
        await nextTick();
        expect(engine.store.state.ui.open).toBe(false);
        expect(host.hasAttribute("data-collapsed")).toBe(true);

        clickToggle(t);
        await nextTick();
        expect(engine.store.state.ui.open).toBe(true);
        expect(host.hasAttribute("data-collapsed")).toBe(false);
    });

    test("外部状态驱动：改状态 → DOM 响应（margin 滑出/收回）", async () => {
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        expect(host.style.marginLeft).toBe("-200px"); // inline width 200 → 滑出距离
        engine.store.state.ui.open = true;
        await nextTick();
        expect(host.style.marginLeft).toBe("");
    });

    test("表达式只读降级（覆盖值形态）：warn + 点击 no-op", async () => {
        const html =
            `<div id="app"><div id="box" style="display:flex">` +
            `<div id="host" x-expandable="ui.a || ui.b" style="width:200px">x</div></div></div>`;
        const warns = catchWarns(() => mountExpandable(html, { ui: { a: true, b: false } }));
        expect(warns.some((w) => w.includes("只读"))).toBe(true);
        const { engine, root } = { engine: engines[engines.length - 1], root: roots[roots.length - 1] };
        clickToggle(triggerOf(root));
        await nextTick();
        expect(engine.store.state.ui.a).toBe(true); // 未被改写
        expect(hostOf(root).hasAttribute("data-collapsed")).toBe(false); // DOM 不动
    });

    test("字面量恒态：'false' 初始折叠、点击 no-op、无 warn", async () => {
        const html =
            `<div id="app"><div id="box" style="display:flex">` +
            `<div id="host" x-expandable="'false'" style="width:200px">x</div></div></div>`;
        const warns = catchWarns(() => mountExpandable(html, { ui: {} }));
        expect(warns.length).toBe(0);
        await nextTick();
        const host = hostOf(roots[roots.length - 1]!);
        expect(host.hasAttribute("data-collapsed")).toBe(true);
        clickToggle(triggerOf(roots[roots.length - 1]!));
        await nextTick();
        expect(host.hasAttribute("data-collapsed")).toBe(true); // no-op
    });

    test("空值：warn + 指令不作为（无类名无把手）", () => {
        const html =
            `<div id="app"><div id="box"><div id="host" x-expandable style="width:200px">x</div></div></div>`;
        const warns = catchWarns(() => mountExpandable(html, { ui: {} }));
        const host = hostOf(roots[roots.length - 1]!);
        expect(warns.some((w) => w.includes("指令未生效"))).toBe(true);
        expect(host.classList.contains("autospark-expandable")).toBe(false);
        expect(triggerOf(roots[roots.length - 1]!)).toBeNull();
    });
});

// ── direction ─────────────────────────────────────────────────────────

describe("direction 方向", () => {
    test("默认 left（data-direction 属性）", () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: true } });
        expect(hostOf(root).getAttribute("data-direction")).toBe("left");
    });

    test("四方向负 margin 分派（left/right → margin 左右；top/bottom → margin 上下 + height 轴）", async () => {
        const cases: Array<[string, string, string, string]> = [
            ["left", "width:200px", "marginLeft", "-200px"],
            ["right", "width:200px", "marginRight", "-200px"],
            ["top", "height:100px", "marginTop", "-100px"],
            ["bottom", "height:100px", "marginBottom", "-100px"],
        ];
        for (const [dir, style, prop, expectVal] of cases) {
            const html =
                `<div id="app"><div id="box">` +
                `<div id="host" x-expandable="ui.open" x-expandable-options="{direction:'${dir}'}" style="${style}">x</div></div></div>`;
            const m = mountExpandable(html, { ui: { open: true } });
            m.engine.store.state.ui.open = false;
            await nextTick();
            const host = m.root.querySelector("#host") as any;
            expect(host.style[prop]).toBe(expectVal);
        }
    });

    test("非法 direction warn 回退 left", () => {
        const warns = catchWarns(() =>
            mountExpandable(tmpl(`x-expandable-options="{direction:'diagonal'}"`), { ui: { open: true } }),
        );
        expect(warns.some((w) => w.includes("direction"))).toBe(true);
        expect(hostOf(roots[roots.length - 1]!).getAttribute("data-direction")).toBe("left");
    });
});

// ── margin 通道（默认）────────────────────────────────────────────────

describe("折叠通道 margin（默认）", () => {
    test("折叠三件套：data-collapsed + 负 margin + 宽度保持（终态不归零）", async () => {
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        expect(host.hasAttribute("data-collapsed")).toBe(true);
        expect(host.style.marginLeft).toBe("-200px");
        expect(host.style.width).toBe("200px"); // 宽度保持——不改尺寸（决策四）
        expect(host.style.transform).toBe(""); // 未走 slide 通道
    });

    test("展开清滑出痕迹（margin 移除 + data-collapsed 摘除）", async () => {
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        engine.store.state.ui.open = true;
        await nextTick();
        expect(host.style.marginLeft).toBe("");
        expect(host.hasAttribute("data-collapsed")).toBe(false);
    });
});

// ── slide 通道 ────────────────────────────────────────────────────────

describe("折叠通道 slide（transform 平移）", () => {
    test("折叠 transform 平移 + 占位不变（无 margin 写入）+ 终态保持", async () => {
        const { engine, root } = mountExpandable(
            tmpl(`x-expandable-options="{collapse:'slide'}"`),
            { ui: { open: true } },
        );
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        expect(host.style.transform).toBe("translateX(-100%)");
        expect(host.style.marginLeft).toBe(""); // 占位不变
        expect(host.style.width).toBe("200px");
        expect(host.hasAttribute("data-collapsed")).toBe(true);
    });

    test("四方向 transform 分派", async () => {
        const cases: Array<[string, string]> = [
            ["left", "translateX(-100%)"],
            ["right", "translateX(100%)"],
            ["top", "translateY(-100%)"],
            ["bottom", "translateY(100%)"],
        ];
        for (const [dir, tf] of cases) {
            const html =
                `<div id="app"><div id="box">` +
                `<div id="host" x-expandable="ui.open" x-expandable-options="{collapse:'slide',direction:'${dir}'}" style="width:200px">x</div></div></div>`;
            const m = mountExpandable(html, { ui: { open: true } });
            m.engine.store.state.ui.open = false;
            await nextTick();
            expect((m.root.querySelector("#host") as HTMLElement).style.transform).toBe(tf);
        }
    });

    test("非法 collapse warn 回退 margin", () => {
        const warns = catchWarns(() =>
            mountExpandable(tmpl(`x-expandable-options="{collapse:'fade'}"`), { ui: { open: true } }),
        );
        expect(warns.some((w) => w.includes("collapse"))).toBe(true);
    });
});

// ── minSize>0 尺寸收缩 ────────────────────────────────────────────────

describe("minSize>0 尺寸收缩", () => {
    test("折叠：inline 尺寸 = minSize + 无滑出痕迹 + 宿主无 data-collapsed（内容不隐藏）", async () => {
        const { engine, root } = mountExpandable(
            tmpl(`x-expandable-options="{minSize:48,maxSize:280}"`, "<span>迷你态</span>"),
            { ui: { open: true } },
        );
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        expect(host.style.width).toBe("48px");
        expect(host.style.marginLeft).toBe("");
        expect(host.style.transform).toBe("");
        expect(host.hasAttribute("data-collapsed")).toBe(false); // 内容不隐藏（决策四）
    });

    test("把手 data-collapsed 独立翻转（箭头翻转钩子，与宿主属性分离）", async () => {
        const { engine, root } = mountExpandable(
            tmpl(`x-expandable-options="{minSize:48}"`),
            { ui: { open: true } },
        );
        const t = triggerOf(root);
        expect(t.hasAttribute("data-collapsed")).toBe(false);
        engine.store.state.ui.open = false;
        await nextTick();
        expect(t.hasAttribute("data-collapsed")).toBe(true); // 把手箭头翻转
        expect(hostOf(root).hasAttribute("data-collapsed")).toBe(false); // 宿主不隐藏内容
    });

    test("top 方向 height 轴收缩", async () => {
        const html =
            `<div id="app"><div id="box">` +
            `<div id="host" x-expandable="ui.open" x-expandable-options="{direction:'top',minSize:40}" style="height:100px">x</div></div></div>`;
        const m = mountExpandable(html, { ui: { open: true } });
        m.engine.store.state.ui.open = false;
        await nextTick();
        expect((m.root.querySelector("#host") as HTMLElement).style.height).toBe("40px");
    });

    test("展开恢复 maxSize", async () => {
        const { engine, root } = mountExpandable(
            tmpl(`x-expandable-options="{minSize:48,maxSize:280}"`),
            { ui: { open: true } },
        );
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        engine.store.state.ui.open = true;
        await nextTick();
        expect(host.style.width).toBe("280px");
    });
});

// ── maxSize 展开尺寸 ──────────────────────────────────────────────────

describe("maxSize 展开尺寸", () => {
    test("有值：初始展开即写 inline（编译期同步）", () => {
        const { root } = mountExpandable(tmpl(`x-expandable-options="{maxSize:280}"`), {
            ui: { open: true },
        });
        expect(hostOf(root).style.width).toBe("280px");
    });

    test("缺省：不碰用户模板自带的 inline 尺寸（滑出折叠 → 展开，用户 width 原样）", async () => {
        // maxSize 缺省 = 展开时移除 inline 让 CSS 决定——但仅限本指令写过的，
        // 用户模板 inline 不动（_ownSizeProp 所有权标志回归）
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        engine.store.state.ui.open = true;
        await nextTick();
        expect(host.style.width).toBe("200px"); // 用户 inline 未被误删
    });

    test("缺省：本指令写过（minSize>0 折叠）则展开时移除", async () => {
        const { engine, root } = mountExpandable(tmpl(`x-expandable-options="{minSize:48}"`), {
            ui: { open: true },
        });
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        expect(host.style.width).toBe("48px"); // 指令写的
        engine.store.state.ui.open = true;
        await nextTick();
        expect(host.style.width).toBe(""); // 指令写的被移除，让 CSS 决定
    });
});

// ── 把手契约 ──────────────────────────────────────────────────────────

describe("把手契约", () => {
    test("DOM 结构：类名 + role=button + tabindex + aria-label + 箭头 use #as-arrow", () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: true } });
        const t = triggerOf(root);
        expect(t).not.toBeNull();
        expect(t.getAttribute("role")).toBe("button");
        expect(t.tabIndex).toBe(0);
        expect(t.getAttribute("aria-label")).toBe("展开/折叠");
        const use = t.querySelector("use");
        expect(use?.getAttribute("href")).toBe("#as-arrow");
        expect(t.parentElement).toBe(hostOf(root)); // 展开态挂宿主
    });

    test("键盘 Enter / Space 触发翻转", async () => {
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        triggerOf(root).dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", cancelable: true, bubbles: true }),
        );
        await nextTick();
        expect(engine.store.state.ui.open).toBe(false);
        triggerOf(root).dispatchEvent(
            new KeyboardEvent("keydown", { key: " ", cancelable: true, bubbles: true }),
        );
        await nextTick();
        expect(engine.store.state.ui.open).toBe(true);
    });

    test("pos 三态：默认 center ≡ 50%；number = px；string 负值 → data-pos-negative", () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: true } });
        const t = triggerOf(root) as any;
        expect(t.style.getPropertyValue("--as-pos")).toBe("50%");
        expect(t.hasAttribute("data-pos-negative")).toBe(false);

        const m2 = mountExpandable(tmpl(`x-expandable-options="{pos:60}"`), { ui: { open: true } });
        const t2 = triggerOf(m2.root) as any;
        expect(t2.style.getPropertyValue("--as-pos")).toBe("60px");

        const m3 = mountExpandable(tmpl(`x-expandable-options="{pos:'-10%'}"`), { ui: { open: true } });
        const t3 = triggerOf(m3.root);
        expect((t3 as any).style.getPropertyValue("--as-pos")).toBe("10%");
        expect(t3.hasAttribute("data-pos-negative")).toBe(true);
    });

    test("pos 非法 warn 回退居中", () => {
        const warns = catchWarns(() =>
            mountExpandable(tmpl(`x-expandable-options="{pos:'abc'}"`), { ui: { open: true } }),
        );
        expect(warns.some((w) => w.includes("pos"))).toBe(true);
        const t = triggerOf(roots[roots.length - 1]!) as any;
        expect(t.style.getPropertyValue("--as-pos")).toBe("50%");
    });

    test("pos 成员表达式热应用（x-expandable-options.pos 绑定状态）", async () => {
        const m = mountExpandable(
            tmpl(`x-expandable-options.pos="ui.pos"`),
            { ui: { open: true, pos: "30%" } },
        );
        const t = triggerOf(m.root) as any;
        expect(t.style.getPropertyValue("--as-pos")).toBe("30%");
        m.engine.store.state.ui.pos = "80%";
        await nextTick();
        expect(t.style.getPropertyValue("--as-pos")).toBe("80%");
    });
});

// ── 把手 reparent（决策六动态挂载）────────────────────────────────────

describe("把手 reparent", () => {
    test("滑出折叠动画完成后迁入父容器（transitionend 触发）", async () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: true } });
        const host = hostOf(root);
        const t = triggerOf(root);
        clickToggle(t);
        await nextTick();
        expect(host.hasAttribute("data-animating")).toBe(true); // 动画在播
        expect(t.parentElement).toBe(host); // 动画期间仍在宿主
        finishAnim(host); // 手动派发 transitionend（happy-dom 无真实过渡）
        await nextTick();
        expect(t.parentElement).toBe(boxOf(root)); // 迁入父容器贴停靠边
    });

    test("初始 false：微任务应用即迁移（无动画路径）", async () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: false } });
        await nextTick();
        const t = triggerOf(root);
        expect(hostOf(root).hasAttribute("data-animating")).toBe(false); // 无动画
        expect(t.parentElement).toBe(boxOf(root));
    });

    test("展开：动画启动**前**即迁回宿主", async () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: false } });
        await nextTick();
        const t = triggerOf(root);
        expect(t.parentElement).toBe(boxOf(root));
        clickToggle(t);
        await nextTick();
        expect(t.parentElement).toBe(hostOf(root)); // 同步迁回（不等动画）
        finishAnim(hostOf(root));
    });

    test("minSize>0 折叠永不迁移（宿主不滑出）", async () => {
        const { engine, root } = mountExpandable(tmpl(`x-expandable-options="{minSize:48}"`), {
            ui: { open: true },
        });
        engine.store.state.ui.open = false;
        await nextTick();
        finishAnim(hostOf(root));
        await nextTick();
        expect(triggerOf(root).parentElement).toBe(hostOf(root));
    });

    test("滑出通道 data-direction 随身（reparent 后箭头规则仍生效的属性契约）", async () => {
        const { root } = mountExpandable(
            tmpl(`x-expandable-options="{direction:'right'}"`),
            { ui: { open: false } },
        );
        await nextTick();
        expect(triggerOf(root).getAttribute("data-direction")).toBe("right");
    });
});

// ── 父容器注入（决策七）───────────────────────────────────────────────

describe("父容器注入", () => {
    test("折叠期间挂 dock + clip，展开完成后摘除", async () => {
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        const box = boxOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        expect(box.hasAttribute("data-autospark-expandable-dock")).toBe(true);
        expect(box.hasAttribute("data-autospark-expandable-clip")).toBe(true);
        engine.store.state.ui.open = true;
        await nextTick();
        expect(box.hasAttribute("data-autospark-expandable-dock")).toBe(false);
        expect(box.hasAttribute("data-autospark-expandable-clip")).toBe(false);
    });

    test("父容器本为 overflow:hidden → clip 幂等跳过（dock 恒挂）", async () => {
        const html =
            `<div id="app"><div id="box" style="overflow:hidden">` +
            `<div id="host" x-expandable="ui.open" style="width:200px">x</div></div></div>`;
        const m = mountExpandable(html, { ui: { open: true } });
        m.engine.store.state.ui.open = false;
        await nextTick();
        const box = boxOf(m.root);
        expect(box.hasAttribute("data-autospark-expandable-dock")).toBe(true);
        expect(box.hasAttribute("data-autospark-expandable-clip")).toBe(false); // 已裁剪不重复挂
    });

    test("injectOverflow:false → 不挂 clip + warn 一次", async () => {
        const m = mountExpandable(tmpl(`x-expandable-options="{injectOverflow:false}"`), {
            ui: { open: true },
        });
        // 检测 warn 在折叠动作时发（watcher 经 scheduler 微任务）——拦截窗口须覆盖 await
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        try {
            m.engine.store.state.ui.open = false;
            await nextTick();
        } finally {
            console.warn = orig;
        }
        const box = boxOf(m.root);
        expect(box.hasAttribute("data-autospark-expandable-dock")).toBe(true); // 定位上下文恒注入
        expect(box.hasAttribute("data-autospark-expandable-clip")).toBe(false);
        expect(warns.some((w) => w.includes("injectOverflow"))).toBe(true);
    });

    test("多实例引用计数：最后一个展开完成才摘除", async () => {
        const html =
            `<div id="app"><div id="box" style="display:flex">` +
            `<div id="h1" x-expandable="ui.a" style="width:100px">x</div>` +
            `<div id="h2" x-expandable="ui.b" style="width:100px">y</div></div></div>`;
        const m = mountExpandable(html, { ui: { a: true, b: true } });
        const box = boxOf(m.root);
        m.engine.store.state.ui.a = false;
        m.engine.store.state.ui.b = false;
        await nextTick();
        expect(box.hasAttribute("data-autospark-expandable-clip")).toBe(true);
        m.engine.store.state.ui.a = true; // 第一个展开
        await nextTick();
        expect(box.hasAttribute("data-autospark-expandable-clip")).toBe(true); // 仍被 b 引用
        m.engine.store.state.ui.b = true; // 最后一个展开
        await nextTick();
        expect(box.hasAttribute("data-autospark-expandable-clip")).toBe(false);
    });
});

// ── 事件 ──────────────────────────────────────────────────────────────

describe("事件", () => {
    test("点击折叠派发 expandable:collapse（detail.size=0）、展开派发 expandable:expand（detail.size=null）", async () => {
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        const events: string[] = [];
        const details: any[] = [];
        root.addEventListener("expandable:collapse", (e: any) => {
            events.push("collapse");
            details.push(e.detail);
        });
        root.addEventListener("expandable:expand", (e: any) => {
            events.push("expand");
            details.push(e.detail);
        });
        clickToggle(triggerOf(root));
        await nextTick();
        clickToggle(triggerOf(root));
        await nextTick();
        expect(events).toEqual(["collapse", "expand"]);
        expect(details[0]).toEqual({ size: 0 }); // 滑出折叠 size=0
        expect(details[1]).toEqual({ size: null }); // maxSize 缺省
        void engine;
    });

    test("detail.size 承载 maxSize / minSize 格式化值", async () => {
        const m = mountExpandable(tmpl(`x-expandable-options="{minSize:48,maxSize:280}"`), {
            ui: { open: true },
        });
        const sizes: any[] = [];
        m.root.addEventListener("expandable:collapse", (e: any) => sizes.push(e.detail.size));
        m.root.addEventListener("expandable:expand", (e: any) => sizes.push(e.detail.size));
        m.engine.store.state.ui.open = false;
        await nextTick();
        m.engine.store.state.ui.open = true;
        await nextTick();
        expect(sizes).toEqual(["48px", "280px"]);
    });

    test("初始折叠应用不派发（事件只反馈变更）", async () => {
        const m = mountExpandable(tmpl(), { ui: { open: false } });
        let count = 0;
        m.root.addEventListener("expandable:collapse", () => count++);
        await nextTick();
        expect(count).toBe(0);
    });
});

// ── 初始态与销毁 ──────────────────────────────────────────────────────

describe("初始态与销毁", () => {
    test("初始 false：微任务后立即终态（无 data-animating——初始应用无动画）", async () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: false } });
        await nextTick();
        const host = hostOf(root);
        expect(host.style.marginLeft).toBe("-200px");
        expect(host.hasAttribute("data-collapsed")).toBe(true);
        expect(host.hasAttribute("data-animating")).toBe(false);
    });

    test("折叠态销毁：父容器注入释放 + 把手移除", async () => {
        const m = mountExpandable(tmpl(), { ui: { open: true } });
        m.engine.store.state.ui.open = false;
        await nextTick();
        const box = boxOf(m.root);
        const t = triggerOf(m.root);
        m.engine.destroy();
        expect(box.hasAttribute("data-autospark-expandable-dock")).toBe(false);
        expect(box.hasAttribute("data-autospark-expandable-clip")).toBe(false);
        expect(t.isConnected).toBe(false);
    });

    test("全局样式注入（幂等 id）", () => {
        mountExpandable(tmpl(), { ui: { open: true } });
        expect(document.getElementById("autospark-expandable-styles")).not.toBeNull();
    });
});

// ── 宿主样式契约 ──────────────────────────────────────────────────────

describe("宿主样式契约", () => {
    test("static 宿主自动补 inline position:relative（把手定位上下文）", async () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: true } });
        await nextTick();
        expect(hostOf(root).style.position).toBe("relative");
    });

    test("宿主 overflow 非 visible（hidden）：编译后 warn 一次，提示内层包裹承载", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        try {
            mountExpandable(tmpl("", "<span>x</span>", "width:200px;overflow:hidden"), {
                ui: { open: true },
            });
            await nextTick();
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("内层包裹"))).toBe(true);
    });

    test("宿主 overflow 默认（visible）：不 warn", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        try {
            mountExpandable(tmpl(), { ui: { open: true } });
            await nextTick();
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("overflow"))).toBe(false);
    });
});

// ── 把手显隐（showTrigger） ───────────────────────────────────────────

describe("把手显隐（showTrigger）", () => {
    test("默认 hover：宿主挂 data-show-trigger=hover + 感应边条注入（把手之前）", () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: true } });
        const host = hostOf(root);
        expect(host.getAttribute("data-show-trigger")).toBe("hover");
        const edge = host.querySelector(".autospark-expandable-edge") as HTMLElement;
        expect(edge).not.toBeNull();
        // 边条必须是把手的前置兄弟（.edge:hover ~ .trigger 显形的前提）
        expect(edge.nextElementSibling).toBe(triggerOf(root));
        expect(edge.getAttribute("aria-hidden")).toBe("true");
    });

    test("always：宿主级恒常驻标记", () => {
        const { root } = mountExpandable(
            tmpl(`x-expandable-options="{showTrigger:'always'}"`),
            { ui: { open: true } },
        );
        expect(hostOf(root).getAttribute("data-show-trigger")).toBe("always");
    });

    test("非法值 warn 回退 hover", () => {
        const warns = catchWarns(() =>
            mountExpandable(tmpl(`x-expandable-options="{showTrigger:'auto'}"`), {
                ui: { open: true },
            }),
        );
        expect(warns.some((w) => w.includes("showTrigger"))).toBe(true);
        const root = roots[roots.length - 1] as HTMLElement;
        expect(hostOf(root).getAttribute("data-show-trigger")).toBe("hover");
    });

    test("销毁：感应边条随宿主移除", () => {
        const { root } = mountExpandable(tmpl(), { ui: { open: true } });
        const host = hostOf(root);
        root.querySelector(".autospark-expandable-trigger")!.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );
        engines[engines.length - 1]?.destroy();
        expect(host.querySelector(".autospark-expandable-edge")).toBeNull();
        expect(host.querySelector(".autospark-expandable-trigger")).toBeNull();
    });
});

// ── 渐变遮盖（fadeSize） ──────────────────────────────────────────────

describe("渐变遮盖（fadeSize）", () => {
    test("默认 0：不启用（无 data-fade、无厚度变量）", () => {
        const { root } = mountExpandable(tmpl(`x-expandable-options="{minSize:48}"`), {
            ui: { open: true },
        });
        const host = hostOf(root);
        expect(host.hasAttribute("data-fade")).toBe(false);
        expect(host.style.getPropertyValue("--as-fade-size")).toBe("");
    });

    test("启用：data-fade + --as-fade-size 变量（编译期写入）", () => {
        const { root } = mountExpandable(
            tmpl(`x-expandable-options="{minSize:48,fadeSize:40}"`),
            { ui: { open: true } },
        );
        const host = hostOf(root);
        expect(host.hasAttribute("data-fade")).toBe(true);
        expect(host.style.getPropertyValue("--as-fade-size")).toBe("40px");
    });

    test("收缩折叠挂 data-shrunk（fadeSize 未启用也挂——通用收缩态钩子），展开摘除", async () => {
        const { engine, root } = mountExpandable(tmpl(`x-expandable-options="{minSize:48}"`), {
            ui: { open: true },
        });
        const host = hostOf(root);
        engine.store.state.ui.open = false;
        await nextTick();
        expect(host.hasAttribute("data-shrunk")).toBe(true);
        engine.store.state.ui.open = true;
        await nextTick();
        expect(host.hasAttribute("data-shrunk")).toBe(false);
    });

    test("滑出折叠（minSize=0）不挂 data-shrunk", async () => {
        const { engine, root } = mountExpandable(tmpl(), { ui: { open: true } });
        engine.store.state.ui.open = false;
        await nextTick();
        expect(hostOf(root).hasAttribute("data-shrunk")).toBe(false);
        expect(hostOf(root).hasAttribute("data-collapsed")).toBe(true);
    });

    test("非法 fadeSize warn 忽略", () => {
        const warns = catchWarns(() =>
            mountExpandable(tmpl(`x-expandable-options="{fadeSize:'abc'}"`), {
                ui: { open: true },
            }),
        );
        expect(warns.some((w) => w.includes("fadeSize"))).toBe(true);
        expect(hostOf(roots[roots.length - 1] as HTMLElement).hasAttribute("data-fade")).toBe(false);
    });
});

// ── 把手额外偏移（offset）────────────────────────────────────────────────

describe("把手偏移（offset）", () => {
    test("默认不写 --as-offset（回退样式表 0px）", () => {
        mountExpandable(tmpl(), { ui: { open: true } });
        const t = triggerOf(roots[roots.length - 1] as HTMLElement)!;
        expect(t.style.getPropertyValue("--as-offset")).toBe("");
    });

    test("number / CSS 长度串（负值合法）写入 --as-offset", () => {
        mountExpandable(tmpl(`x-expandable-options="{offset: 3}"`), { ui: { open: true } });
        const t1 = triggerOf(roots[roots.length - 1] as HTMLElement)!;
        expect(t1.style.getPropertyValue("--as-offset")).toBe("3px");
        mountExpandable(tmpl(`x-expandable-options="{offset: '-2px'}"`), { ui: { open: true } });
        const t2 = triggerOf(roots[roots.length - 1] as HTMLElement)!;
        expect(t2.style.getPropertyValue("--as-offset")).toBe("-2px");
    });

    test("calc()/var() 表达式原样透传（splitter 注入分隔条宽度补偿的载体）", () => {
        mountExpandable(
            tmpl(`x-expandable-options="{offset: 'calc(var(--w, 4px) / 2)'}"`),
            { ui: { open: true } },
        );
        const t = triggerOf(roots[roots.length - 1] as HTMLElement)!;
        expect(t.style.getPropertyValue("--as-offset")).toBe("calc(var(--w, 4px) / 2)");
    });

    test("非法值 warn 忽略（不写变量）", () => {
        const warns = catchWarns(() =>
            mountExpandable(tmpl(`x-expandable-options="{offset: 'abc'}"`), {
                ui: { open: true },
            }),
        );
        expect(warns.some((w) => w.includes("offset"))).toBe(true);
        const t = triggerOf(roots[roots.length - 1] as HTMLElement)!;
        expect(t.style.getPropertyValue("--as-offset")).toBe("");
    });

    test("两态定位规则消费 offset（展开态跨轴符号：left/right 方向相异、dock 态相反）", () => {
        // 样式表契约锁定：跨轴属性 = calc(-1*half ± offset)，符号逐方向固定
        // （固定轴语义 + = 右/下；展开 right/bottom 与 dock left/top 取 +，其余取 −）
        const css = document.getElementById("autospark-expandable-styles")!.textContent!;
        expect(css).toContain(
            '[data-direction="left"]>.autospark-expandable-trigger{right:calc(-1*var(--as-pos-half) - var(--as-offset,0px));',
        );
        expect(css).toContain(
            '[data-direction="right"]>.autospark-expandable-trigger{left:calc(-1*var(--as-pos-half) + var(--as-offset,0px));',
        );
        expect(css).toContain(
            '[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="left"]{left:calc(-1*var(--as-pos-half) + var(--as-offset,0px));',
        );
        expect(css).toContain(
            '[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="right"]{right:calc(-1*var(--as-pos-half) - var(--as-offset,0px));',
        );
    });
});

// ── 内建单边 resize（ADR-0072）──────────────────────────────────────────

describe("内建单边 resize（ADR-0072）", () => {
    /** 模拟手柄指针拖拽（e 方向：向右 dx） */
    const dragHandle = (h: Element, dx: number) => {
        h.dispatchEvent(
            new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100, button: 0 }),
        );
        h.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 100 + dx, clientY: 100 }));
        h.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    };

    test("同元素 x-resize 互斥：x-resize warn + 自失效（单手柄），expandable 正常", async () => {
        const warns = catchWarns(() =>
            mountExpandable(tmpl(`x-resize x-expandable-options="{resize: true}"`), {
                ui: { open: true },
            }),
        );
        await nextTick();
        expect(warns.some((w) => w.includes("同元素存在 x-expandable"))).toBe(true);
        const host = hostOf(roots[roots.length - 1] as HTMLElement);
        // x-resize 失效（其三手柄 e/s/se 不存在），仅剩 expandable 的单边手柄
        expect(host.querySelectorAll("[data-autospark-resize-handle]").length).toBe(1);
        expect(triggerOf(roots[roots.length - 1] as HTMLElement)).not.toBeNull();
    });

    test(".resize 修饰符启用：单边手柄（direction left → e）拖拽调宽", async () => {
        // 修饰符与值同属一个属性（x-expandable.resize="ui.open"——同名第二声明会被
        // singleton 去重覆盖，分离书写非法）
        mountExpandable(
            `<div id="app"><div id="box" style="display:flex;width:600px;height:400px">` +
                `<div id="host" x-expandable.resize="ui.open" style="width:200px"><span>侧栏内容</span></div>` +
                `<div id="main">主区</div></div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        const host = hostOf(roots[roots.length - 1] as HTMLElement);
        const e = host.querySelector<HTMLElement>('[data-autospark-resize-handle="e"]')!;
        expect(e).not.toBeNull();
        expect(host.querySelector('[data-autospark-resize-handle="s"]')).toBeNull(); // 单边
        dragHandle(e, 50);
        expect(host.style.width).toBe("250px"); // inline 200 + 50
    });

    test("resize 接管展开尺寸真相（Q4=A）：收缩折叠再展开恢复拖出宽度", async () => {
        mountExpandable(tmpl(`x-expandable-options="{resize: true, minSize: 80}"`), {
            ui: { open: true },
        });
        await nextTick();
        const host = hostOf(roots[roots.length - 1] as HTMLElement);
        const t = triggerOf(roots[roots.length - 1] as HTMLElement)!;
        const e = host.querySelector<HTMLElement>('[data-autospark-resize-handle="e"]')!;
        dragHandle(e, 50);
        expect(host.style.width).toBe("250px");
        // 收缩折叠（width=80）→ 展开：恢复拖出宽度 250（maxDecl 被 resize 接管）
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(host.style.width).toBe("80px");
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(host.style.width).toBe("250px");
    });

    test("enable 退化矩阵：enable:false + resize → 无把手有手柄；双关 warn 不作为", () => {
        mountExpandable(tmpl(`x-expandable-options="{enable: false, resize: true}"`), {
            ui: { open: true },
        });
        let root = roots[roots.length - 1] as HTMLElement;
        expect(triggerOf(root)).toBeNull(); // 折叠功能关：无把手
        expect(root.querySelector("#host")!.querySelector("[data-autospark-resize-handle]")).not.toBeNull();
        const warns = catchWarns(() =>
            mountExpandable(tmpl(`x-expandable-options="{enable: false}"`), { ui: { open: true } }),
        );
        root = roots[roots.length - 1] as HTMLElement;
        expect(warns.some((w) => w.includes("均未启用"))).toBe(true);
        expect(triggerOf(root)).toBeNull();
        expect(root.querySelector("#host")!.querySelector("[data-autospark-resize-handle]")).toBeNull();
    });

    test("resize 对象形态：handles/aspectRatio 子键 warn 忽略；minWidth 约束生效", async () => {
        const warns = catchWarns(() =>
            mountExpandable(
                tmpl(`x-expandable-options="{resize: {handles: 'e,w', aspectRatio: 2, minWidth: 240}}"`),
                { ui: { open: true } },
            ),
        );
        await nextTick();
        expect(warns.some((w) => w.includes("handles/aspectRatio"))).toBe(true);
        const host = hostOf(roots[roots.length - 1] as HTMLElement);
        const e = host.querySelector<HTMLElement>('[data-autospark-resize-handle="e"]')!;
        dragHandle(e, -100);
        expect(host.style.width).toBe("240px"); // minWidth 钳制（200-100 → 240 下限）
    });
});
