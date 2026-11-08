import { describe, expect, test, afterEach, spyOn } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "autospark";
// 插件自举（ADR-0013）：模块加载即注册指令
import { ScrollbarDirective } from "../../directives/x-scrollbar/index";

/**
 * x-scrollbar 滚动条皮肤指令单测（ADR-0013）：
 * - 注册：插件自举后 engine.directives 含 "scrollbar"；
 * - 值通道：无值恒开 / 字面 false 恒关 / 表达式 truthiness 响应式切换（转假摘轨道
 *   与宿主类——原生滚动条回归；转真重挂）；
 * - 方向：双向自动按需（仅纵向溢出只激活 y / 双向溢出双激活 / 不溢出全不激活），
 *   `.x`/`.y` 修饰符限定单向；
 * - 几何：thumb 长度 = client/scroll 比例 × 轨道长（minSize 兜底）、位置 = 滚动进度
 *   × 剩余空隙；scroll 事件同步跟手；
 * - 显隐：mouseenter 渐显（visible 类）/ mouseleave 延迟渐隐（delay 可配，再入清定时器）；
 * - 交互：thumb 拖拽（Pointer Events 反写 scrollTop，位移按轨道/滑块长度比换算）、
 *   轨道点击跳页（点击点在滑块上侧向上翻 / 下侧向下翻）；
 * - 配置：静态 options 归一落 CSS 变量，非法值 warn 回退默认（宽松策略不中断渲染）；
 * - 清理：engine.destroy / 动态删属性——摘轨道、摘宿主类、清状态。
 *
 * 测试环境注意：happy-dom 无布局引擎与真实 CSS 过渡，断言聚焦类切换 / DOM 结构 /
 * 内联样式 / scrollTop 反写等指令状态机的可观测副作用；几何经 defineProperty 遮蔽
 * 只读尺寸属性 mock（x-ripple mockGeom 同模式），scrollTop/scrollLeft happy-dom
 * 原生可写可读无需 mock。
 */

/** 等待一拍（setTimeout 0）：setup 的延迟首算与 observer 路由按拍推进 */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
/** 等两拍：挂载 + 首算稳定 */
const twoTicks = async () => {
    await tick();
    await tick();
};

/** 几何 mock：defineProperty 遮蔽只读尺寸/位置属性（happy-dom 无布局引擎全 0） */
function mockGeom(el: HTMLElement, geom: Record<string, number>): void {
    for (const [key, value] of Object.entries(geom)) {
        Object.defineProperty(el, key, { get: () => value, configurable: true });
    }
}

/** getBoundingClientRect mock（轨道点击的坐标换算依赖；happy-dom 默认全 0 rect 也合法，显式给值断言友好） */
function mockRect(
    el: HTMLElement,
    rect: { top?: number; left?: number; right?: number; bottom?: number },
): void {
    const base = el.getBoundingClientRect();
    Object.defineProperty(el, "getBoundingClientRect", {
        value: () => ({ ...base, ...rect }),
        configurable: true,
    });
}

/** 派发 PointerEvent（happy-dom 构造器支持 pointerId/button/clientY 等 init） */
function pointer(type: string, init: Record<string, unknown>): PointerEvent {
    return new PointerEvent(type, { bubbles: true, ...init } as PointerEventInit);
}

