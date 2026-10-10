import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * x-block 布局条测试（ADR-0098）。
 *
 * 覆盖面：结构契约（三段分区 / 乱序语义序 / body 缺失静默 / 分区缺失跳过 / 重复首胜 warn /
 * 未标记 warn 丢弃 / template-script 容忍 / 非法参数与孤儿 warn）、选项（gap / padding /
 * align 三值 / 非法 warn / overflow:false）、响应式换轴、溢出折叠（渐进链 footer→header /
 * body 永不收 / 反向展开 / 终态无动作 / 事件 detail / 收缩类与按钮注入 / stash 常驻）、
 * 弹出面板（hover 打开 stash 入面板 / overlay:close 抢救 / 面板内豁免）。
 *
 * 约定：happy-dom 无布局——布局契约断言 inline style 与契约属性；溢出链经
 * Object.defineProperty 覆写宿主 scroll/client 尺寸 + window resize 事件驱动（RO 在
 * happy-dom 不触发，resize 是测试通道——x-drawer defineProperty 先例）。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];
const mountBlock = (html: string, state: any = {}, options?: any) => {
    const m = mount(html, state, options);
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

const partsOf = (host: Element) =>
    [...host.querySelectorAll("[data-block-part]")] as HTMLElement[];

const partOf = (root: HTMLElement, id: string) =>
    root.querySelector(`#${id}`)! as HTMLElement;

/**
 * 分区溢出覆写（分区级判据，ADR-0098 决策四修订）：scroll 固定值 + client 动态 getter——
 * getter 内可按当前 DOM 状态（如收缩段数）返回不同值，模拟「收缩后空间释放」的临界布局。
 */
const overflowOf = (
    el: HTMLElement,
    scroll: number,
    client: number | (() => number),
    axis: "w" | "h" = "w",
) => {
    const s = axis === "w" ? "scrollWidth" : "scrollHeight";
    const c = axis === "w" ? "clientWidth" : "clientHeight";
    Object.defineProperty(el, s, { configurable: true, value: scroll });
    Object.defineProperty(el, c, {
        configurable: true,
        get: () => (typeof client === "function" ? client() : client),
    });
};
/** 测试驱动通道：resize 事件（x-block 的 window resize 兜底监听） */
const evaluate = () => window.dispatchEvent(new Event("resize"));

const ROW_TMPL = `<div id="app"><div x-scope>
    <div id="host" x-block="row">
        <div id="ft" x-block:footer>F</div>
        <div id="hd" x-block:header>H</div>
        <div id="bd" x-block:body>B</div>
    </div>
</div></div>`;

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    while (roots.length) roots.pop()?.remove();
});

// ── 结构契约 ──────────────────────────────────────────────────────────

describe("结构契约", () => {
    test("三段分区：乱序书写按语义序渲染（header→body→footer），标记属性剥除", () => {
        const { root } = mountBlock(ROW_TMPL, {});
        const host = root.querySelector("#host")!;
        expect(host.classList.contains("autospark-block")).toBe(true);
        expect(host.dataset.direction).toBe("row");
        const parts = partsOf(host);
        expect(parts.map((p) => p.id)).toEqual(["hd", "bd", "ft"]);
        expect(parts[0]!.getAttribute("data-block-part")).toBe("header");
        expect(parts[1]!.getAttribute("data-block-part")).toBe("body");
        expect(parts[2]!.getAttribute("data-block-part")).toBe("footer");
        expect(root.querySelector("[x-block\\:header]")).toBeNull();
    });

    test("body 缺失：不 warn、静默空渲染（header/footer 照常）", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row">
                    <div id="hd" x-block:header>H</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns).toEqual([]);
        expect(partsOf(m.root.querySelector("#host")!).map((p: any) => p.id)).toEqual(["hd"]);
    });

    test("分区全缺失：空容器，零 warn", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row"></div></div></div>`,
                {},
            );
        });
        expect(warns).toEqual([]);
        expect(partsOf(m.root.querySelector("#host")!).length).toBe(0);
    });

    test("重复分区：首个生效 + warn", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row">
                    <div id="ft1" x-block:footer>F1</div>
                    <div id="ft2" x-block:footer>F2</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("重复分区"))).toBe(true);
        expect(partsOf(m.root.querySelector("#host")!).map((p: any) => p.id)).toEqual(["ft1"]);
    });

    test("未标记渲染子元素：warn + 丢弃；template/script 静默容忍", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row">
                    <template><span>tpl</span></template>
                    <script type="text/javascript"></script>
                    <div id="stray">stray</div>
                    <div id="bd" x-block:body>B</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("未标记的子元素"))).toBe(true);
        const host = m.root.querySelector("#host")!;
        expect(host.querySelector("#stray")).toBeNull();
        expect(host.querySelector("#bd")).not.toBeNull();
    });

    test("非法参数（x-block:aside）：warn + 元素照常编译（无分区契约）", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row">
                    <div id="aside" x-block:aside>A</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("未知分区参数"))).toBe(true);
        const el = m.root.querySelector("#aside")!;
        expect(el.getAttribute("data-block-part")).toBeNull();
    });

    test("孤儿分区标记（无 x-block 容器祖先）：warn + 子树照常编译", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="lone" x-block:header>H</div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("仅可作为 x-block 容器的直接子元素"))).toBe(true);
        expect(m.root.querySelector("#lone")!.textContent).toBe("H");
    });
});

