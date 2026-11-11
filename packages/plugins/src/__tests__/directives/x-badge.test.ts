import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "autospark";
// 插件自举（ADR-0015）：模块加载即注册指令
import "../../directives/x-badge/index";

/**
 * x-badge 徽标指令单测（ADR-0015）：
 * - 注册：插件自举后 engine.directives 含 "badge"；
 * - dot 形态（默认）：无值恒显（红点不依赖数字）/ 有值非零恒显 / 零值摘除；
 * - count 形态：表达式响应式更新文本、溢出格式化（严格大于）、零值摘除恢复重挂、
 *   无值不渲染（无数字可显）；
 * - 值通道：字面量数字不订阅直读 / attrChanged 重建值订阅；
 * - 修饰符糖：`.count` ≡ `type:'count'`（三通道等价）；
 * - ripple：dot 挂内联 SMIL 扩散环 SVG / count 挂脉冲修饰类；
 * - 配置：color 落实例 CSS 变量 / overflowCount 正数归一 / 非法值 warn 回退默认；
 * - 清理：engine.destroy 摘徽标与宿主类。
 *
 * 测试环境注意：happy-dom 无真实 CSS 动画，ripple 断言聚焦 DOM 结构（SVG 存在 /
 * 修饰类挂靠）而非动画播态；SMIL `<animate>` 元素 happy-dom 可正常解析建树。
 */

