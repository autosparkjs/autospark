import { describe, expect, test, afterEach, spyOn } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "autospark";
// 插件自举（ADR-0002）：模块加载即注册指令（共存用例需双指令在位）
import "../../plugins/x-ripple/index";
import "../../plugins/x-spin/index";
import { DecorateDirective } from "../../plugins/decorate/index";

/**
 * x-ripple 涟漪扩散指令单测（ADR-0007，自 x-spark 伞形拆分）：
 * - 注册：插件自举后 engine.directives 含 "ripple"；
 * - 值通道：无值恒开 / 字面 false 恒关 / 表达式 truthiness 响应式切换（转假播完当前周期再停）；
 * - 触发器：always 立即循环 / hover 悬停播放、移出周期末停止 / click 单周期播放，
 *   三通道等价并存按 hover > always > click 取先；
 * - 形态：type 回归形态键（ring/glow/echo，缺省 echo），三通道等价、并存按 glow > ring > echo
 *   取先（ADR-0007 决策 2），修饰符词表分流次序无关，跨指令键（x-spin 形态词表）warn 忽略；
 * - 载体：伪元素形态默认（宿主标记 + 激活类），探测占用降级子元素（echo 2 层 / 其余 1 层）；
 * - 徽标：badge（右上角正圆载体，波环自圆边扩散），color 缺省联动语义红；
 * - 配置：静态 options 归一，非法值 warn 回退（宽松策略不中断渲染）；
 * - 共存：x-ripple 与 x-spin 同宿主叠加（ADR-0007 决策 3，探测降级兜底零新增逻辑）；
 * - 清理：destroy 摘类、摘载体、断 hover。
 *
 * 测试环境注意：happy-dom 无真实 CSS 动画，断言聚焦类切换 / 内联样式 / DOM 结构等
 * 指令状态机的可观测副作用；伪元素探测经 DecorateDirective.probe 静态替换驱动降级路径
 * （两指令共享同一静态——spin 测试文件亦然，afterEach 复位防泄漏）。
 */

/** 等待一拍（setTimeout 0）：探测循环按拍推进（happy-dom 无渲染泵，rAF 不调度） */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
/** 等两拍：探测帧 + 激活帧稳定 */
const twoFrames = async () => {
    await tick();
    await tick();
};

