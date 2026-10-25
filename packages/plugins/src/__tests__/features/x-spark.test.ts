import { describe, expect, test, afterEach, spyOn } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "autospark";
// 插件自举（ADR-0002）：模块加载即注册 spark 指令
import "../../plugins/x-spark/index";
import { SparkDirective } from "../../plugins/x-spark/index";

/**
 * x-spark 火花指令单测（ADR-0005，x-ripple 升级归一）：
 * - 注册：插件自举后 engine.directives 含 "spark"；
 * - 值通道：无值恒开 / 字面 false 恒关 / 表达式 truthiness 响应式切换（转假播完当前周期再停）；
 * - 触发器：always 立即循环 / hover 悬停播放、移出周期末停止 / click 单周期播放；
 * - 效果族：type ripple（缺省）× rippleMode（ring/glow/echo）/ spin × spinMode（rotate/beam/chase），
 *   修饰符链级联（x-spark.spin.click）与布尔键通道等价；
 * - 载体：伪元素形态默认（宿主标记 + 激活类），探测占用降级子元素（echo 2 层 / 其余 1 层）；
 * - 徽标：badge 家族通用（ripple 圆边扩散 / spin 角标内旋转环），color 缺省联动语义红；
 * - 配置：静态 options 归一，非法值 warn 回退，效果专属键（rippleMode/spinMode/gap）交叉声明忽略；
 * - 清理：destroy 摘类、摘载体、断 hover。
 *
 * 测试环境注意：happy-dom 无真实 CSS 动画，断言聚焦类切换 / 内联样式 / DOM 结构等
 * 指令状态机的可观测副作用；伪元素探测经 SparkDirective.probe 静态替换驱动降级路径。
 */

/** 等待一拍（setTimeout 0）：探测循环按拍推进（happy-dom 无渲染泵，rAF 不调度） */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
/** 等两拍：探测帧 + 激活帧稳定 */
const twoFrames = async () => {
    await tick();
    await tick();
};