// ── 选项（编译期静态）────────────────────────────────────────────────

describe("选项", () => {
    test("gap / padding：number 按 px、字符串原样", () => {
        const { root } = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="row" x-block-options="{gap:8,padding:'1rem'}">
                <div x-block:body>B</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        expect(host.style.gap).toBe("8px");
        expect(host.style.padding).toBe("1rem");
    });

    test("align 三值映射 body 主轴（CSS 变量）；非法值 warn + 忽略", () => {
        const { root } = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="row" x-block-options="{align:'center'}">
                <div x-block:body>B</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        expect(host.style.getPropertyValue("--autospark-block-align")).toBe("center");

        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row" x-block-options="{align:'left'}">
                    <div x-block:body>B</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("align 须为 start|center|end"))).toBe(true);
        expect(
            (m.root.querySelector("#host") as HTMLElement).style.getPropertyValue(
                "--autospark-block-align",
            ),
        ).toBe("");
    });

    test("gap 非法值：warn + 忽略", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row" x-block-options="{gap:-4}">
                    <div x-block:body>B</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("gap 须为非负数字"))).toBe(true);
        expect((m.root.querySelector("#host") as HTMLElement).style.gap).toBe("");
    });

    test("bodyMinSize：默认 120px 写入 CSS 变量；自定义值生效；非法值 warn 回退默认", () => {
        // 默认：120px 写入变量（CSS 按 data-direction 分支取宽/高）
        const { root } = mountBlock(ROW_TMPL, {});
        expect(
            (root.querySelector("#host")! as HTMLElement).style.getPropertyValue(
                "--autospark-block-body-min",
            ),
        ).toBe("120px");

        // 自定义：number 按 px / 字符串原样
        const m2 = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="row" x-block-options="{bodyMinSize:200}">
                <div x-block:body>B</div>
            </div></div></div>`,
            {},
        );
        document.body.appendChild(m2.root);
        engines.push(m2.engine);
        expect(
            (m2.root.querySelector("#host")! as HTMLElement).style.getPropertyValue(
                "--autospark-block-body-min",
            ),
        ).toBe("200px");

        // 非法值：warn + 回退默认
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row" x-block-options="{bodyMinSize:'wide'}">
                    <div x-block:body>B</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("bodyMinSize 须为非负数字"))).toBe(true);
        expect(
            (m.root.querySelector("#host")! as HTMLElement).style.getPropertyValue(
                "--autospark-block-body-min",
            ),
        ).toBe("120px");
    });
});

// ── 响应式换轴 ───────────────────────────────────────────────────────

describe("响应式换轴", () => {
    test("状态驱动 row→column：data-direction 随值翻转", async () => {
        const { root, engine } = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="dir">
                <div x-block:body>B</div>
            </div></div></div>`,
            { dir: "row" },
        );
        const host = root.querySelector("#host")!;
        expect(host.dataset.direction).toBe("row");
        engine.state.dir = "column";
        await nextTick();
        expect(host.dataset.direction).toBe("column");
        engine.state.dir = "row";
        await nextTick();
        expect(host.dataset.direction).toBe("row");
    });

    test("非法值静默归一 row（x-splitter 先例）", () => {
        const { root } = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="'diagonal'">
                <div x-block:body>B</div>
            </div></div></div>`,
            {},
        );
        expect(root.querySelector("#host")!.dataset.direction).toBe("row");
    });
});

// ── 溢出折叠（分区级判据，ADR-0098 决策四修订）──────────────────────

describe("溢出折叠", () => {
    test("footer 被压溢出先收：整个分区搬离文档、原位占位壳承载按钮、事件派发", () => {
        const { root } = mountBlock(ROW_TMPL, {});
        const host = root.querySelector("#host")! as HTMLElement;
        const events: any[] = [];
        host.addEventListener("block:collapse", (e: any) => events.push(e.detail));
        const ft = partOf(root, "ft"); // 分区元素引用（收缩后脱离文档）

        overflowOf(ft, 600, 400);
        evaluate();

        // 整个分区元素搬离文档（用户样式在面板内原样生效），DOM 态完整保留
        expect(ft.isConnected).toBe(false);
        expect(ft.classList.contains("x-block-collapsed")).toBe(true);
        expect(ft.textContent).toBe("F");
        // 原位占位壳：同契约属性 + 收缩类 + 触发按钮
        const placeholder = host.querySelector(
            '[data-block-part="footer"].x-block-collapsed',
        )!;
        expect(placeholder).not.toBeNull();
        expect(placeholder.querySelector("button.autospark-block-trigger")).not.toBeNull();
        expect(events).toEqual([{ part: "footer" }]);
        // body 与 header 未动
        expect(root.querySelector("#bd")!.textContent).toBe("B");
        expect(root.querySelector("#hd")!.textContent).toBe("H");
    });

    test("header 也溢出再收 header（渐进链），body 永不收", () => {
        const { root } = mountBlock(ROW_TMPL, {});
        const host = root.querySelector("#host")! as HTMLElement;

        overflowOf(partOf(root, "ft"), 600, 400);
        overflowOf(partOf(root, "hd"), 500, 300);
        evaluate();

        const collapsed = [...host.querySelectorAll(".x-block-collapsed")].map((el) =>
            el.getAttribute("data-block-part"),
        );
        // 集合相等即可（querySelectorAll 是文档序 header 在前，收缩先后不经 DOM 序表达）
        expect(collapsed.sort()).toEqual(["footer", "header"]);
        expect(root.querySelector("#bd")!.classList.contains("x-block-collapsed")).toBe(false);
        expect(root.querySelector("#bd")!.textContent).toBe("B");
    });

    test("body 溢出不触发收缩（永不收，交容器裁切）", () => {
        const { root } = mountBlock(ROW_TMPL, {});
        overflowOf(partOf(root, "bd"), 600, 100);
        evaluate();
        expect(root.querySelectorAll(".x-block-collapsed").length).toBe(0);
    });

    test("溢出解除反向展开：header 先回、再 footer，分区元素原位还原", async () => {
        const { root } = mountBlock(ROW_TMPL, {});
        const host = root.querySelector("#host")! as HTMLElement;
        const events: any[] = [];
        host.addEventListener("block:expand", (e: any) => events.push(e.detail));
        const ft = partOf(root, "ft");
        const hd = partOf(root, "hd");

        overflowOf(ft, 600, 400);
        overflowOf(hd, 500, 300);
        evaluate();
        // 空间恢复：两分区压缩量解除（覆写改为不溢出读数）
        overflowOf(ft, 300, 400);
        overflowOf(hd, 200, 300);
        evaluate();

        // 展开一步后自身不再溢出 → 两段依次全回（分区元素原位替换占位壳）
        expect(events.map((e) => e.part)).toEqual(["header", "footer"]);
        expect(ft.isConnected).toBe(true);
        expect(ft.textContent).toBe("F");
        expect(hd.textContent).toBe("H");
        expect(ft.classList.contains("x-block-collapsed")).toBe(false);
        expect(host.querySelector('[data-block-part="footer"].x-block-collapsed')).toBeNull();
        // 按钮搬回分区内（编译期形态）
        expect(ft.querySelector("button.autospark-block-trigger")).not.toBeNull();

        // 回归：展开时 dispatch 的 mouseleave 会在 delayHide(150) 后触发面板关闭善后——
        // 抢救遍历只摘 _stash 内分区，已展开分区不得被二次摘出文档（回归 bug）
        await new Promise((r) => setTimeout(r, 250));
        expect(ft.isConnected).toBe(true);
        expect(hd.isConnected).toBe(true);
    });

    test("试展后自身仍溢出：静默回滚（事件序无 expand 失衡）", () => {
        const { root } = mountBlock(ROW_TMPL, {});
        const host = root.querySelector("#host")! as HTMLElement;
        const events: any[] = [];
        host.addEventListener("block:collapse", (e: any) => events.push({ t: "c", ...e.detail }));
        host.addEventListener("block:expand", (e: any) => events.push({ t: "e", ...e.detail }));
        const ft = partOf(root, "ft");

        overflowOf(ft, 600, 400); // footer 恒溢出（覆写不随收缩变化）
        evaluate();
        // 收缩链：收 footer（已收不再判）；无 header 溢出 → 停在 footer
        expect(events).toEqual([{ t: "c", part: "footer" }]);

        evaluate(); // 展开循环：试展 footer → 自身仍溢出 → 回滚（静默，零事件）
        expect(ft.classList.contains("x-block-collapsed")).toBe(true);
        expect(ft.isConnected).toBe(false);
        expect(events).toEqual([{ t: "c", part: "footer" }]);
    });

    test("column 轴：分区 scrollHeight 溢出驱动同款渐进链", () => {
        const { root } = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="'column'">
                <div id="ft" x-block:footer>F</div>
                <div id="bd" x-block:body>B</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        expect(host.dataset.direction).toBe("column");
        overflowOf(partOf(root, "ft"), 600, 400, "h");
        evaluate();
        expect(host.querySelector('[data-block-part="footer"].x-block-collapsed')).not.toBeNull();
    });

    test("无溢出：零动作", () => {
        const { root } = mountBlock(ROW_TMPL, {});
        overflowOf(partOf(root, "ft"), 300, 400);
        evaluate();
        expect(root.querySelectorAll(".x-block-collapsed").length).toBe(0);
    });

    test("overflow:false：整体禁用（溢出也不收缩）", () => {
        const { root } = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="row" x-block-options="{overflow:false}">
                <div id="ft" x-block:footer>F</div>
                <div id="bd" x-block:body>B</div>
            </div></div></div>`,
            {},
        );
        overflowOf(partOf(root, "ft"), 600, 100);
        evaluate();
        expect(root.querySelectorAll(".x-block-collapsed").length).toBe(0);
    });

    test("分区缺失时渐进链跳过（无 footer 则直接收 header）", () => {
        const { root } = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="row">
                <div id="hd" x-block:header>H</div>
                <div id="bd" x-block:body>B</div>
            </div></div></div>`,
            {},
        );
        overflowOf(partOf(root, "hd"), 600, 400);
        evaluate();
        expect(root.querySelector('[data-block-part="header"].x-block-collapsed')).not.toBeNull();
    });
});

// ── 弹出面板（x-popover 指令接管开关；delayShow/delayHide 经 x-block-options 透传）──

/** 面板测试模板：delayShow=0 加速打开（delayHide 走默认 150ms 宽限） */
const PANEL_TMPL = `<div id="app"><div x-scope>
    <div id="host" x-block="row" x-block-options="{delayShow:0}">
        <div id="ft" x-block:footer>F</div>
        <div id="hd" x-block:header>H</div>
        <div id="bd" x-block:body>B</div>
    </div>
</div></div>`;

describe("弹出面板", () => {
    test("hover 按钮：x-popover 开面板、整个分区入面板；关闭后抢救回（脱离文档但 DOM 态完整）", async () => {
        const { root } = mountBlock(PANEL_TMPL, {});
        const ft = partOf(root, "ft");
        overflowOf(ft, 600, 400);
        evaluate();
        // 按钮在占位壳内（编译期声明 x-popover，PopoverDirective 接管开关）
        const btn = root.querySelector(
            '[data-block-part="footer"].x-block-collapsed > button.autospark-block-trigger',
        ) as HTMLElement;
        expect(btn).not.toBeNull();

        btn.dispatchEvent(new MouseEvent("mouseenter"));
        // 整个分区元素挂入面板（用户样式原样生效）
        const panel = document.querySelector("[data-overlay]") as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.contains(ft)).toBe(true);
        expect(ft.textContent).toBe("F");

        // hover 离开 → delayHide 宽限关闭 → overlay:close 抢救：分区脱离文档但完整
        btn.dispatchEvent(new MouseEvent("mouseleave"));
        await new Promise((r) => setTimeout(r, 250)); // delayHide(150) + leave 动画余量
        expect(ft.isConnected).toBe(false);
        // 分区仍被指令持有（Map），内容未销毁——再次打开原样入面板
        btn.dispatchEvent(new MouseEvent("mouseenter"));
        const panel2 = document.querySelector("[data-overlay]") as HTMLElement;
        expect(panel2).not.toBeNull();
        expect(panel2.contains(ft)).toBe(true);
        expect(ft.textContent).toBe("F");
    });

    test("面板内悬停：宽限期内豁免不关闭（PopoverDirective 共享 hover 域）", async () => {
        const { root } = mountBlock(PANEL_TMPL, {});
        const ft = partOf(root, "ft");
        overflowOf(ft, 600, 400);
        evaluate();
        const btn = root.querySelector(
            '[data-block-part="footer"].x-block-collapsed > button.autospark-block-trigger',
        ) as HTMLElement;

        btn.dispatchEvent(new MouseEvent("mouseenter"));
        const panel = document.querySelector("[data-overlay]") as HTMLElement;
        btn.dispatchEvent(new MouseEvent("mouseleave")); // 离开按钮（宽限开始）
        panel.dispatchEvent(new MouseEvent("mouseenter")); // 进入面板（域内豁免）
        await new Promise((r) => setTimeout(r, 250));
        // 面板仍开着（分区在面板内）
        expect(panel.contains(ft)).toBe(true);
    });

    test("键盘通道：Enter 打开、再 Enter 关闭（模拟 mouseenter/mouseleave）", async () => {
        const { root } = mountBlock(PANEL_TMPL, {});
        const ft = partOf(root, "ft");
        overflowOf(ft, 600, 400);
        evaluate();
        const btn = root.querySelector(
            '[data-block-part="footer"].x-block-collapsed > button.autospark-block-trigger',
        ) as HTMLButtonElement;

        btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(document.querySelector("[data-overlay]")!.contains(ft)).toBe(true);
        btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await new Promise((r) => setTimeout(r, 250));
        expect(ft.isConnected).toBe(false);
    });

    test("方位配置：显式 placement 用户权威（不随轴翻转），非法值 warn 回退推导", () => {
        // 结果 DOM 的 x-popover-options 已被编译器剥除（指令属性），断言经 popover 指令实例的 options
        const placementOf = (engine: any, btn: HTMLElement): string => {
            const scope = engine.findScopeByEl(btn);
            const inst = scope!.directives.find((d: any) => d.info.name === "popover");
            return inst.options.at.placement;
        };

        const { root, engine } = mountBlock(
            `<div id="app"><div x-scope>
                <div id="host" x-block="row" x-block-options="{headerPlacement:'top-start',footerPlacement:'left-end'}">
                    <div id="ft" x-block:footer>F</div>
                    <div id="hd" x-block:header>H</div>
                    <div id="bd" x-block:body>B</div>
                </div>
            </div></div>`,
            {},
        );
        // 显式配置 = 用户权威（不随轴翻转）
        expect(placementOf(engine, root.querySelector("#hd button")!)).toBe("top-start");
        expect(placementOf(engine, root.querySelector("#ft button")!)).toBe("left-end");

        // 未配置：按轴推导默认（row 轴 bottom-start / bottom-end）
        const m2 = mountBlock(ROW_TMPL, {});
        document.body.appendChild(m2.root);
        engines.push(m2.engine);
        expect(placementOf(m2.engine, m2.root.querySelector("#hd button")!)).toBe("bottom-start");
        expect(placementOf(m2.engine, m2.root.querySelector("#ft button")!)).toBe("bottom-end");

        // 非法值：warn + 回退推导默认
        let m: any;
        const warns = catchWarns(() => {
            m = mountBlock(
                `<div id="app"><div x-scope><div id="host" x-block="row" x-block-options="{headerPlacement:'up'}">
                    <div id="hd" x-block:header>H</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("headerPlacement 须为 floating-ui 方位值"))).toBe(true);
        expect(placementOf(m.engine, m.root.querySelector("#hd button")!)).toBe("bottom-start");
    });
});