describe("x-ripple 涟漪扩散指令（ADR-0007）", () => {
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
        document.querySelectorAll("[data-x-ripple-test-root]").forEach((n) => n.remove());
    });

    const spawn = (html: string, state: any = {}, options?: Parameters<typeof mount>[2]) => {
        const m = mount(html, state, options);
        spawned.push(m.engine);
        m.root.setAttribute("data-x-ripple-test-root", "");
        document.body.appendChild(m.root); // 宿主连接文档：探测循环需要 isConnected
        return m;
    };

    const hostOf = (root: HTMLElement) => root.firstElementChild as HTMLElement;

    test("插件自举：ripple 指令经安装器队列注册（参与首编译，构造期生效）", () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        expect(engine.directives.has("ripple")).toBe(true);
    });

    test("无值恒开：宿主标记类 + 激活类 + echo 双环标记 + 实例 CSS 变量落位（伪元素形态默认）", async () => {
        const { root } = spawn(`<div x-ripple style="border-radius:8px"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple")).toBe(true);
        expect(host.classList.contains("x-ripple-on")).toBe(true);
        expect(host.classList.contains("x-ripple-echo")).toBe(true); // 形态缺省 echo 双环
        expect(host.style.getPropertyValue("--x-ripple-echo-delay")).toBe("-1500ms"); // 错相位连锁（-周期/2）
        expect(host.style.getPropertyValue("--x-ripple-color")).toContain("--auto-theme-color");
        expect(host.style.getPropertyValue("--x-ripple-size")).toBe("12px");
        expect(host.style.getPropertyValue("--x-ripple-duration")).toBe("3000ms");
    });

    test("字面 false 恒关：不激活（标记类也不加——形态未探测定型）", async () => {
        const { root } = spawn(`<div x-ripple="false"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-on")).toBe(false);
        expect(host.classList.contains("x-ripple")).toBe(false);
    });

    test("表达式 truthiness：true 激活 → false 播完当前周期再停 → true 重启", async () => {
        const { root, engine } = spawn(
            `<div x-ripple="ui.show" x-ripple-options="{speed:50}"></div>`,
            { ui: { show: true } },
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-on")).toBe(true);

        // 转假：不打断在播周期（停止语义）——立即断言仍在播
        engine.state.ui.show = false;
        await nextTick();
        expect(host.classList.contains("x-ripple-on")).toBe(true);
        // 周期（50ms）结束后复位
        await new Promise((r) => setTimeout(r, 120));
        expect(host.classList.contains("x-ripple-on")).toBe(false);

        // 转真：重新启动
        engine.state.ui.show = true;
        await nextTick();
        expect(host.classList.contains("x-ripple-on")).toBe(true);
    });

    test("hover 触发：默认不激活，悬停播放、移出周期末停止", async () => {
        const { root } = spawn(
            `<div x-ripple x-ripple-options="{trigger:'hover',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-on")).toBe(false);

        host.dispatchEvent(new Event("mouseenter"));
        expect(host.classList.contains("x-ripple-on")).toBe(true);

        // 移出：播完当前周期（≤50ms）后停止
        host.dispatchEvent(new Event("mouseleave"));
        expect(host.classList.contains("x-ripple-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 120));
        expect(host.classList.contains("x-ripple-on")).toBe(false);
    });

    test("click 触发：初始不播，点击播一个完整周期后自动收口，再点重播", async () => {
        const { root } = spawn(
            `<div x-ripple x-ripple-options="{trigger:'click',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames(); // 预探测定形态（marker 类落位，激活类不出现）
        expect(host.classList.contains("x-ripple")).toBe(true);
        expect(host.classList.contains("x-ripple-on")).toBe(false);

        host.click(); // 点击即播（一个完整周期）
        expect(host.classList.contains("x-ripple-on")).toBe(true);
        // echo+click 双环一次起波：第二环与主环**同时**起波（delay 0——任何非零错位都会呈现
        // 第二道波峰，观感「执行两遍」），双环区分走尺寸通道（0.6× 同心缩小），同拍收束
        expect(host.style.getPropertyValue("--x-ripple-echo-delay")).toBe("0ms");
        expect(host.style.getPropertyValue("--x-ripple-echo-size")).toBe("7.2px");
        await new Promise((r) => setTimeout(r, 120)); // 收口窗（整周期 50ms，含静止段）末自动停止
        expect(host.classList.contains("x-ripple-on")).toBe(false);

        host.click(); // 再点重播
        expect(host.classList.contains("x-ripple-on")).toBe(true);
        await new Promise((r) => setTimeout(r, 120));
        expect(host.classList.contains("x-ripple-on")).toBe(false);
    });

    test("触发器三通道：修饰符/布尔键/trigger 键等价，并存按 hover > always > click 取先", async () => {
        // ① 修饰符通道：x-ripple.hover 等价 trigger:'hover'（初始不播，悬停播放）
        const a = spawn(`<div x-ripple.hover x-ripple-options="{speed:50}"></div>`, {});
        const ah = hostOf(a.root);
        await twoFrames();
        expect(ah.classList.contains("x-ripple-on")).toBe(false);
        ah.dispatchEvent(new Event("mouseenter"));
        expect(ah.classList.contains("x-ripple-on")).toBe(true);

        // ② 布尔键通道：{click:true} ≡ trigger:'click'（点击播一个完整周期）
        const b = spawn(`<div x-ripple x-ripple-options="{click:true,speed:50}"></div>`, {});
        const bh = hostOf(b.root);
        await twoFrames();
        expect(bh.classList.contains("x-ripple-on")).toBe(false);
        bh.click();
        expect(bh.classList.contains("x-ripple-on")).toBe(true);

        // ③ 并存取先（跨通道统一值序）：hover 胜 click——判别器：click 语义下点击会播，hover 语义下点击无效
        const c = spawn(`<div x-ripple x-ripple-options="{hover:true,click:true,speed:50}"></div>`, {});
        const ch = hostOf(c.root);
        await twoFrames();
        ch.click();
        expect(ch.classList.contains("x-ripple-on")).toBe(false);

        // ④ trigger 显式键同样不敌先序值：trigger:'click' + hover:true → hover 胜出
        const d = spawn(`<div x-ripple x-ripple-options="{trigger:'click',hover:true,speed:50}"></div>`, {});
        const dh = hostOf(d.root);
        await twoFrames();
        dh.click();
        expect(dh.classList.contains("x-ripple-on")).toBe(false);

        // ⑤ 显式 false 压制开关：{hover:false} → 无候选，回退默认 always（自动播放）
        const e = spawn(`<div x-ripple x-ripple-options="{hover:false,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(e.root).classList.contains("x-ripple-on")).toBe(true);
    });

    test("形态三通道：修饰符/布尔键/type 键等价，并存按 glow > ring > echo 取先（缺省 echo）", async () => {
        // 动画名 = x-ripple-<type>-<speed>-<gap>（参数组合 keyframes 经 --x-ripple-anim 落位），
        // happy-dom 无 CSS 动画下形态的的可观测通道
        // ① 修饰符通道：x-ripple.glow ≡ type:'glow'
        const a = spawn(`<div x-ripple.glow x-ripple-options="{speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(a.root).style.getPropertyValue("--x-ripple-anim")).toBe("x-ripple-glow-50-0");

        // ② 布尔键通道：{ring:true} ≡ type:'ring'
        const b = spawn(`<div x-ripple x-ripple-options="{ring:true,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(b.root).style.getPropertyValue("--x-ripple-anim")).toBe("x-ripple-ring-50-0");
        expect(hostOf(b.root).classList.contains("x-ripple-echo")).toBe(false); // ring 单环

        // ③ 并存取先（缺省垫底 + 枚举声明序）：{type:'ring', glow:true} → glow 胜出
        const c = spawn(`<div x-ripple x-ripple-options="{type:'ring',glow:true,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(c.root).style.getPropertyValue("--x-ripple-anim")).toBe("x-ripple-glow-50-0");

        // ④ {ring:true, echo:true} → ring 胜出（glow 未声明）
        const d = spawn(`<div x-ripple x-ripple-options="{ring:true,echo:true,speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(d.root).style.getPropertyValue("--x-ripple-anim")).toBe("x-ripple-ring-50-0");

        // ⑤ 非法 type 回退缺省 echo（宽松策略）
        const e = spawn(`<div x-ripple x-ripple-options="{type:'wave',speed:50}"></div>`, {});
        await twoFrames();
        expect(hostOf(e.root).style.getPropertyValue("--x-ripple-anim")).toBe("x-ripple-echo-50-0");
        expect(hostOf(e.root).classList.contains("x-ripple-echo")).toBe(true);
    });

    test("修饰符词表分流、次序无关：x-ripple.click.glow ≡ x-ripple.glow.click（形态/触发器词表按段归类）", async () => {
        // 两序均解析为 {glow:true, click:true}：click 语义（初始不播）+ glow 动画名
        const a = spawn(`<div x-ripple.click.glow x-ripple-options="{speed:50}"></div>`, {});
        const b = spawn(`<div x-ripple.glow.click x-ripple-options="{speed:50}"></div>`, {});
        await twoFrames();
        const ah = hostOf(a.root);
        const bh = hostOf(b.root);
        expect(ah.style.getPropertyValue("--x-ripple-anim")).toBe("x-ripple-glow-50-0");
        expect(bh.style.getPropertyValue("--x-ripple-anim")).toBe("x-ripple-glow-50-0");
        expect(ah.classList.contains("x-ripple-on")).toBe(false); // click 语义：初始不播
        expect(bh.classList.contains("x-ripple-on")).toBe(false);

        ah.click(); // 点击播一个完整周期（click 触发生效，次序无关）
        expect(ah.classList.contains("x-ripple-on")).toBe(true);
    });

    test("跨指令键 warn 忽略：声明 x-spin 形态词表不中断渲染（缺省 echo 恒开不受影响）", async () => {
        const { root } = spawn(
            `<div x-ripple x-ripple-options="{beam:true,speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        // beam 是 x-spin 的形态键：warn 忽略（宽松策略一致），涟漪照常缺省 echo 播放
        expect(host.classList.contains("x-ripple-on")).toBe(true);
        expect(host.classList.contains("x-ripple-echo")).toBe(true);
        expect(root.querySelector(".x-ripple-layer")).toBeNull(); // 渲染未中断（伪元素形态）
    });

    test("gap 静止段：烘进周期（duration = speed + gap），echo 错相位随之连锁", async () => {
        const { root } = spawn(
            `<div x-ripple x-ripple-options="{speed:50,gap:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-on")).toBe(true);
        expect(host.classList.contains("x-ripple-echo")).toBe(true);
        expect(host.style.getPropertyValue("--x-ripple-duration")).toBe("100ms");
        expect(host.style.getPropertyValue("--x-ripple-echo-delay")).toBe("-50ms"); // -周期/2
    });

    test("载体降级：伪元素被占用 → 注入 absolute 子元素（ring 单层 / echo 双层）", async () => {
        probeSpy.mockImplementation(() => true); // 模拟宿主 ::after 已被占用

        const { root: ringRoot } = spawn(
            `<div x-ripple x-ripple-options="{type:'ring',speed:50}"></div>`,
            {},
        );
        await twoFrames();
        const ringHost = hostOf(ringRoot);
        expect(ringHost.classList.contains("x-ripple-on")).toBe(false); // 子元素形态不加激活类
        const ringLayers = ringHost.querySelectorAll(":scope > .x-ripple-layer");
        expect(ringLayers.length).toBe(1);
        expect((ringLayers[0] as HTMLElement).style.position).toBe("absolute");
        expect((ringLayers[0] as HTMLElement).style.animation).toContain("infinite");

        const { root: echoRoot } = spawn(
            `<div x-ripple x-ripple-options="{type:'echo',speed:50}"></div>`,
            {},
        );
        await twoFrames();
        const echoLayers = hostOf(echoRoot).querySelectorAll(":scope > .x-ripple-layer");
        expect(echoLayers.length).toBe(2);
        // 第二环负延迟半个周期（错相位）
        expect((echoLayers[1] as HTMLElement).style.animationDelay).toBe("-25ms");
    });

    test("badge 徽标：右上角正圆载体（宿主标记类 + 直径变量 + color 缺省联动语义红）", async () => {
        const { root } = spawn(`<div x-ripple x-ripple-options="{badge:true,speed:50}"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-badge")).toBe(true);
        expect(host.classList.contains("x-ripple-on")).toBe(true); // badge 不改触发器语义（默认 always）
        expect(host.style.getPropertyValue("--x-ripple-badge-size")).toBe("8px");
        expect(host.style.getPropertyValue("--x-ripple-color")).toContain("--auto-danger-color");
    });

    test("badge 自定义直径与显式 color：数字直径生效，显式 color 恒优先于语义红", async () => {
        const { root } = spawn(
            `<div x-ripple x-ripple-options="{badge:16,color:'#10b981',speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-badge")).toBe(true);
        expect(host.style.getPropertyValue("--x-ripple-badge-size")).toBe("16px");
        expect(host.style.getPropertyValue("--x-ripple-color")).toBe("#10b981");
    });

    test("badge 非法值：warn 后不启用（无标记类，color 维持主题主色缺省）", async () => {
        // 字符串 / 0 / 负数均非法（回退行为断言，对齐既有归一测试惯例不断言日志）
        const { root } = spawn(
            `<div x-ripple x-ripple-options="{badge:'big',size:12,speed:50}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-badge")).toBe(false);
        expect(host.style.getPropertyValue("--x-ripple-badge-size")).toBe("");
        expect(host.style.getPropertyValue("--x-ripple-color")).toContain("--auto-theme-color");
    });

    test("badge 降级载体：子元素层同样右上角正圆定位（内联样式承载）", async () => {
        probeSpy.mockImplementation(() => true);
        const { root } = spawn(`<div x-ripple x-ripple-options="{badge:12,speed:50}"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-badge")).toBe(true);
        const layer = host.querySelector(":scope > .x-ripple-layer") as HTMLElement;
        expect(layer.style.top).toBe("-6px"); // 圆心恰在宿主右上角顶点
        expect(layer.style.right).toBe("-6px");
        expect(layer.style.width).toBe("12px");
        expect(layer.style.borderRadius).toBe("50%");
        expect(layer.style.zIndex).toBe("2147483647");
        expect(layer.style.background).toContain("--x-ripple-color");
    });

    test("options 归一：非法枚举/数值回退默认生效（宽松策略不中断渲染）", async () => {
        // warn 发生在指令构造期（mount 内），此处断言回退行为而非日志：
        // 非法 type 'wave' 回退 echo 缺省形态可激活、非法 trigger 'press' 回退 always
        //（立即循环）、非法 size -5 / speed 0 / gap 'x' 回退默认（duration 变量）
        const { root } = spawn(
            `<div x-ripple x-ripple-options="{type:'wave',trigger:'press',size:-5,speed:0,gap:'x'}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoFrames();
        expect(host.classList.contains("x-ripple-on")).toBe(true); // trigger 'press' 非法回退 always → 立即循环
        expect(host.style.getPropertyValue("--x-ripple-size")).toBe("12px");
        expect(host.style.getPropertyValue("--x-ripple-duration")).toBe("3000ms");
        expect(root.querySelector(".x-ripple-layer")).toBeNull(); // 渲染未中断
    });

    test("同宿主共存：x-ripple 与 x-spin 叠加互不干扰（探测降级兜底，ADR-0007 决策 3）", async () => {
        // ① 伪元素形态共存：两指令各自加宿主标记与激活类（::after 冲突由 CSS 层叠语义承担，
        //    指令层零新增检测逻辑）
        const { root: pseudoRoot } = spawn(
            `<div x-ripple x-spin x-ripple-options="{speed:50}" x-spin-options="{speed:50}"></div>`,
            {},
        );
        const pseudoHost = hostOf(pseudoRoot);
        await twoFrames();
        expect(pseudoHost.classList.contains("x-ripple")).toBe(true);
        expect(pseudoHost.classList.contains("x-ripple-on")).toBe(true);
        expect(pseudoHost.classList.contains("x-spin")).toBe(true);
        expect(pseudoHost.classList.contains("x-spin-on")).toBe(true);

        // ② 降级形态共存：伪元素被占用 → 涟漪双环（2 层）+ 色环（1 层）并存
        probeSpy.mockImplementation(() => true);
        const { root: elementRoot } = spawn(
            `<div x-ripple x-spin x-ripple-options="{type:'ring',speed:50}" x-spin-options="{speed:50}"></div>`,
            {},
        );
        const elementHost = hostOf(elementRoot);
        await twoFrames();
        const rippleLayers = elementHost.querySelectorAll(":scope > .x-ripple-layer");
        const spinLayers = elementHost.querySelectorAll(":scope > .x-spin-layer");
        expect(rippleLayers.length).toBe(1);
        expect(spinLayers.length).toBe(1);
        expect((rippleLayers[0] as HTMLElement).style.animation).toContain("ease-out"); // 涟漪波周期
        expect((spinLayers[0] as HTMLElement).style.animation).toContain("linear"); // 色环匀速
        expect((spinLayers[0] as HTMLElement).style.animation).toContain("x-spin-angle");
    });

    test("destroy 清理：摘激活类与宿主标记、移除降级载体", async () => {
        probeSpy.mockImplementation(() => true);
        const { root, engine } = spawn(`<div x-ripple x-ripple-options="{speed:50}"></div>`, {});
        const host = hostOf(root);
        await twoFrames();
        expect(host.querySelector(":scope > .x-ripple-layer")).not.toBeNull();

        engine.destroy();
        expect(host.classList.contains("x-ripple")).toBe(false);
        expect(host.classList.contains("x-ripple-on")).toBe(false);
        expect(host.querySelector(":scope > .x-ripple-layer")).toBeNull();
    });
});