describe("x-spark 火花指令（ADR-0005）", () => {
    const spawned: AutoSpark[] = [];
    const probeSpy = spyOn(SparkDirective, "probe");
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
        document.querySelectorAll("[data-x-spark-test-root]").forEach((n) => n.remove());
    });

    const spawn = (html: string, state: any = {}, options?: Parameters<typeof mount>[2]) => {
        const m = mount(html, state, options);
        spawned.push(m.engine);
        m.root.setAttribute("data-x-spark-test-root", "");
        document.body.appendChild(m.root); // 宿主连接文档：探测循环需要 isConnected
        return m;
    };

    const hostOf = (root: HTMLElement) => root.firstElementChild as HTMLElement;

    test("插件自举：spark 指令经安装器队列注册（参与首编译，构造期生效）", () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        expect(engine.directives.has("spark")).toBe(true);
    });

    test("无值恒开：宿主标记类 + 激活类 + 实例 CSS 变量落位（伪元素形态默认）", async () => {
        const { root } = spawn(`<div x-spark style="border-radius:8px"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark")).toBe(true);
        expect(host.classList.contains("x-spark-on")).toBe(true);
        expect(host.classList.contains("x-spark-echo")).toBe(true); // 缺省 ripple + echo 双环
        expect(host.style.getPropertyValue("--x-spark-echo-delay")).toBe("-1500ms"); // 错相位连锁（-speed/2）
        expect(host.style.getPropertyValue("--x-spark-color")).toContain("--auto-theme-color");
        expect(host.style.getPropertyValue("--x-spark-size")).toBe("12px");
        expect(host.style.getPropertyValue("--x-spark-duration")).toBe("3000ms");
    });

    test("字面 false 恒关：不激活（标记类也不加——形态未探测定型）", async () => {
        const { root } = spawn(`<div x-spark="false"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-on")).toBe(false);
        expect(host.classList.contains("x-spark")).toBe(false);
    });

    test("表达式 truthiness：true 激活 → false 播完当前周期再停 → true 重启", async () => {
        const { root, engine } = spawn(
            `<div x-spark="ui.show" x-spark-options="{speed:50}"></div>`,
            { ui: { show: true } },
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-on")).toBe(true);

        // 转假：不打断在播周期（决策 6）——立即断言仍在播
        engine.state.ui.show = false;
        await nextTick();
        expect(host.classList.contains("x-spark-on")).toBe(true);
        // 周期（50ms）结束后复位
        await new Promise((r) => setTimeout(r, 120));
        expect(host.classList.contains("x-spark-on")).toBe(false);

        // 转真：重新启动
        engine.state.ui.show = true;
        await nextTick();
        expect(host.classList.contains("x-spark-on")).toBe(true);
    });

    test("hover 触发：默认不激活，悬停播放、移出周期末停止", async () => {
        const { root } = spawn(
            `<div x-spark x-spark-options="{trigger:'hover',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-on")).toBe(false);

        host.dispatchEvent(new Event("mouseenter"));
        expect(host.classList.contains("x-spark-on")).toBe(true);

        // 移出：播完当前周期（≤50ms）后停止
        host.dispatchEvent(new Event("mouseleave"));
        expect(host.classList.contains("x-spark-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 120));
        expect(host.classList.contains("x-spark-on")).toBe(false);
    });

    test("click 触发：初始不播，点击播一个完整周期后自动收口，再点重播", async () => {
        const { root } = spawn(
            `<div x-spark x-spark-options="{trigger:'click',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames(); // 预探测定形态（marker 类落位，激活类不出现）
        expect(host.classList.contains("x-spark")).toBe(true);
        expect(host.classList.contains("x-spark-on")).toBe(false);

        host.click(); // 点击即播（一个完整周期）
        expect(host.classList.contains("x-spark-on")).toBe(true);
        // echo+click 双环一次起波：第二环与主环**同时**起波（delay 0——任何非零错位都会呈现
        // 第二道波峰，观感「执行两遍」），双环区分走尺寸通道（0.6× 同心缩小），同拍收束
        expect(host.style.getPropertyValue("--x-spark-echo-delay")).toBe("0ms");
        expect(host.style.getPropertyValue("--x-spark-echo-size")).toBe("7.2px");
        await new Promise((r) => setTimeout(r, 120)); // 收口窗（整周期 50ms，含静止段）末自动停止
        expect(host.classList.contains("x-spark-on")).toBe(false);

        host.click(); // 再点重播
        expect(host.classList.contains("x-spark-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 120));
        expect(host.classList.contains("x-spark-on")).toBe(false);
    });

    test("触发器三通道：修饰符/布尔键/trigger 键等价，并存按 hover > always > click 取先", async () => {
        // ① 修饰符通道：x-spark.hover 等价 trigger:'hover'（初始不播，悬停播放）
        const a = spawn(`<div x-spark.hover x-spark-options="{speed:50}"></div>`, {});
        const ah = hostOf(a.root);
        await twoFrames();
        expect(ah.classList.contains("x-spark-on")).toBe(false);
        ah.dispatchEvent(new Event("mouseenter"));
        expect(ah.classList.contains("x-spark-on")).toBe(true);

        // ② 布尔键通道：{click:true} ≡ trigger:'click'（点击播一个完整周期）
        const b = spawn(`<div x-spark x-spark-options="{click:true,speed:50}"></div>`, {});
        const bh = hostOf(b.root);
        await twoFrames();
        expect(bh.classList.contains("x-spark-on")).toBe(false);
        bh.click();
        expect(bh.classList.contains("x-spark-on")).toBe(true);

        // ③ 并存取先（跨通道统一值序）：hover 胜 click——判别器：click 语义下点击会播，hover 语义下点击无效
        const c = spawn(`<div x-spark x-spark-options="{hover:true,click:true,speed:50}"></div>`, {});
        const ch = hostOf(c.root);
        await twoFrames();
        ch.click();
        expect(ch.classList.contains("x-spark-on")).toBe(false);

        // ④ trigger 显式键同样不敌先序值：trigger:'click' + hover:true → hover 胜出
        const d = spawn(`<div x-spark x-spark-options="{trigger:'click',hover:true,speed:50}"></div>`, {});
        const dh = hostOf(d.root);
        await twoFrames();
        dh.click();
        expect(dh.classList.contains("x-spark-on")).toBe(false);

        // ⑤ 显式 false 压制开关：{hover:false} → 无候选，回退默认 always（自动播放）
        const e = spawn(`<div x-spark x-spark-options="{hover:false,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(e.root).classList.contains("x-spark-on")).toBe(true);
    });

    test("效果族三通道：修饰符/布尔键/type 键等价（spin > ripple 取先），缺省 ripple", async () => {
        // ① 修饰符通道：x-spark.spin ≡ type:'spin'（spin 形态类落位）
        const a = spawn(`<div x-spark.spin x-spark-options="{speed:50}"></div>`, {});
        const ah = hostOf(a.root);
        await twoFrames();
        expect(ah.classList.contains("x-spark-spin")).toBe(true);
        expect(ah.classList.contains("x-spark-spin-beam")).toBe(true); // spinMode 缺省 beam
        expect(ah.classList.contains("x-spark-echo")).toBe(false); // spin 无涟漪 echo 双环

        // ② 布尔键通道：{spin:true} ≡ type:'spin'
        const b = spawn(`<div x-spark x-spark-options="{spin:true,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(b.root).classList.contains("x-spark-spin")).toBe(true);

        // ③ 并存取先：{type:'ripple', spin:true} → spin 胜出（跨通道统一值序）
        const c = spawn(`<div x-spark x-spark-options="{type:'ripple',spin:true,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(c.root).classList.contains("x-spark-spin")).toBe(true);

        // ④ 显式 false 压制开关：{spin:false} → 回退默认 ripple（echo 双环类出现）
        const d = spawn(`<div x-spark x-spark-options="{spin:false,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(d.root).classList.contains("x-spark-spin")).toBe(false);
        expect(hostOf(d.root).classList.contains("x-spark-echo")).toBe(true);
    });

    test("spin 效果族：beam 缺省形态 + 环宽缺省分流（size 4px）+ 匀速单环（无 echo 类）", async () => {
        const { root } = spawn(
            `<div x-spark x-spark-options="{type:'spin',speed:100}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-spin")).toBe(true);
        expect(host.classList.contains("x-spark-spin-beam")).toBe(true);
        expect(host.classList.contains("x-spark-on")).toBe(true); // 默认 always 恒转
        expect(host.classList.contains("x-spark-echo")).toBe(false);
        expect(host.style.getPropertyValue("--x-spark-size")).toBe("4px"); // 环宽缺省（涟漪为 12）
        expect(host.style.getPropertyValue("--x-spark-duration")).toBe("100ms"); // gap 恒 0
    });

    test("spin 形态声明：spinMode beam/chase 形态类落位，交叉声明 rippleMode warn 忽略", async () => {
        const a = spawn(`<div x-spark x-spark-options="{type:'spin',spinMode:'beam',speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(a.root).classList.contains("x-spark-spin-beam")).toBe(true);

        const b = spawn(`<div x-spark x-spark-options="{type:'spin',spinMode:'chase',speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(b.root).classList.contains("x-spark-spin-chase")).toBe(true);

        // ripple 下声明 spinMode：效果专属键交叉 warn 忽略（无 spin 类）
        const c = spawn(`<div x-spark x-spark-options="{spinMode:'beam',speed:50}"></div>`, {});
        const ch = hostOf(c.root);
        await twoFrames();
        expect(ch.classList.contains("x-spark-spin")).toBe(false);
        expect(ch.classList.contains("x-spark-spin-beam")).toBe(false);
        expect(ch.classList.contains("x-spark-echo")).toBe(true); // 涟漪缺省 echo 不受影响
    });

    test("spin click 触发：点击转一圈播完即停（单周期语义与 ripple click 严格对齐）", async () => {
        const { root } = spawn(
            `<div x-spark.spin.click x-spark-options="{speed:60}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames(); // 预探测定形态：spin 标记类落位、激活类不出现
        expect(host.classList.contains("x-spark-spin")).toBe(true);
        expect(host.classList.contains("x-spark-on")).toBe(false);

        host.click(); // 点击转一圈
        expect(host.classList.contains("x-spark-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 160)); // 一圈（60ms）末自动收口
        expect(host.classList.contains("x-spark-on")).toBe(false);

        host.click(); // 再点重播一圈
        expect(host.classList.contains("x-spark-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 160));
        expect(host.classList.contains("x-spark-on")).toBe(false);
    });

    test("spin 降级载体：子元素层为环带载体（mask 环带 + 直连角度变量的渐变，无涟漪双环）", async () => {
        probeSpy.mockImplementation(() => true); // 模拟宿主 ::after 已被占用
        const { root } = spawn(
            `<div x-spark x-spark-options="{type:'spin',spinMode:'beam',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        const layers = host.querySelectorAll(":scope > .x-spark-layer");
        expect(layers.length).toBe(1); // spin 恒单环（chase 双段在渐变内，非双载体）
        const layer = layers[0] as HTMLElement;
        expect(layer.style.animation).toContain("x-spark-rotate");
        expect(layer.style.animation).toContain("linear"); // 匀速（涟漪为 ease-out）
        expect(layer.style.padding).toBe("var(--x-spark-size)"); // 环带 = 环宽
        // 渐变直连角度变量（经未注册变量中转的间接链在部分 Chromium 上不触发重绘）
        expect(layer.style.background).toContain("conic-gradient(from var(--x-spark-angle)");
        expect(layer.style.background).toContain("30deg"); // beam 光束扇区模板
        expect(layer.style.cssText).toContain("content-box"); // mask 环带（content-box exclude 挖洞）
    });

    test("spin 渐变直连契约：三形态 background 直写角度变量，禁绝中转变量（paint 失效传播）", () => {
        const style = document.querySelector<HTMLStyleElement>("style[data-x-spark]");
        expect(style).not.toBeNull();
        const css = style?.textContent ?? "";
        // 经未注册变量中转的间接引用链在部分 Chromium 上不触发重绘（角度在跑而色环静止）
        expect(css).not.toContain("--x-spark-spin-bg");
        for (const mode of ["rotate", "beam", "chase"]) {
            expect(css).toContain(`.x-spark.x-spark-spin-${mode}.x-spark-on::after`);
        }
        expect(css.split("conic-gradient(from var(--x-spark-angle)").length - 1).toBe(3);
    });

    test("涟漪形态声明：rippleMode 显式 ring（原 type 键改名平移）", async () => {
        const { root } = spawn(
            `<div x-spark x-spark-options="{rippleMode:'ring',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-on")).toBe(true);
        expect(host.classList.contains("x-spark-echo")).toBe(false); // ring 单环
        expect(host.classList.contains("x-spark-spin")).toBe(false);
    });

    test("载体降级：伪元素被占用 → 注入 absolute 子元素（ring 单层 / echo 双层）", async () => {
        probeSpy.mockImplementation(() => true); // 模拟宿主 ::after 已被占用

        const { root: ringRoot } = spawn(
            `<div x-spark x-spark-options="{rippleMode:'ring',speed:50}"></div>`,
            {},
        );
        await twoFrames();
        const ringHost = hostOf(ringRoot);
        expect(ringHost.classList.contains("x-spark-on")).toBe(false); // 子元素形态不加激活类
        const ringLayers = ringHost.querySelectorAll(":scope > .x-spark-layer");
        expect(ringLayers.length).toBe(1);
        expect((ringLayers[0] as HTMLElement).style.position).toBe("absolute");
        expect((ringLayers[0] as HTMLElement).style.animation).toContain("infinite");

        const { root: echoRoot } = spawn(
            `<div x-spark x-spark-options="{rippleMode:'echo',speed:50}"></div>`,
            {},
        );
        await twoFrames();
        const echoLayers = hostOf(echoRoot).querySelectorAll(":scope > .x-spark-layer");
        expect(echoLayers.length).toBe(2);
        // 第二环负延迟半个周期（错相位）
        expect((echoLayers[1] as HTMLElement).style.animationDelay).toBe("-25ms");
    });

    test("echo 伪元素形态：激活类 + 双环标记（第二环负延迟经 CSS 变量）", async () => {
        const { root } = spawn(
            `<div x-spark x-spark-options="{rippleMode:'echo',speed:50,gap:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-on")).toBe(true);
        expect(host.classList.contains("x-spark-echo")).toBe(true);
        expect(host.style.getPropertyValue("--x-spark-duration")).toBe("100ms");
        expect(host.style.getPropertyValue("--x-spark-echo-delay")).toBe("-50ms");
    });

    test("badge 徽标：右上角正圆载体（宿主标记类 + 直径变量 + color 缺省联动语义红）", async () => {
        const { root } = spawn(`<div x-spark x-spark-options="{badge:true,speed:50}"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-badge")).toBe(true);
        expect(host.classList.contains("x-spark-on")).toBe(true); // badge 不改触发器语义（默认 always）
        expect(host.style.getPropertyValue("--x-spark-badge-size")).toBe("8px");
        expect(host.style.getPropertyValue("--x-spark-color")).toContain("--auto-danger-color");
    });

    test("badge 家族通用：spin 下徽标 = 角标圆内旋转环（badge+spin 标记类并存，语义红联动）", async () => {
        const { root } = spawn(
            `<div x-spark x-spark-options="{type:'spin',badge:true,speed:100}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-badge")).toBe(true);
        expect(host.classList.contains("x-spark-spin")).toBe(true);
        expect(host.classList.contains("x-spark-spin-beam")).toBe(true); // spinMode 缺省 beam
        expect(host.classList.contains("x-spark-on")).toBe(true);
        expect(host.style.getPropertyValue("--x-spark-color")).toContain("--auto-danger-color"); // 语义红联动全家族
        expect(host.style.getPropertyValue("--x-spark-badge-size")).toBe("8px");
    });

    test("badge 自定义直径与显式 color：数字直径生效，显式 color 恒优先于语义红", async () => {
        const { root } = spawn(
            `<div x-spark x-spark-options="{badge:16,color:'#10b981',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-badge")).toBe(true);
        expect(host.style.getPropertyValue("--x-spark-badge-size")).toBe("16px");
        expect(host.style.getPropertyValue("--x-spark-color")).toBe("#10b981");
    });

    test("badge 非法值：warn 后不启用（无标记类，color 维持主题主色缺省）", async () => {
        // 字符串 / 0 / 负数均非法（回退行为断言，对齐既有归一测试惯例不断言日志）
        const { root } = spawn(
            `<div x-spark x-spark-options="{badge:'big',size:12,speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-badge")).toBe(false);
        expect(host.style.getPropertyValue("--x-spark-badge-size")).toBe("");
        expect(host.style.getPropertyValue("--x-spark-color")).toContain("--auto-theme-color");
    });

    test("badge 降级载体：子元素层同样右上角正圆定位（内联样式承载）", async () => {
        probeSpy.mockImplementation(() => true);
        const { root } = spawn(`<div x-spark x-spark-options="{badge:12,speed:50}"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-badge")).toBe(true);
        const layer = host.querySelector(":scope > .x-spark-layer") as HTMLElement;
        expect(layer.style.top).toBe("-6px"); // 圆心恰在宿主右上角顶点
        expect(layer.style.right).toBe("-6px");
        expect(layer.style.width).toBe("12px");
        expect(layer.style.borderRadius).toBe("50%");
        expect(layer.style.zIndex).toBe("2147483647");
        expect(layer.style.background).toContain("--x-spark-color");
    });

    test("options 归一：非法枚举/数值回退默认生效（宽松策略不中断渲染）", async () => {
        // warn 发生在指令构造期（mount 内），此处断言回退行为而非日志：
        // 非法 type 'wave' 回退 ripple 默认（涟漪 echo 缺省形态可激活）、非法 trigger
        // 'press' 回退 always（立即循环）、非法 speed 0 回退 3000（duration 变量）
        const { root } = spawn(
            `<div x-spark x-spark-options="{type:'wave',trigger:'press',size:-5,speed:0,gap:'x'}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-on")).toBe(true); // trigger 'press' 非法回退 always → 立即循环
        expect(host.style.getPropertyValue("--x-spark-size")).toBe("12px");
        expect(host.style.getPropertyValue("--x-spark-duration")).toBe("3000ms");
        expect(root.querySelector(".x-spark-layer")).toBeNull(); // 渲染未中断
    });

    test("destroy 清理：摘激活类与宿主标记、移除降级载体", async () => {
        probeSpy.mockImplementation(() => true);
        const { root, engine } = spawn(`<div x-spark x-spark-options="{speed:50}"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.querySelector(":scope > .x-spark-layer")).not.toBeNull();

        engine.destroy();
        expect(host.classList.contains("x-spark")).toBe(false);
        expect(host.classList.contains("x-spark-on")).toBe(false);
        expect(host.querySelector(":scope > .x-spark-layer")).toBeNull();
    });

    test("destroy 清理：spin 形态类（spin + spinMode）一并摘除", async () => {
        const { root, engine } = spawn(
            `<div x-spark x-spark-options="{type:'spin',spinMode:'chase',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-spark-spin")).toBe(true);
        expect(host.classList.contains("x-spark-spin-chase")).toBe(true);

        engine.destroy();
        expect(host.classList.contains("x-spark-spin")).toBe(false);
        expect(host.classList.contains("x-spark-spin-chase")).toBe(false);
        expect(host.classList.contains("x-spark")).toBe(false);
    });
});
