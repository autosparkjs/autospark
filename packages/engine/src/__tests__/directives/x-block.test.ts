import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount } from "../helpers";
import type { AutoSpark } from "../../engine/engine";

/**
 * x-block 溢出折叠容器（ADR-0098 重写版）。
 *
 * happy-dom 无布局——布局契约断言内联样式与契约属性；溢出链经 Object.defineProperty
 * 覆写宿主 scroll/client 尺寸驱动（scroll 侧用动态 getter 按「宿主现存 [data-w] 子元素」
 * 求和——折叠使元素出文档，scroll 自然收敛，模拟真实布局；client 侧为可变分配宽），
 * window resize 是重估驱动通道（RO 在 happy-dom 不触发——x-drawer 先例）。
 * `x-popover` 属性编译后被剥除（Compile 通道），popover 断言走指令实例 options。
 * 断言面纪律：重型对象一律 toBeTruthy/toBeNull/标量投影（2026-10-09 OOM 事故定约）。
 */

/** 替换 console.warn 收集消息（engine 默认 logger 透传 console） */
function catchWarns(): { warns: string[]; restore: () => void } {
    const warns: string[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => {
        warns.push(args.map(String).join(" "));
    };
    return { warns, restore: () => (console.warn = original) };
}

interface BlockMount {
    root: HTMLElement;
    engine: AutoSpark<any>;
    host: HTMLElement;
    trigger: HTMLButtonElement;
    /** 触发按钮上的 popover 指令实例（x-popover 属性已剥除，断言面在实例 options） */
    popover: any;
}

/** 挂载 x-block 并覆写主轴尺寸模拟（axis "w"=宽 / "h"=高；初始分配尺寸默认充分不溢出） */
function mountBlock(
    html: string,
    state: any = {},
    axis: "w" | "h" = "w",
    options?: Parameters<typeof mount>[2],
): BlockMount {
    const { root, engine } = mount(html, state, options);
    document.body.appendChild(root);
    const host = root.querySelector("[x-block]") as HTMLElement;
    const trigger = Array.from(host.children).find((c) =>
        c.classList.contains("autospark-block-trigger"),
    ) as HTMLButtonElement;
    // scroll 侧动态求和：宿主直下可见 [data-w] 子元素的 data-w 值（折叠出文档自动收敛）
    const scrollKey = axis === "h" ? "scrollHeight" : "scrollWidth";
    const clientKey = axis === "h" ? "clientHeight" : "clientWidth";
    Object.defineProperty(host, scrollKey, {
        configurable: true,
        get: () =>
            Array.from(host.children)
                .filter(
                    (n) =>
                        n instanceof HTMLElement &&
                        (n as HTMLElement).dataset.w !== undefined &&
                        (n as HTMLElement).style.display !== "none",
                )
                .reduce((s, n) => s + Number((n as HTMLElement).dataset.w), 0),
    });
    Object.defineProperty(host, clientKey, {
        configurable: true,
        get: () => (host as any)._clientSize ?? Number.MAX_SAFE_INTEGER,
    });
    const scope = engine.findScopeByEl(trigger)!;
    const popover = scope.directives.find((d) => d.info.name === "popover");
    return { root, engine, host, trigger, popover };
}

/** 设置模拟分配尺寸 + window resize 驱动重估 */
function fit(host: HTMLElement, size: number): void {
    (host as any)._clientSize = size;
    window.dispatchEvent(new Event("resize"));
}

const spawned: AutoSpark[] = [];
afterEach(() => {
    for (const e of spawned.splice(0)) {
        try {
            e.destroy();
        } catch {
            // 幂等销毁吞错
        }
    }
});

/** 三按钮工具栏（各 100 宽） */
const ROW_TMPL = `
<div x-block="row" class="toolbar" style="width:250px">
    <button data-w="100" id="a">A</button>
    <button data-w="100" id="b">B</button>
    <button data-w="100" id="c">C</button>
</div>
`;

describe("x-block 溢出折叠容器（ADR-0098 重写版）", () => {
    describe("结构契约", () => {
        test("宿主契约类 + 方向标记 + 触发按钮预置（popover 通道装配）", () => {
            const m = mountBlock(ROW_TMPL);
            spawned.push(m.engine);
            expect(m.host.classList.contains("autospark-block")).toBe(true);
            expect(m.host.dataset.direction).toBe("row");
            expect(m.trigger).toBeTruthy();
            expect(m.trigger.getAttribute("aria-label")).toBe("更多");
            expect(m.trigger.getAttribute("aria-haspopup")).toBe("true");
            // x-popover 属性已剥除（Compile 通道）——断言指令实例与 options 装配
            expect(m.popover).toBeTruthy();
            expect(m.popover.options.at.placement).toBe("bottom-end");
            expect(String(m.popover.options.shell)).toMatch(/^autospark-block-shell-\d+$/);
            // 初始不溢出：按钮无内联显示（全局 CSS display:none 承担隐藏）
            expect(m.trigger.style.display).toBe("");
            // 子元素照常编译（无 ownsChildren）
            expect(m.host.querySelectorAll("button").length).toBe(4); // 3 子元素 + 触发按钮
        });

        test("column 字面量轴", () => {
            const m = mountBlock(`<div x-block="column"><i data-w="10"></i></div>`);
            spawned.push(m.engine);
            expect(m.host.dataset.direction).toBe("column");
            expect(m.popover.options.at.placement).toBe("right-end");
        });

        test("响应式换轴：表达式驱动 + 触发按钮方位热更 + 折叠态复位", async () => {
            const m = mountBlock(
                `<div x-block="dir" style="width:250px">
                    <button data-w="100" id="a">A</button>
                    <button data-w="100" id="b">B</button>
                </div>`,
                { dir: "row" },
            );
            spawned.push(m.engine);
            fit(m.host, 100); // 折 B
            expect(document.getElementById("b")!.parentNode).toBeNull();
            m.engine.state.dir = "column";
            await new Promise<void>((r) => setTimeout(r, 0));
            expect(m.host.dataset.direction).toBe("column");
            // 换轴复位：全部按原位锚还原
            expect(document.getElementById("b")!.parentNode).toBe(m.host);
            expect(m.trigger.style.display).toBe("");
            expect(m.popover.options.at.placement).toBe("right-end");
        });
    });

    describe("伸缩契约（data-grow / data-shrink）", () => {
        test("直通内联样式：缺省 1 / 显式数值 / 显式 0", () => {
            const m = mountBlock(
                `<div x-block="row">
                    <i id="g" data-grow></i>
                    <i id="g2" data-grow="2.5"></i>
                    <i id="s" data-shrink></i>
                    <i id="z" data-grow="0" data-shrink="0"></i>
                </div>`,
            );
            spawned.push(m.engine);
            const host = m.host;
            expect(host.querySelector("#g")!.style.flexGrow).toBe("1");
            expect(host.querySelector("#g2")!.style.flexGrow).toBe("2.5");
            expect(host.querySelector("#s")!.style.flexShrink).toBe("1");
            expect(host.querySelector("#z")!.style.flexGrow).toBe("0");
            expect(host.querySelector("#z")!.style.flexShrink).toBe("0");
            // 无声明者不写内联（CSS 默认 grow:0/shrink:0 承担）
            expect(host.querySelector("#g")!.style.flexShrink).toBe("");
        });

        test("非法值 warn 一次 + 回退 1", () => {
            const { warns, restore } = catchWarns();
            try {
                const m = mountBlock(`<div x-block="row"><i id="x" data-grow="abc"></i></div>`);
                spawned.push(m.engine);
                expect(m.host.querySelector("#x")!.style.flexGrow).toBe("1");
                expect(warns.filter((w) => w.includes("data-grow")).length).toBe(1);
                // 重估通道复入不重复 warn
                fit(m.host, 100);
                expect(warns.filter((w) => w.includes("data-grow")).length).toBe(1);
            } finally {
                restore();
            }
        });
    });

    describe("溢出折叠（步进收敛）", () => {
        test("初始不溢出：无折叠、按钮隐藏", () => {
            const m = mountBlock(ROW_TMPL);
            spawned.push(m.engine);
            fit(m.host, 500);
            expect(document.getElementById("a")!.parentNode).toBe(m.host);
            expect(m.trigger.style.display).toBe("");
        });

        test("溢出折叠末尾子元素：出文档 + 按钮显示 + min 尺寸写入", () => {
            const m = mountBlock(ROW_TMPL);
            spawned.push(m.engine);
            fit(m.host, 250);
            const c = document.getElementById("c")!;
            expect(c.parentNode).toBeNull(); // 真实搬移出文档
            expect(m.trigger.style.display).toBe("inline-flex");
            expect(m.host.style.minWidth).toBe("0px"); // happy-dom offsetWidth=0，写入通道生效
        });

        test("恰好收敛（防多折）：250 分配只折 1 个", () => {
            const m = mountBlock(ROW_TMPL);
            spawned.push(m.engine);
            fit(m.host, 250);
            expect(document.getElementById("b")!.parentNode).toBe(m.host);
            expect(document.getElementById("a")!.parentNode).toBe(m.host);
        });

        test("渐进折叠：分配持续收窄逐个折叠", () => {
            const m = mountBlock(ROW_TMPL);
            spawned.push(m.engine);
            fit(m.host, 250);
            fit(m.host, 150);
            expect(document.getElementById("b")!.parentNode).toBeNull();
            expect(document.getElementById("a")!.parentNode).toBe(m.host);
            fit(m.host, 50);
            expect(document.getElementById("a")!.parentNode).toBeNull();
        });

        test("变宽渐进恢复：LIFO 前缀保留 + 全恢复后按钮隐藏", () => {
            const m = mountBlock(ROW_TMPL);
            spawned.push(m.engine);
            fit(m.host, 50); // 全折（栈：C→B→A）
            expect(document.getElementById("a")!.parentNode).toBeNull();
            fit(m.host, 250); // LIFO 恢复 A、B（C 放不下：200+100>250）——前缀保留语义
            expect(document.getElementById("a")!.parentNode).toBe(m.host);
            expect(document.getElementById("b")!.parentNode).toBe(m.host);
            expect(document.getElementById("c")!.parentNode).toBeNull();
            fit(m.host, 600); // 全恢复
            expect(document.getElementById("c")!.parentNode).toBe(m.host);
            expect(m.trigger.style.display).toBe("");
        });

        test("隐藏子元素不参与折叠（display:none 跳过）", () => {
            const m = mountBlock(
                `<div x-block="row" style="width:250px">
                    <button data-w="100" id="a">A</button>
                    <button data-w="100" id="h" style="display:none">H</button>
                    <button data-w="100" id="c">C</button>
                </div>`,
            );
            spawned.push(m.engine);
            fit(m.host, 250);
            const h = document.getElementById("h")!;
            expect(h.parentNode).toBe(m.host); // 隐藏者永不折叠
            expect(document.getElementById("c")!.parentNode).toBeNull();
        });

        test("栈中隐藏者跳过恢复，恢复可见后自然回位", () => {
            const m = mountBlock(ROW_TMPL);
            spawned.push(m.engine);
            fit(m.host, 250); // 折 C
            const c = document.getElementById("c")!;
            c.style.display = "none"; // 折叠期间被隐藏（x-show 场景）
            fit(m.host, 600); // 富余充分，但栈顶不可见——跳过
            expect(c.parentNode).toBeNull();
            c.style.display = "";
            fit(m.host, 600); // 恢复可见 → 回位
            expect(c.parentNode).toBe(m.host);
            expect(m.trigger.style.display).toBe("");
        });

        test("column 轴对称折叠（scrollHeight/clientHeight + min-height）", () => {
            const m = mountBlock(
                `<div x-block="column">
                    <button data-w="100" id="a">A</button>
                    <button data-w="100" id="b">B</button>
                </div>`,
                {},
                "h",
            );
            spawned.push(m.engine);
            fit(m.host, 150);
            expect(document.getElementById("b")!.parentNode).toBeNull();
            expect(m.trigger.style.display).toBe("inline-flex");
            expect(m.host.style.minHeight).toBe("0px");
            expect(m.host.style.minWidth).toBe("");
        });

        test("destroy 后重估通道静默（不抛错、无折叠动作）", () => {
            const m = mountBlock(ROW_TMPL);
            const { engine, host } = m;
            spawned.push(engine);
            engine.destroy();
            expect(() => fit(host, 10)).not.toThrow();
            expect(host.querySelectorAll("button").length).toBe(4); // DOM 不被指令销毁清理
        });
    });

    describe("面板（宿主克隆壳 + overlay 中继）", () => {
        test("克隆壳组件：注册进宿主 scope + 指令痕迹清洗 + 出口内嵌", () => {
            const m = mountBlock(
                `<div x-block="row" class="toolbar" x-bind:id="x" :data-x="x" @click="noop" title="{{x}}">
                    <button data-w="100" id="a">A</button>
                </div>`,
                { x: 1 },
            );
            spawned.push(m.engine);
            const shellName = String(m.popover.options.shell);
            expect(shellName).toMatch(/^autospark-block-shell-\d+$/);
            const scope = m.engine.findScopeByEl(m.host)!;
            const shell = scope.getComponentDeclaration(shellName)!;
            expect(shell).toBeTruthy();
            expect(shell.classList.contains("autospark-block-panel")).toBe(true);
            expect(shell.classList.contains("toolbar")).toBe(true); // 用户类延续
            expect(shell.hasAttribute("x-block")).toBe(false);
            expect(shell.hasAttribute("x-bind:id")).toBe(false);
            expect(shell.hasAttribute(":data-x")).toBe(false);
            expect(shell.hasAttribute("@click")).toBe(false);
            expect(shell.getAttribute("title")).toBeNull();
            expect(shell.querySelector("[x-slot]")).toBeTruthy(); // 默认出口
            // 共享空内容组件已注册（initialize 通道）
            expect(m.engine.getComponentDeclaration("autospark-block-content")).toBeTruthy();
        });

        test("shell 选项：显式外壳组件名替换默认克隆壳", () => {
            const m = mountBlock(
                `<div x-block="row" x-block-options="{shell:'my-shell'}">
                    <button data-w="100" id="a">A</button>
                </div>`,
                {},
                "w",
                {
                    components: {
                        "my-shell": `<div x-define="my-shell" class="custom-shell"><div x-slot></div></div>`,
                    },
                },
            );
            spawned.push(m.engine);
            expect(String(m.popover.options.shell)).toBe("my-shell");
        });

        test("非法 shell 选项 warn + 回退克隆壳", () => {
            const { warns, restore } = catchWarns();
            try {
                const m = mountBlock(
                    `<div x-block="row" x-block-options="{shell:42}">
                        <button data-w="100" id="a">A</button>
                    </div>`,
                );
                spawned.push(m.engine);
                expect(String(m.popover.options.shell)).toMatch(/^autospark-block-shell-\d+$/);
                expect(warns.some((w) => w.includes("shell"))).toBe(true);
            } finally {
                restore();
            }
        });

        test("溢出 → hover 开面板：折叠子元素注入克隆壳出口；关闭摘回 stash", async () => {
            const m = mountBlock(ROW_TMPL);
            spawned.push(m.engine);
            fit(m.host, 250); // 折 C
            expect(document.getElementById("c")!.parentNode).toBeNull();
            // hover 打开（PopoverDirective delayShow 默认 200ms）
            m.trigger.dispatchEvent(new MouseEvent("mouseenter"));
            await new Promise<void>((r) => setTimeout(r, 320));
            const panel = document.querySelector(
                "[data-autospark-overlays] .autospark-block-panel",
            ) as HTMLElement | null;
            expect(panel).toBeTruthy(); // 宿主克隆壳已挂载
            expect(panel!.classList.contains("toolbar")).toBe(true);
            const c = document.getElementById("c")!;
            expect(panel!.contains(c)).toBe(true); // 折叠子元素注入面板
            expect(c.parentNode!.hasAttribute("x-slot")).toBe(true); // 挂入出口
            // 离开关闭（delayHide 150ms）→ 面板 DOM 尚在窗口内摘回
            m.trigger.dispatchEvent(new MouseEvent("mouseleave"));
            await new Promise<void>((r) => setTimeout(r, 260));
            expect(c.parentNode).toBeNull(); // 摘回 stash（脱离文档持有）
        });
    });
});
