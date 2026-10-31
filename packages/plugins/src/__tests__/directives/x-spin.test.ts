import { describe, expect, test, afterEach, spyOn } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "autospark";
// 插件自举（ADR-0002）：模块加载即注册 spin 指令
import "../../directives/x-spin/index";
import { DecorateDirective } from "../../utils/decorate";

/**
 * x-spin 色环旋转指令单测（ADR-0007，自 x-spark 伞形拆分）：
 * - 注册：插件自举后 engine.directives 含 "spin"；
 * - 值通道：无值恒开 / 字面 false 恒关 / 表达式 truthiness 响应式切换（转假播完当前周期再停）；
 * - 触发器：always 立即循环 / hover 悬停播放、移出周期末停止 / click 单圈播放，
 *   三通道等价并存按 hover > always > click 取先；
 * - 形态：type 回归形态键（rotate/beam/chase，缺省 beam），三通道等价、并存按
 *   chase > rotate > beam 取先（ADR-0007 决策 2），修饰符词表分流次序无关；
 * - 跨指令键：x-ripple 形态词表与 gap（涟漪专属静止段）warn 忽略，不中断渲染；
 * - 载体：伪元素形态默认，探测占用降级子元素（恒单环——chase 双段在渐变内，非双载体）；
 * - 徽标：badge 角标圆内旋转环，color 缺省联动语义红；
 * - 渐变直连契约：三形态 background 直写角度变量，禁绝中转变量（paint 失效传播）；
 * - 配置：静态 options 归一，非法值 warn 回退（宽松策略不中断渲染）；
 * - 清理：destroy 摘类（含形态类）、摘载体、断事件。
 *
 * 测试环境注意：happy-dom 无真实 CSS 动画，断言聚焦类切换 / 内联样式 / DOM 结构等
 * 指令状态机的可观测副作用；伪元素探测经 DecorateDirective.probe 静态替换驱动降级路径
 * （两指令共享同一静态——ripple 测试文件亦然，afterEach 复位防泄漏）。
 */

/** 等待一拍（setTimeout 0）：探测循环按拍推进（happy-dom 无渲染泵，rAF 不调度） */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
/** 等两拍：探测帧 + 激活帧稳定 */
const twoFrames = async () => {
    await tick();
    await tick();
};

