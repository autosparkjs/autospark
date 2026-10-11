import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount } from "../helpers";
import type { AutoSpark } from "../../engine/engine";

/**
 * x-foldable 溢出折叠容器（ADR-0098 重写版）。
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

/** 挂载 x-foldable 并覆写主轴尺寸模拟（axis "w"=宽 / "h"=高；初始分配尺寸默认充分不溢出） */
function mountFoldable(
    html: string,
    state: any = {},
    axis: "w" | "h" = "w",
    options?: Parameters<typeof mount>[2],
): BlockMount {
    const { root, engine } = mount(html, state, options);
    document.body.appendChild(root);
    const host = root.querySelector("[x-foldable]") as HTMLElement;
    const trigger = Array.from(host.children).find((c) =>
        c.classList.contains("autospark-foldable-trigger"),
    ) as HTMLButtonElement;
    // 子元素主轴尺寸覆写：happy-dom 无布局 offsetWidth/offsetHeight 恒 0，而折叠的
    // 尺寸缓存与恢复判定（scroll+gap+缓存 ≤ client）全赖此值——映射 data-w 使步进
    // 数学与真实布局一致（否则缓存 0 使折叠/恢复立即互满足，收敛由 guard 奇偶性决定）
    const sizeKey = axis === "h" ? "offsetHeight" : "offsetWidth";
    for (const el of Array.from(host.querySelectorAll<HTMLElement>("[data-w]"))) {
        Object.defineProperty(el, sizeKey, {
            configurable: true,
            get: () => Number(el.dataset.w),
        });
    }
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
<div x-foldable="row" class="toolbar" style="width:250px">
    <button data-w="100" id="a">A</button>
    <button data-w="100" id="b">B</button>
    <button data-w="100" id="c">C</button>
</div>
`;

describe("x-foldable 溢出折叠容器（ADR-0098 重写版）", () => {
    describe("结构契约", () => {
        test("宿主契约类 + 方向标记 + 触发按钮预置（popover 通道装配）", () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            expect(m.host.classList.contains("autospark-foldable")).toBe(true);
            expect(m.host.dataset.direction).toBe("row");
            expect(m.trigger).toBeTruthy();
            expect(m.trigger.getAttribute("aria-label")).toBe("更多");
            expect(m.trigger.getAttribute("aria-haspopup")).toBe("true");
            // x-popover 属性已剥除（Compile 通道）——断言指令实例与 options 装配：
            // 默认无壳（popover 解析链回退内置 autospark.popover，锚定模式 arrow 默认开）
            expect(m.popover).toBeTruthy();
            expect(m.popover.options.at.placement).toBe("bottom-end");
            expect(m.popover.options.shell).toBeUndefined();
            // 初始不溢出：按钮无内联显示（全局 CSS display:none 承担隐藏）
            expect(m.trigger.style.display).toBe("");
            // 子元素照常编译（无 ownsChildren）
            expect(m.host.querySelectorAll("button").length).toBe(4); // 3 子元素 + 触发按钮
        });

        test("column 字面量轴", () => {
            const m = mountFoldable(`<div x-foldable="column"><i data-w="10"></i></div>`);
            spawned.push(m.engine);
            expect(m.host.dataset.direction).toBe("column");
            expect(m.popover.options.at.placement).toBe("right-end");
        });

        test("响应式换轴：表达式驱动 + 触发按钮方位热更 + 折叠态复位", async () => {
            const m = mountFoldable(
                `<div x-foldable="dir" style="width:250px">
                    <button data-w="100" id="a">A</button>
                    <button data-w="100" id="b">B</button>
                </div>`,
                { dir: "row" },
            );
            spawned.push(m.engine);
            const a = document.getElementById("a")!;
            const b = document.getElementById("b")!;
            fit(m.host, 100); // 折 B
            expect(b.parentNode).toBeNull();
            m.engine.state.dir = "column";
            // 换轴复位经子树 MO（data-direction 变化 → 宏任务重估）：watcher 微任务 +
            // MO 回调排 setTimeout，须等两个宏任务（x-foldable 双实例分工——scope 写、observer 复位）
            await new Promise<void>((r) => setTimeout(r, 0));
            await new Promise<void>((r) => setTimeout(r, 0));
            expect(m.host.dataset.direction).toBe("column");
            // 换轴复位：全部按原位锚还原（断言面布尔投影——DOM diff 爆炸防护）
            expect(b.parentNode === m.host).toBe(true);
            expect(m.trigger.style.display).toBe("");
            expect(m.popover.options.at.placement).toBe("right-end");
        });
    });

    describe("溢出折叠（步进收敛）", () => {
        test("初始不溢出：无折叠、按钮隐藏", () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            const a = document.getElementById("a")!;
            fit(m.host, 500);
            expect(a.parentNode === m.host).toBe(true);
            expect(m.trigger.style.display).toBe("");
        });

        test("溢出折叠末尾子元素：出文档 + 按钮显示 + min 尺寸写入", () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            const c = document.getElementById("c")!;
            fit(m.host, 250);
            expect(c.parentNode).toBeNull(); // 真实搬移出文档
            expect(m.trigger.style.display).toBe("inline-flex");
            expect(m.host.style.minWidth).toBe("0px"); // happy-dom offsetWidth=0，写入通道生效
        });

        test("min 尺寸 = 按钮完整外沿占位（含宿主主轴 padding/border）", () => {
            // padding 0 20px：min = trigger(0) + 40 = 40px——极窄态按钮不被 padding 挤裁
            const m = mountFoldable(
                `<div x-foldable="row" style="padding:0 20px;border:1px solid #000">
                    <button data-w="100" id="a">A</button>
                    <button data-w="100" id="b">B</button>
                </div>`,
            );
            spawned.push(m.engine);
            fit(m.host, 100);
            expect(m.host.style.minWidth).toBe("42px"); // 0(trigger) + 40(pad) + 2(border)
        });

        test("恰好收敛（防多折）：250 分配只折 1 个", () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            const a = document.getElementById("a")!;
            const b = document.getElementById("b")!;
            fit(m.host, 250);
            expect(b.parentNode === m.host).toBe(true);
            expect(a.parentNode === m.host).toBe(true);
        });

        test("渐进折叠：分配持续收窄逐个折叠", () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            const a = document.getElementById("a")!;
            const b = document.getElementById("b")!;
            fit(m.host, 250);
            fit(m.host, 150);
            expect(b.parentNode).toBeNull();
            expect(a.parentNode === m.host).toBe(true);
            fit(m.host, 50);
            expect(a.parentNode).toBeNull();
        });

        test("变宽渐进恢复：LIFO 前缀保留 + 全恢复后按钮隐藏", () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            const a = document.getElementById("a")!;
            const b = document.getElementById("b")!;
            const c = document.getElementById("c")!;
            fit(m.host, 50); // 全折（栈：C→B→A）
            expect(a.parentNode).toBeNull();
            fit(m.host, 250); // LIFO 恢复 A、B（C 放不下：200+100>250）——前缀保留语义
            expect(a.parentNode === m.host).toBe(true);
            expect(b.parentNode === m.host).toBe(true);
            expect(c.parentNode).toBeNull();
            fit(m.host, 600); // 全恢复
            expect(c.parentNode === m.host).toBe(true);
            expect(m.trigger.style.display).toBe("");
        });

        test("隐藏子元素不参与折叠（display:none 跳过）", () => {
            const m = mountFoldable(
                `<div x-foldable="row" style="width:250px">
                    <button data-w="100" id="a">A</button>
                    <button data-w="100" id="h" style="display:none">H</button>
                    <button data-w="100" id="c">C</button>
                </div>`,
            );
            spawned.push(m.engine);
            const h = document.getElementById("h")!;
            const c = document.getElementById("c")!;
            // 分配 150：可见者 A+C 共 200 溢出（隐藏 H 不占布局不进 scroll）——折叠候选
            // 从末尾起跳过 H（display:none）折 C
            fit(m.host, 150);
            expect(h.parentNode === m.host).toBe(true); // 隐藏者永不折叠
            expect(c.parentNode).toBeNull();
        });

        test("栈中隐藏者跳过恢复，恢复可见后自然回位", () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            const c = document.getElementById("c")!;
            fit(m.host, 250); // 折 C
            c.style.display = "none"; // 折叠期间被隐藏（x-show 场景）
            fit(m.host, 600); // 富余充分，但栈顶不可见——跳过
            expect(c.parentNode).toBeNull();
            c.style.display = "";
            fit(m.host, 600); // 恢复可见 → 回位
            expect(c.parentNode === m.host).toBe(true);
            expect(m.trigger.style.display).toBe("");
        });

        test("主轴 padding 计入判据（内容可用宽 = client − padding）", () => {
            // 宿主左右 padding 共 40：可用 = 220 − 40 = 180；三按钮 300 → 折 C（200）仍 > 180
            // → 再折 B（100 ≤ 180 停）。若无 padding 修复：300 > 220 折 C 后 200 ≤ 220 即停
            //（少折一个——按钮被裁切），本用例锁定区分行为
            const m = mountFoldable(
                `<div x-foldable="row" style="padding:0 20px">
                    <button data-w="100" id="a">A</button>
                    <button data-w="100" id="b">B</button>
                    <button data-w="100" id="c">C</button>
                </div>`,
            );
            spawned.push(m.engine);
            const b = document.getElementById("b")!;
            const c = document.getElementById("c")!;
            fit(m.host, 220);
            expect(c.parentNode).toBeNull();
            expect(b.parentNode).toBeNull(); // padding 使内容可用仅 180，B 须折
        });

        test("column 轴对称折叠（scrollHeight/clientHeight + min-height）", () => {
            const m = mountFoldable(
                `<div x-foldable="column">
                    <button data-w="100" id="a">A</button>
                    <button data-w="100" id="b">B</button>
                </div>`,
                {},
                "h",
            );
            spawned.push(m.engine);
            const b = document.getElementById("b")!;
            fit(m.host, 150);
            expect(b.parentNode).toBeNull();
            expect(m.trigger.style.display).toBe("inline-flex");
            expect(m.host.style.minHeight).toBe("0px");
            expect(m.host.style.minWidth).toBe("");
        });

        test("destroy 后重估通道静默（不抛错、无折叠动作）", () => {
            const m = mountFoldable(ROW_TMPL);
            const { engine, host } = m;
            spawned.push(engine);
            engine.destroy();
            expect(() => fit(host, 10)).not.toThrow();
            expect(host.querySelectorAll("button").length).toBe(4); // DOM 不被指令销毁清理
        });
    });

    describe("面板（popover 内置 shell + overlay 中继）", () => {
        test("默认无壳：不克隆宿主、shell 未写入（popover 回退内置 autospark.popover）", () => {
            const m = mountFoldable(
                `<div x-foldable="row" class="toolbar" x-bind:id="x" :data-x="x" @click="noop" title="{{x}}">
                    <button data-w="100" id="a">A</button>
                </div>`,
                { x: 1 },
            );
            spawned.push(m.engine);
            expect(m.popover.options.shell).toBeUndefined(); // 不建克隆壳组件
            const scope = m.engine.findScopeByEl(m.host)!;
            expect(scope.components).toBeNull(); // 宿主 scope 无编程式壳注册
            // 共享空内容组件已注册（initialize 通道）
            expect(m.engine.getComponentDeclaration("autospark-foldable-content")).toBeTruthy();
        });

        test("popover 选项透传：用户值优先合并进 x-popover-options", () => {
            const m = mountFoldable(
                `<div x-foldable="row" x-foldable-options="{popover:{arrow:false,delayShow:50}}">
                    <button data-w="100" id="a">A</button>
                </div>`,
            );
            spawned.push(m.engine);
            expect(m.popover.options.arrow).toBe(false);
            expect(m.popover.options.delayShow).toBe(50);
            expect(m.popover.options.at.placement).toBe("bottom-end"); // 未覆盖项保留默认
        });

        test("popover 选项非法形态 warn + 忽略透传", () => {
            const { warns, restore } = catchWarns();
            try {
                const m = mountFoldable(
                    `<div x-foldable="row" x-foldable-options="{popover:'fast'}">
                        <button data-w="100" id="a">A</button>
                    </div>`,
                );
                spawned.push(m.engine);
                expect(m.popover.options.delayShow).toBeUndefined(); // 透传被忽略
                expect(m.popover.options.at.placement).toBe("bottom-end"); // 默认仍在
                expect(warns.some((w) => w.includes("popover"))).toBe(true);
            } finally {
                restore();
            }
        });

        test("shell 选项：显式外壳组件名替换内置 shell", () => {
            const m = mountFoldable(
                `<div x-foldable="row" x-foldable-options="{shell:'my-shell'}">
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

        test("非法 shell 选项静默维持无壳默认", () => {
            const m = mountFoldable(
                `<div x-foldable="row" x-foldable-options="{shell:42}">
                    <button data-w="100" id="a">A</button>
                </div>`,
            );
            spawned.push(m.engine);
            expect(m.popover.options.shell).toBeUndefined();
        });

        test("溢出 → hover 开面板：折叠子元素注入内置 shell 出口；关闭摘回 stash", async () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            const c = document.getElementById("c")!;
            fit(m.host, 250); // 折 C
            expect(c.parentNode).toBeNull();
            // hover 打开（PopoverDirective delayShow 默认 200ms）
            m.trigger.dispatchEvent(new MouseEvent("mouseenter"));
            await new Promise<void>((r) => setTimeout(r, 320));
            const panel = document.querySelector(
                "[data-autospark-overlays] .autospark-popover",
            ) as HTMLElement | null;
            expect(panel).toBeTruthy(); // 内置 popover shell（autospark-popover 形态类）已挂载
            expect(panel!.querySelector(".autospark-overlay-arrow")).toBeTruthy(); // 箭头载体在（锚定默认开）
            expect(panel!.contains(c)).toBe(true); // 折叠子元素注入面板
            const outlet = c.parentNode as HTMLElement;
            expect(outlet.hasAttribute("data-slot")).toBe(true); // 挂入出口（编译后标记）
            expect(outlet.classList.contains("autospark-foldable-panel")).toBe(true); // 出口打面板布局类
            // 离开关闭（delayHide 150ms）→ 面板 DOM 尚在窗口内摘回
            m.trigger.dispatchEvent(new MouseEvent("mouseleave"));
            await new Promise<void>((r) => setTimeout(r, 260));
            expect(c.parentNode).toBeNull(); // 摘回 stash（脱离文档持有）
        });

        test("面板开态下宽窄变化不抽走面板内容；关闭后重估自然回位", async () => {
            const m = mountFoldable(ROW_TMPL);
            spawned.push(m.engine);
            const a = document.getElementById("a")!;
            const c = document.getElementById("c")!;
            fit(m.host, 250); // 折 C
            // hover 开面板（C 挂入面板出口）
            m.trigger.dispatchEvent(new MouseEvent("mouseenter"));
            await new Promise<void>((r) => setTimeout(r, 320));
            const panel = document.querySelector(
                "[data-autospark-overlays] .autospark-foldable-panel",
            ) as HTMLElement | null;
            expect(panel?.contains(c)).toBe(true);
            // 面板开态放宽：面板内元素不被抽走（跳过恢复，防 restore↔fold 振荡）
            fit(m.host, 600);
            expect(panel!.contains(c)).toBe(true);
            expect(a.parentNode === m.host).toBe(true);
            // 关闭面板（元素摘回 detached）→ 重估通道驱动按需回位
            m.trigger.dispatchEvent(new MouseEvent("mouseleave"));
            await new Promise<void>((r) => setTimeout(r, 300));
            fit(m.host, 600);
            expect(c.parentNode === m.host).toBe(true);
            expect(m.trigger.style.display).toBe("");
        });
    });
});