describe("x-badge 徽标指令（ADR-0015）", () => {
    const spawned: AutoSpark[] = [];
    afterEach(() => {
        for (const e of spawned) {
            try {
                e.destroy();
            } catch {
                // 幂等销毁吞错
            }
        }
        spawned.length = 0;
        document.querySelectorAll("[data-x-badge-test-root]").forEach((n) => n.remove());
    });

    const spawn = (html: string, state: any = {}) => {
        const m = mount(html, state);
        spawned.push(m.engine);
        m.root.setAttribute("data-x-badge-test-root", "");
        document.body.appendChild(m.root);
        return m;
    };

    const hostOf = (root: HTMLElement) => root.firstElementChild as HTMLElement;
    const markOf = (host: HTMLElement) => host.querySelector(".x-badge-mark") as HTMLElement | null;

    /* ── 注册与 dot 基线 ── */

    test("插件自举：badge 指令经安装器队列注册（参与首编译，构造期生效）", () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        expect(engine.directives.has("badge")).toBe(true);
    });

    test("dot 无值恒显：宿主标记类 + 徽标本体（8px 形态类 + aria-hidden）", async () => {
        const { root } = spawn(`<div><button x-badge>消息</button></div>`, {});
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        expect(host.classList.contains("x-badge")).toBe(true);
        const mark = markOf(host)!;
        expect(mark).toBeTruthy();
        expect(mark.classList.contains("x-badge-dot")).toBe(true);
        expect(mark.getAttribute("aria-hidden")).toBe("true"); // 纯视觉装饰不进读屏
        expect(mark.querySelector(".x-badge-waves")).toBeFalsy(); // ripple 默认关
    });

    test("dot 有值非零恒显（数字被忽略——红点不显示数字）", async () => {
        const { root } = spawn(`<div><button x-badge="unread">消息</button></div>`, { unread: 5 });
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        const mark = markOf(host)!;
        expect(mark.classList.contains("x-badge-dot")).toBe(true);
        expect(mark.textContent).toBe(""); // dot 形态不渲染数字
    });

    /* ── 零值规则（决策 4 唯一裁决点） ── */

    test("dot 零值摘除：0 / null 均摘徽标，恢复非零重挂", async () => {
        const { root, engine } = spawn(`<div><button x-badge="unread">消息</button></div>`, {
            unread: 5,
        });
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        expect(markOf(host)).toBeTruthy();

        (engine.store.state as any).unread = 0;
        await nextTick();
        expect(markOf(host)).toBeFalsy(); // 0 条未读 = 无消息

        (engine.store.state as any).unread = null;
        await nextTick();
        expect(markOf(host)).toBeFalsy();

        (engine.store.state as any).unread = 3;
        await nextTick();
        expect(markOf(host)).toBeTruthy(); // 恢复重挂
    });

    test("无值 dot 与零值 dot 语义正交：x-badge 恒显 / x-badge=\"0\" 隐藏", async () => {
        const { root } = spawn(
            `<div><button id="a" x-badge>A</button><button id="b" x-badge="0">B</button></div>`,
            {},
        );
        const host = hostOf(root);
        await nextTick();
        expect(markOf(host.querySelector("#a") as HTMLElement)).toBeTruthy(); // 无值恒显
        expect(markOf(host.querySelector("#b") as HTMLElement)).toBeFalsy(); // 零值隐藏
    });

    /* ── count 形态 ── */

    test("count 表达式响应式：文本随状态更新", async () => {
        const { root, engine } = spawn(
            `<div><button x-badge="unread" x-badge-options="{type:'count'}">消息</button></div>`,
            { unread: 5 },
        );
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        const mark = markOf(host)!;
        expect(mark.classList.contains("x-badge-count")).toBe(true);
        expect(mark.textContent).toBe("5");

        (engine.store.state as any).unread = 12;
        await nextTick();
        expect(markOf(host)!.textContent).toBe("12");
    });

    test("count 溢出格式化：超过 overflowCount 显示 \"99+\"（严格大于）", async () => {
        const { root } = spawn(
            `<div><button id="a" x-badge="na" x-badge-options="{type:'count'}">A</button>` +
                `<button id="b" x-badge="nb" x-badge-options="{type:'count',overflowCount:9}">B</button></div>`,
            { na: 99, nb: 10 },
        );
        const host = hostOf(root);
        await nextTick();
        expect(markOf(host.querySelector("#a") as HTMLElement)!.textContent).toBe("99"); // 等于上限不 +
        expect(markOf(host.querySelector("#b") as HTMLElement)!.textContent).toBe("9+"); // 自定义上限
    });

    test("count 零值摘除：负数与非有限数同为零值", async () => {
        const { root, engine } = spawn(
            `<div><button x-badge="n" x-badge-options="{type:'count'}">消息</button></div>`,
            { n: 8 },
        );
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        expect(markOf(host)).toBeTruthy();

        (engine.store.state as any).n = -1;
        await nextTick();
        expect(markOf(host)).toBeFalsy(); // 负数无未读语义

        (engine.store.state as any).n = "abc";
        await nextTick();
        expect(markOf(host)).toBeFalsy(); // 转数字 NaN 按零值
    });

    test("count 无值不渲染（无数字可显）", async () => {
        const { root } = spawn(
            `<div><button x-badge x-badge-options="{type:'count'}">消息</button></div>`,
            {},
        );
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        expect(markOf(host)).toBeFalsy();
    });

    /* ── 值通道 ── */

    test("字面量数字：不订阅直读（x-badge=\"5\" → count 形态显 5）", async () => {
        const { root } = spawn(
            `<div><button x-badge="5" x-badge-options="{type:'count'}">消息</button></div>`,
            {},
        );
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        expect(markOf(host)!.textContent).toBe("5");
    });

    test("attrChanged：运行时改属性值重新渲染（Runtime 通道本体）", async () => {
        const { root } = spawn(
            `<div><button x-badge="7" x-badge-options="{type:'count'}">消息</button></div>`,
            {},
        );
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        expect(markOf(host)!.textContent).toBe("7");

        host.setAttribute("x-badge", "120");
        await nextTick();
        expect(markOf(host)!.textContent).toBe("99+"); // 字面量通道换值 + 溢出生效

        host.setAttribute("x-badge", "0");
        await nextTick();
        expect(markOf(host)).toBeFalsy();
    });

    test("无 scope 回退分支：动态插入元素的表达式值经 store 直读渲染（store 无 read 方法）", async () => {
        const m = spawn(`<div><span>锚</span></div>`, { likes: 6 });
        await nextTick();
        // 动态插入元素不在编译期 scopeMap → bindValue 走 engine.store.watch 回退分支
        const dyn = document.createElement("span");
        dyn.setAttribute("x-badge", "likes");
        dyn.setAttribute("x-badge-options", "{type:'count'}");
        m.root.appendChild(dyn);
        await nextTick();
        await new Promise((r) => setTimeout(r, 20)); // childList observer 微任务
        expect(markOf(dyn)).toBeTruthy();
        expect(markOf(dyn)!.textContent).toBe("6"); // initial 经 readStorePath 直读 state

        (m.engine.store.state as any).likes = 0;
        await nextTick();
        expect(markOf(dyn)).toBeFalsy(); // 回退 watcher 响应式跟随
        (m.engine.store.state as any).likes = 42;
        await nextTick();
        expect(markOf(dyn)!.textContent).toBe("42");
    });

    test("修饰符糖：x-badge.count ≡ type:'count'", async () => {
        const { root } = spawn(`<div><button x-badge.count="n">消息</button></div>`, { n: 3 });
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        const mark = markOf(host)!;
        expect(mark.classList.contains("x-badge-count")).toBe(true);
        expect(mark.textContent).toBe("3");
    });

    /* ── ripple（决策 7：默认关，双形态载体） ── */

    test("dot + ripple：内联 SMIL 扩散环 SVG（双环错相）", async () => {
        const { root } = spawn(`<div><button x-badge.ripple>消息</button></div>`, {});
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        const mark = markOf(host)!;
        expect(mark.classList.contains("x-badge-ripple")).toBe(true);
        const svg = mark.querySelector(".x-badge-waves") as SVGSVGElement;
        expect(svg).toBeTruthy();
        const circles = svg.querySelectorAll("circle");
        expect(circles.length).toBe(2); // 双错相扩散环（同源 x-icon ripple 几何）
        const begins = [...svg.querySelectorAll("animate")].map((a) => a.getAttribute("begin"));
        expect(begins).toContain("-1s"); // 负相位错开（动态插入场景文档时钟已过正 begin）
    });

    test("count + ripple：脉冲修饰类（CSS 双伪元素环由样式层承担）", async () => {
        const { root } = spawn(
            `<div><button x-badge.count.ripple="n">消息</button></div>`,
            { n: 2 },
        );
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        const mark = markOf(host)!;
        expect(mark.classList.contains("x-badge-ripple")).toBe(true);
        expect(mark.querySelector(".x-badge-waves")).toBeFalsy(); // count 不叠 SVG（遮数字）
        expect(mark.textContent).toBe("2");
    });

    /* ── 配置归一（宽松策略：warn 回退不中断渲染） ── */

    test("color 落实例 CSS 变量（宿主 style）", async () => {
        const { root } = spawn(
            `<div><button x-badge x-badge-options="{color:'#00b578'}">消息</button></div>`,
            {},
        );
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        expect(host.style.getPropertyValue("--x-badge-color")).toBe("#00b578");
    });

    test("缺省 color 为三级回退链（theme 令牌 → 插件变量 → 校准值）", async () => {
        const { root } = spawn(`<div><button x-badge>消息</button></div>`, {});
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        const color = host.style.getPropertyValue("--x-badge-color");
        expect(color).toContain("--auto-danger-color");
        expect(color).toContain("--autospark-badge-color");
        expect(color).toContain("#ef4444");
    });

    test("非法 options 回退默认（warn 在构造期发出，此处断言回退行为）", async () => {
        const { root } = spawn(
            `<div>` +
                `<button id="a" x-badge x-badge-options="{type:'round'}">A</button>` +
                `<button id="b" x-badge="150" x-badge-options="{type:'count',overflowCount:-3,color:12}">B</button>` +
                `</div>`,
            {},
        );
        const host = hostOf(root);
        await nextTick();
        // 非法 type（'round'）回退 dot
        expect(markOf(host.querySelector("#a") as HTMLElement)!.classList.contains("x-badge-dot")).toBe(true);
        // 非法 overflowCount（-3）回退 99 → 150 显 "99+"；非法 color（数字）回退默认链
        const b = host.querySelector("#b") as HTMLElement;
        expect(markOf(b)!.textContent).toBe("99+");
        expect(b.style.getPropertyValue("--x-badge-color")).toContain("--auto-danger-color");
    });

    /* ── 清理 ── */

    test("engine.destroy：摘徽标与宿主类", async () => {
        const m = spawn(`<div><button x-badge>消息</button></div>`, {});
        const host = hostOf(m.root).firstElementChild as HTMLElement;
        await nextTick();
        expect(markOf(host)).toBeTruthy();
        m.engine.destroy();
        expect(host.classList.contains("x-badge")).toBe(false);
    });

    test("独立徽标形态：空宿主 + dot 即状态点（mark 挂空宿主）", async () => {
        const { root } = spawn(`<div><span x-badge></span></div>`, {});
        const host = hostOf(root).firstElementChild as HTMLElement;
        await nextTick();
        expect(markOf(host)).toBeTruthy(); // 空宿主上徽标照常渲染
        expect(host.children.length).toBe(1);
    });
});