describe("x-spin 色环旋转指令（ADR-0007）", () => {
    const spawned: AutoSpark[] = [];
    const probeSpy = spyOn(DecorateDirective, "probe");
    afterEach(() => {
        for (const e of spawned) {
            try {
                e.destroy();
            } catch {
                // 幂等销毁吞错
            }
        }
        spawned.length = 0;
        probeSpy.mockReset();
        // 清理挂到 body 的测试根
        document.querySelectorAll("[data-x-spin-test-root]").forEach((n) => n.remove());
    });

    const spawn = (html: string, state: any = {}, options?: Parameters<typeof mount>[2]) => {
        const m = mount(html, state, options);
        spawned.push(m.engine);
        m.root.setAttribute("data-x-spin-test-root", "");
        document.body.appendChild(m.root); // 宿主连接文档：探测循环需要 isConnected
        return m;
    };

    const hostOf = (root: HTMLElement) => root.firstElementChild as HTMLElement;

    test("插件自举：spin 指令经安装器队列注册（参与首编译，构造期生效）", () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        expect(engine.directives.has("spin")).toBe(true);
    });

    test("无值恒开：宿主标记类 + 激活类 + 缺省 beam 形态类 + 实例 CSS 变量落位", async () => {
        const { root } = spawn(`<div x-spin style="border-radius:8px"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin")).toBe(true);
        expect(host.classList.contains("x-spin-on")).toBe(true);
        expect(host.classList.contains("x-spin-beam")).toBe(true); // 形态缺省 beam（光段跑边）
        expect(host.style.getPropertyValue("--x-spin-color")).toContain("--auto-theme-color");
        expect(host.style.getPropertyValue("--x-spin-size")).toBe("4px"); // 环宽缺省
        expect(host.style.getPropertyValue("--x-spin-duration")).toBe("3000ms");
    });

    test("字面 false 恒关：不激活（标记类也不加——形态未探测定型）", async () => {
        const { root } = spawn(`<div x-spin="false"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin-on")).toBe(false);
        expect(host.classList.contains("x-spin")).toBe(false);
    });

    test("表达式 truthiness：true 激活 → false 播完当前一圈再停 → true 重启", async () => {
        const { root, engine } = spawn(
            `<div x-spin="ui.show" x-spin-options="{speed:50}"></div>`,
            { ui: { show: true } },
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin-on")).toBe(true);

        // 转假：不打断在播周期（停止语义）——立即断言仍在转
        engine.state.ui.show = false;
        await nextTick();
        expect(host.classList.contains("x-spin-on")).toBe(true);
        // 一圈（50ms）结束后复位
        await new Promise((r) => setTimeout(r, 120));
        expect(host.classList.contains("x-spin-on")).toBe(false);

        // 转真：重新启动
        engine.state.ui.show = true;
        await nextTick();
        expect(host.classList.contains("x-spin-on")).toBe(true);
    });

    test("hover 触发：默认不激活，悬停旋转、移出播完当前一圈后停止", async () => {
        const { root } = spawn(
            `<div x-spin x-spin-options="{trigger:'hover',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin-on")).toBe(false);

        host.dispatchEvent(new Event("mouseenter"));
        expect(host.classList.contains("x-spin-on")).toBe(true);

        // 移出：播完当前一圈（≤50ms）后停止
        host.dispatchEvent(new Event("mouseleave"));
        expect(host.classList.contains("x-spin-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 120));
        expect(host.classList.contains("x-spin-on")).toBe(false);
    });

    test("click 触发：初始不转，点击转一圈后自动收口，再点重播（单周期语义与涟漪 click 严格对齐）", async () => {
        const { root } = spawn(
            `<div x-spin x-spin-options="{trigger:'click',speed:60}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames(); // 预探测定形态（marker 类落位，激活类不出现）
        expect(host.classList.contains("x-spin")).toBe(true);
        expect(host.classList.contains("x-spin-on")).toBe(false);

        host.click(); // 点击转一圈
        expect(host.classList.contains("x-spin-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 160)); // 一圈（60ms）末自动收口
        expect(host.classList.contains("x-spin-on")).toBe(false);

        host.click(); // 再点重播一圈
        expect(host.classList.contains("x-spin-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 160));
        expect(host.classList.contains("x-spin-on")).toBe(false);
    });

    test("触发器三通道：修饰符/布尔键/trigger 键等价，并存按 hover > always > click 取先", async () => {
        // ① 修饰符通道：x-spin.hover 等价 trigger:'hover'
        const a = spawn(`<div x-spin.hover x-spin-options="{speed:50}"></div>`, {});
        const ah = hostOf(a.root);
        await twoFrames();
        expect(ah.classList.contains("x-spin-on")).toBe(false);
        ah.dispatchEvent(new Event("mouseenter"));
        expect(ah.classList.contains("x-spin-on")).toBe(true);

        // ② 布尔键通道：{click:true} ≡ trigger:'click'
        const b = spawn(`<div x-spin x-spin-options="{click:true,speed:50}"></div>`, {});
        const bh = hostOf(b.root);
        await twoFrames();
        expect(bh.classList.contains("x-spin-on")).toBe(false);
        bh.click();
        expect(bh.classList.contains("x-spin-on")).toBe(true);

        // ③ 并存取先（跨通道统一值序）：hover 胜 click
        const c = spawn(`<div x-spin x-spin-options="{hover:true,click:true,speed:50}"></div>`, {});
        const ch = hostOf(c.root);
        await twoFrames();
        ch.click();
        expect(ch.classList.contains("x-spin-on")).toBe(false);

        // ④ 显式 false 压制开关：{hover:false} → 无候选，回退默认 always（自动播放）
        const e = spawn(`<div x-spin x-spin-options="{hover:false,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(e.root).classList.contains("x-spin-on")).toBe(true);
    });

    test("形态三通道：修饰符/布尔键/type 键等价，并存按 chase > rotate > beam 取先（缺省 beam）", async () => {
        // ① 修饰符通道：x-spin.chase ≡ type:'chase'
        const a = spawn(`<div x-spin.chase x-spin-options="{speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(a.root).classList.contains("x-spin-chase")).toBe(true);

        // ② 布尔键通道：{rotate:true} ≡ type:'rotate'
        const b = spawn(`<div x-spin x-spin-options="{rotate:true,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(b.root).classList.contains("x-spin-rotate")).toBe(true);

        // ③ 并存取先（缺省垫底 + 枚举声明序）：{type:'beam', rotate:true} → rotate 胜出
        const c = spawn(`<div x-spin x-spin-options="{type:'beam',rotate:true,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(c.root).classList.contains("x-spin-rotate")).toBe(true);

        // ④ {rotate:true, chase:true} → chase 胜出
        const d = spawn(`<div x-spin x-spin-options="{rotate:true,chase:true,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(d.root).classList.contains("x-spin-chase")).toBe(true);

        // ⑤ 非法 type 回退缺省 beam（宽松策略）
        const e = spawn(`<div x-spin x-spin-options="{type:'sway',speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(e.root).classList.contains("x-spin-beam")).toBe(true);
    });

    test("修饰符词表分流、次序无关：x-spin.click.chase ≡ x-spin.chase.click（形态/触发器词表按段归类）", async () => {
        // 两序均解析为 {chase:true, click:true}：click 语义（初始不转）+ chase 形态类
        const a = spawn(`<div x-spin.click.chase x-spin-options="{speed:50}"></div>`, {});
        const b = spawn(`<div x-spin.chase.click x-spin-options="{speed:50}"></div>`, {});
        await twoFrames();
        const ah = hostOf(a.root);
        const bh = hostOf(b.root);
        expect(ah.classList.contains("x-spin-chase")).toBe(true);
        expect(bh.classList.contains("x-spin-chase")).toBe(true);
        expect(ah.classList.contains("x-spin-on")).toBe(false); // click 语义：初始不转
        expect(bh.classList.contains("x-spin-on")).toBe(false);

        bh.click(); // 点击转一圈（click 触发生效，次序无关）
        expect(bh.classList.contains("x-spin-on")).toBe(true);
    });

    test("跨指令键 warn 忽略：x-ripple 形态词表与 gap 均不生效（gap 不烘周期，渲染不中断）", async () => {
        const { root } = spawn(
            `<div x-spin x-spin-options="{ring:true,gap:100,speed:100}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        // ring 是 x-ripple 的形态键、gap 仅涟漪支持：均 warn 忽略，色环照常缺省 beam 恒转
        expect(host.classList.contains("x-spin-on")).toBe(true);
        expect(host.classList.contains("x-spin-beam")).toBe(true);
        expect(host.style.getPropertyValue("--x-spin-duration")).toBe("100ms"); // gap 忽略——周期 = speed
    });

    test("size 环宽语义：显式声明生效于环带 mask padding 变量", async () => {
        const { root } = spawn(
            `<div x-spin x-spin-options="{size:8,speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.style.getPropertyValue("--x-spin-size")).toBe("8px");
    });

    test("载体降级：子元素层为环带载体（mask 环带 + 直连角度变量的渐变，恒单环）", async () => {
        probeSpy.mockImplementation(() => true); // 模拟宿主 ::after 已被占用
        const { root } = spawn(
            `<div x-spin x-spin-options="{type:'beam',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        const layers = host.querySelectorAll(":scope > .x-spin-layer");
        expect(layers.length).toBe(1); // spin 恒单环（chase 双段在渐变内，非双载体）
        const layer = layers[0] as HTMLElement;
        expect(layer.style.animation).toContain("x-spin-angle");
        expect(layer.style.animation).toContain("linear"); // 匀速（涟漪为 ease-out）
        expect(layer.style.padding).toBe("var(--x-spin-size)"); // 环带 = 环宽
        // 渐变直连角度变量（经未注册变量中转的间接链在部分 Chromium 上不触发重绘）
        expect(layer.style.background).toContain("conic-gradient(from var(--x-spin-angle)");
        expect(layer.style.background).toContain("30deg"); // beam 光束扇区模板
        expect(layer.style.cssText).toContain("content-box"); // mask 环带（content-box exclude 挖洞）
    });

    test("渐变直连契约：三形态 background 直写角度变量，禁绝中转变量（paint 失效传播）", () => {
        const style = document.querySelector<HTMLStyleElement>("style[data-x-spin]");
        expect(style).not.toBeNull();
        const css = style?.textContent ?? "";
        // 经未注册变量中转的间接引用链在部分 Chromium 上不触发重绘（角度在跑而色环静止）
        expect(css).not.toContain("--x-spin-bg");
        for (const mode of ["rotate", "beam", "chase"]) {
            expect(css).toContain(`.x-spin.x-spin-${mode}.x-spin-on::after`);
        }
        expect(css.split("conic-gradient(from var(--x-spin-angle)").length - 1).toBe(3);
    });

    test("badge 徽标：角标圆内旋转环（badge + 形态标记类并存，color 缺省联动语义红）", async () => {
        const { root } = spawn(
            `<div x-spin x-spin-options="{badge:true,speed:100}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin-badge")).toBe(true);
        expect(host.classList.contains("x-spin-beam")).toBe(true); // 形态缺省 beam
        expect(host.classList.contains("x-spin-on")).toBe(true);
        expect(host.style.getPropertyValue("--x-spin-color")).toContain("--auto-danger-color"); // 语义红联动全家族
        expect(host.style.getPropertyValue("--x-spin-badge-size")).toBe("8px");
    });

    test("badge 自定义直径与显式 color：数字直径生效，显式 color 恒优先于语义红", async () => {
        const { root } = spawn(
            `<div x-spin x-spin-options="{badge:16,color:'#10b981',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin-badge")).toBe(true);
        expect(host.style.getPropertyValue("--x-spin-badge-size")).toBe("16px");
        expect(host.style.getPropertyValue("--x-spin-color")).toBe("#10b981");
    });

    test("badge 降级载体：子元素层同样右上角正圆定位 + 环带渐变（内联样式承载）", async () => {
        probeSpy.mockImplementation(() => true);
        const { root } = spawn(`<div x-spin x-spin-options="{badge:12,speed:50}"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin-badge")).toBe(true);
        const layer = host.querySelector(":scope > .x-spin-layer") as HTMLElement;
        expect(layer.style.top).toBe("-6px"); // 圆心恰在宿主右上角顶点
        expect(layer.style.width).toBe("12px");
        expect(layer.style.borderRadius).toBe("50%");
        expect(layer.style.zIndex).toBe("2147483647");
        expect(layer.style.background).toContain("conic-gradient(from var(--x-spin-angle)"); // 色环画在角标圆内
    });

    test("options 归一：非法枚举/数值回退默认生效（宽松策略不中断渲染）", async () => {
        // 非法 type 'sway' 回退 beam 缺省形态、非法 trigger 'press' 回退 always（立即循环）、
        // 非法 size -5 / speed 0 回退默认（duration 变量）
        const { root } = spawn(
            `<div x-spin x-spin-options="{type:'sway',trigger:'press',size:-5,speed:0}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin-on")).toBe(true); // trigger 'press' 非法回退 always → 立即循环
        expect(host.classList.contains("x-spin-beam")).toBe(true);
        expect(host.style.getPropertyValue("--x-spin-size")).toBe("4px");
        expect(host.style.getPropertyValue("--x-spin-duration")).toBe("3000ms");
        expect(root.querySelector(".x-spin-layer")).toBeNull(); // 渲染未中断
    });

    test("destroy 清理：摘激活类与宿主标记（含形态类）、移除降级载体", async () => {
        const { root, engine } = spawn(
            `<div x-spin x-spin-options="{type:'chase',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spin-chase")).toBe(true);
        expect(host.classList.contains("x-spin")).toBe(true);

        engine.destroy();
        expect(host.classList.contains("x-spin-chase")).toBe(false);
        expect(host.classList.contains("x-spin-on")).toBe(false);
        expect(host.classList.contains("x-spin")).toBe(false);
    });
});