describe("x-scrollbar 滚动条皮肤指令（ADR-0013）", () => {
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
        document.querySelectorAll("[data-x-scrollbar-test-root]").forEach((n) => n.remove());
    });

    const spawn = (html: string, state: any = {}, options?: Parameters<typeof mount>[2]) => {
        const m = mount(html, state, options);
        spawned.push(m.engine);
        m.root.setAttribute("data-x-scrollbar-test-root", "");
        document.body.appendChild(m.root); // 宿主连接文档：几何 mock 在连接后有效
        return m;
    };

    const hostOf = (root: HTMLElement) => root.firstElementChild as HTMLElement;
    const railYOf = (host: HTMLElement) =>
        host.querySelector(".x-scrollbar-rail-y") as HTMLElement;
    const railXOf = (host: HTMLElement) =>
        host.querySelector(".x-scrollbar-rail-x") as HTMLElement;
    const thumbYOf = (host: HTMLElement) =>
        host.querySelector(".x-scrollbar-rail-y .x-scrollbar-thumb") as HTMLElement;

    /** 标准纵向溢出宿主：可视 200 / 内容 600（横向不溢出 300/300），轨道长 300 */
    function mockOverflowY(host: HTMLElement, railY: HTMLElement): void {
        mockGeom(host, { clientHeight: 200, scrollHeight: 600, clientWidth: 300, scrollWidth: 300 });
        mockGeom(railY, { offsetHeight: 300 });
    }

    test("插件自举：scrollbar 指令经安装器队列注册（参与首编译，构造期生效）", () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        expect(engine.directives.has("scrollbar")).toBe(true);
    });

    test("无值恒开：宿主标记类 + 双向轨道注入 + 实例 CSS 变量落位", async () => {
        const { root } = spawn(`<div x-scrollbar style="height:200px;overflow:auto"></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        expect(host.classList.contains("x-scrollbar")).toBe(true); // 原生滚动条隐藏开关
        expect(railYOf(host)).toBeTruthy(); // rail 直挂宿主（不 reparent）
        expect(railXOf(host)).toBeTruthy(); // 双向恒建，display 由激活类控制
        expect(host.querySelector(".x-scrollbar-rail-y .x-scrollbar-thumb")).toBeTruthy();
        expect(host.style.getPropertyValue("--x-scrollbar-width")).toBe("12px");
        expect(host.style.getPropertyValue("--x-scrollbar-thumb")).toBe("5px");
        expect(host.style.getPropertyValue("--x-scrollbar-fade")).toBe("200ms");
        expect(host.style.getPropertyValue("--x-scrollbar-color")).toContain(
            "--autospark-scrollbar-color",
        );
    });

    test("字面 false 恒关：无宿主类、无轨道（原生滚动条保留）", async () => {
        const { root } = spawn(`<div x-scrollbar="false"></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        expect(host.classList.contains("x-scrollbar")).toBe(false);
        expect(railYOf(host)).toBeFalsy();
        expect(railXOf(host)).toBeFalsy();
    });

    test("表达式 truthiness：转假摘轨道与宿主类（原生条回归）→ 转真重挂", async () => {
        const { root, engine } = spawn(`<div x-scrollbar="ui.on"></div>`, { ui: { on: true } });
        const host = hostOf(root);
        await twoTicks();
        expect(host.classList.contains("x-scrollbar")).toBe(true);
        expect(railYOf(host)).toBeTruthy();

        engine.state.ui.on = false;
        await nextTick();
        expect(host.classList.contains("x-scrollbar")).toBe(false);
        expect(railYOf(host)).toBeFalsy(); // 轨道 DOM 摘除——原生滚动条回归

        engine.state.ui.on = true;
        await nextTick();
        expect(host.classList.contains("x-scrollbar")).toBe(true);
        expect(railYOf(host)).toBeTruthy();
    });

    test("方向自动按需：仅纵向溢出只激活 y，横向轨道 display 由激活类压制", async () => {
        const { root } = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        mockOverflowY(host, railYOf(host));
        host.dispatchEvent(new Event("mouseenter")); // enter 强刷（三件套之二）
        expect(host.classList.contains("x-scrollbar-active-y")).toBe(true);
        expect(host.classList.contains("x-scrollbar-active-x")).toBe(false);
    });

    test("双向溢出双激活；不溢出全不激活", async () => {
        const both = spawn(`<div x-scrollbar></div>`, {});
        const hostB = hostOf(both.root);
        await twoTicks();
        mockGeom(hostB, { clientHeight: 200, scrollHeight: 600, clientWidth: 300, scrollWidth: 700 });
        mockGeom(railYOf(hostB), { offsetHeight: 300 });
        mockGeom(railXOf(hostB), { offsetWidth: 290 });
        hostB.dispatchEvent(new Event("mouseenter"));
        expect(hostB.classList.contains("x-scrollbar-active-y")).toBe(true);
        expect(hostB.classList.contains("x-scrollbar-active-x")).toBe(true);

        const none = spawn(`<div x-scrollbar></div>`, {});
        const hostN = hostOf(none.root);
        await twoTicks();
        mockGeom(hostN, { clientHeight: 200, scrollHeight: 200, clientWidth: 300, scrollWidth: 300 });
        hostN.dispatchEvent(new Event("mouseenter"));
        expect(hostN.classList.contains("x-scrollbar-active-y")).toBe(false);
        expect(hostN.classList.contains("x-scrollbar-active-x")).toBe(false);
    });

    test("`.y` 修饰符限定单向：横向溢出也不激活 x", async () => {
        const { root } = spawn(`<div x-scrollbar.y></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        mockGeom(host, { clientHeight: 200, scrollHeight: 200, clientWidth: 300, scrollWidth: 700 });
        host.dispatchEvent(new Event("mouseenter"));
        expect(host.classList.contains("x-scrollbar-active-y")).toBe(false); // 纵向未溢出
        expect(host.classList.contains("x-scrollbar-active-x")).toBe(false); // 修饰符限定了 y
    });

    test("thumb 几何：长度 = 比例 × 轨道长（minSize 兜底）、位置 = 滚动进度 × 空隙", async () => {
        const { root } = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        const railY = railYOf(host);
        const thumbY = thumbYOf(host);
        mockOverflowY(host, railY);
        host.dispatchEvent(new Event("mouseenter"));
        // 200/600 × 300 = 100；scrollTop 0 → top 0
        expect(thumbY.style.height).toBe("100px");
        expect(thumbY.style.top).toBe("0px");

        // 滚动到中部：scrollTop 200 / maxScroll 400 → top = 0.5 × (300-100) = 100
        host.scrollTop = 200;
        host.dispatchEvent(new Event("scroll"));
        expect(thumbY.style.top).toBe("100px");
    });

    test("minSize 兜底：内容远超可视（比例 thumb 过短）时钳到最小长度", async () => {
        const { root } = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        const railY = railYOf(host);
        mockGeom(host, { clientHeight: 100, scrollHeight: 10000, clientWidth: 300, scrollWidth: 300 });
        mockGeom(railY, { offsetHeight: 300 });
        host.dispatchEvent(new Event("mouseenter"));
        expect(thumbYOf(host).style.height).toBe("20px"); // 比例 3px → minSize 20 兜底
    });

    test("显隐：enter 渐显，leave 延迟渐隐，延迟窗口内再入清定时器不渐隐", async () => {
        const { root } = spawn(`<div x-scrollbar x-scrollbar-options="{delay:20}"></div>`, {});
        const host = hostOf(root);
        await twoTicks();

        host.dispatchEvent(new Event("mouseenter"));
        expect(host.classList.contains("x-scrollbar-visible")).toBe(true);

        host.dispatchEvent(new Event("mouseleave"));
        await new Promise((r) => setTimeout(r, 5)); // 延迟窗口内
        host.dispatchEvent(new Event("mouseenter")); // 再入：清渐隐定时器
        await new Promise((r) => setTimeout(r, 40));
        expect(host.classList.contains("x-scrollbar-visible")).toBe(true);

        host.dispatchEvent(new Event("mouseleave"));
        await new Promise((r) => setTimeout(r, 60)); // 过延迟
        expect(host.classList.contains("x-scrollbar-visible")).toBe(false);
    });

    test("thumb 拖拽：位移按轨道/滑块长度比换算反写 scrollTop，位置跟手", async () => {
        const { root } = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        const railY = railYOf(host);
        const thumbY = thumbYOf(host);
        mockOverflowY(host, railY);
        mockGeom(thumbY, { offsetHeight: 100 }); // 拖起时滑块长快照
        mockRect(host, { top: 0, left: 0, right: 300, bottom: 200 });
        host.dispatchEvent(new Event("mouseenter"));

        thumbY.dispatchEvent(pointer("pointerdown", { pointerId: 1, button: 0, clientY: 50 }));
        expect(thumbY.classList.contains("x-scrollbar-thumb-drag")).toBe(true); // 拖拽增粗类

        // delta 75 / 可拖动 200 × maxScroll 400 = 150
        thumbY.dispatchEvent(pointer("pointermove", { pointerId: 1, clientY: 125 }));
        expect(host.scrollTop).toBe(150);
        expect(thumbY.style.top).toBe("75px"); // 150/400 × 200

        thumbY.dispatchEvent(pointer("pointerup", { pointerId: 1, clientY: 125 }));
        expect(thumbY.classList.contains("x-scrollbar-thumb-drag")).toBe(false);
        expect(host.classList.contains("x-scrollbar-visible")).toBe(true); // 指针仍在宿主内：维持显示
    });

    test("双向拖拽对轴钉回：拖横滑块时纵轨补偿 transform 跟随（对向轨道不被带走）", async () => {
        const { root } = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        const railY = railYOf(host);
        const railX = railXOf(host);
        const thumbX = railX.querySelector(".x-scrollbar-thumb") as HTMLElement;
        // 双向溢出：纵 200/600、横 300/900；轨道长均 300
        mockGeom(host, { clientHeight: 200, scrollHeight: 600, clientWidth: 300, scrollWidth: 900 });
        mockGeom(railY, { offsetHeight: 300 });
        mockGeom(railX, { offsetWidth: 300 });
        mockGeom(thumbX, { offsetWidth: 100 }); // 拖起时滑块长快照
        mockRect(host, { top: 0, left: 0, right: 300, bottom: 200 });
        host.dispatchEvent(new Event("mouseenter"));
        expect(railY.style.transform).toBe("translate(0px, 0px)"); // 拖拽前基准

        thumbX.dispatchEvent(pointer("pointerdown", { pointerId: 1, button: 0, clientX: 50 }));
        // delta 75 / 可拖动 200 × maxScroll 600 = 225 → scrollLeft 225
        thumbX.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: 125 }));
        expect(host.scrollLeft).toBe(225);
        // 本轴轨道与对向轨道的钉回补偿都必须更新——scroll 事件被拖拽守卫挡掉，
        // 对向补偿只能由 dragMove 驱动（修复前 railY 停留 translate(0px, 0px) 被横向滚动带走）
        expect(railX.style.transform).toBe("translate(225px, 0px)");
        expect(railY.style.transform).toBe("translate(225px, 0px)");
        // 纵轴滚动位置未动：纵滑块几何不变
        const thumbY = thumbYOf(host);
        expect(thumbY.style.top).toBe("0px");

        thumbX.dispatchEvent(pointer("pointerup", { pointerId: 1, clientX: 125 }));
    });

    test("轨道点击跳页：点击点在滑块下侧向下翻一容器高", async () => {
        const { root } = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        const railY = railYOf(host);
        const thumbY = thumbYOf(host);
        mockOverflowY(host, railY);
        mockGeom(thumbY, { offsetTop: 40 }); // 当前滑块顶部位置
        mockRect(railY, { top: 0 });
        host.dispatchEvent(new Event("mouseenter"));

        // clientY 250 > thumbTop 40 → 向下翻一页（clientHeight 200）
        railY.dispatchEvent(pointer("pointerdown", { pointerId: 1, button: 0, clientY: 250 }));
        expect(host.scrollTop).toBe(200);
    });

    test("wheel 接管：preventDefault + rAF 平滑逼近目标，滚动位与补偿同帧收敛", async () => {
        // happy-dom 无渲染泵 rAF 不调度——帧调度替换为 setTimeout 拍驱动（类静态可测注入）
        const frameSpy = spyOn(ScrollbarDirective, "scheduleFrame").mockImplementation(
            (cb) => setTimeout(() => cb(performance.now()), 0) as unknown as number,
        );
        try {
            const { root } = spawn(`<div x-scrollbar></div>`, {});
            const host = hostOf(root);
            await twoTicks();
            const railY = railYOf(host);
            mockOverflowY(host, railY); // 可视 200 / 内容 600 → maxScroll 400
            host.dispatchEvent(new Event("mouseenter"));

            const ev = new WheelEvent("wheel", { deltaY: 120, cancelable: true });
            host.dispatchEvent(ev);
            expect(ev.defaultPrevented).toBe(true); // 接管（同步滚动空窗根治的前提）
            // 0.25/帧指数收敛：~20 帧内到目标 120
            for (let i = 0; i < 30 && host.scrollTop < 120; i++) await tick();
            expect(host.scrollTop).toBe(120);
            expect(railY.style.transform).toBe("translate(0px, 120px)"); // 补偿与滚动位同步落位
        } finally {
            frameSpy.mockRestore();
        }
    });

    test("wheel 边界放行：已滚到底再向下滚不接管（交还父级冒泡滚动）", async () => {
        const { root } = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        mockOverflowY(host, railYOf(host));
        host.dispatchEvent(new Event("mouseenter"));
        host.scrollTop = 400; // maxScroll 底

        const ev = new WheelEvent("wheel", { deltaY: 120, cancelable: true });
        host.dispatchEvent(ev);
        expect(ev.defaultPrevented).toBe(false);
    });

    test("wheel 缩放手势放行：ctrlKey 不接管（浏览器级缩放不受影响）", async () => {
        const { root } = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        mockOverflowY(host, railYOf(host));
        host.dispatchEvent(new Event("mouseenter"));

        const ev = new WheelEvent("wheel", { deltaY: 120, ctrlKey: true, cancelable: true });
        host.dispatchEvent(ev);
        expect(ev.defaultPrevented).toBe(false);
    });

    test("配置归一：options 落 CSS 变量；非法值回退默认", async () => {
        const { root } = spawn(
            `<div x-scrollbar x-scrollbar-options="{width:20,thumbWidth:8,color:'#f00',fadeDuration:120}"></div>`,
            {},
        );
        const host = hostOf(root);
        await twoTicks();
        expect(host.style.getPropertyValue("--x-scrollbar-width")).toBe("20px");
        expect(host.style.getPropertyValue("--x-scrollbar-thumb")).toBe("8px");
        expect(host.style.getPropertyValue("--x-scrollbar-color")).toBe("#f00");
        expect(host.style.getPropertyValue("--x-scrollbar-fade")).toBe("120ms");

        const bad = spawn(
            `<div x-scrollbar x-scrollbar-options="{width:'abc',delay:-1}"></div>`,
            {},
        );
        const hostBad = hostOf(bad.root);
        await twoTicks();
        expect(hostBad.style.getPropertyValue("--x-scrollbar-width")).toBe("12px"); // 回退默认
    });

    test("卸载清理：engine.destroy 摘轨道与宿主类", async () => {
        const m = spawn(`<div x-scrollbar></div>`, {});
        const host = hostOf(m.root);
        await twoTicks();
        expect(railYOf(host)).toBeTruthy();
        m.engine.destroy();
        expect(host.classList.contains("x-scrollbar")).toBe(false);
        expect(railYOf(host)).toBeFalsy();
    });

    test("运行时动态挂载：setAttribute 生效、removeAttribute 即失效", async () => {
        const { root } = spawn(`<div id="host"><span>x</span></div>`, {});
        const host = hostOf(root);
        await twoTicks();
        expect(railYOf(host)).toBeFalsy();

        host.setAttribute("x-scrollbar", "");
        await twoTicks();
        expect(host.classList.contains("x-scrollbar")).toBe(true);
        expect(railYOf(host)).toBeTruthy();

        host.removeAttribute("x-scrollbar");
        await twoTicks();
        expect(host.classList.contains("x-scrollbar")).toBe(false);
        expect(railYOf(host)).toBeFalsy();
    });
});