// ── 嵌套与正交性 ─────────────────────────────────────────────────────

describe("嵌套与正交性", () => {
    test("嵌套 x-block：内外各自独立渲染", () => {
        const { root } = mountBlock(
            `<div id="app"><div x-scope><div id="outer" x-block="row">
                <div id="inner" x-block:body>
                    <div x-block="column"><div x-block:header>N</div><div x-block:body>NB</div></div>
                </div>
            </div></div></div>`,
            {},
        );
        const outer = root.querySelector("#outer")!;
        expect(outer.classList.contains("autospark-block")).toBe(true);
        const inner = root.querySelector("#inner")!;
        expect(inner.classList.contains("x-block-collapsed")).toBe(false);
        expect(inner.querySelector(".autospark-block")).not.toBeNull();
    });

    test("分区子树照常编译：x-text 等指令正常工作", async () => {
        const { root, engine } = mountBlock(
            `<div id="app"><div x-scope><div id="host" x-block="row">
                <div id="bd" x-block:body><span x-text="msg"></span></div>
            </div></div></div>`,
            { msg: "hello" },
        );
        expect(root.querySelector("#bd")!.textContent).toBe("hello");
        engine.state.msg = "world";
        await nextTick();
        expect(root.querySelector("#bd")!.textContent).toBe("world");
    });

    test("ownsChildren：宿主区域为 patch 动态区域（落入即拒绝）", () => {
        const { root, engine } = mountBlock(ROW_TMPL, {});
        const host = root.querySelector("#host")!;
        expect(() => engine.patch(host, () => {})).toThrow();
    });
});
