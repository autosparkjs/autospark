/**
 * carousel 组件插件测试（组件库 P2，ADR-0018 清单权威表 display 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染（track/dots 双 x-for + 项形态探测：
 *   string 图片 / { src } 图片 / { html } 内容 / { caption } 说明条）；
 * - 切换链：goTo 统一通道（loop 环形 / 非 loop 夹取 / 同值短路）+ change 广播
 *   detail={index} + el.value 劫持桥 + 指示点/幻灯 data-active 迁移；
 * - effect 双档：scroll（scrollTo 驱动 + settleTarget 吞中间态 + 用户拖动反推
 *   同步）与 fade（data-active 纯 CSS 分支）；
 * - autoplay：定时切页 + prefers-reduced-motion 停播 + 非循环末页停播；
 * - 子元素声明形态（<x-carousel-item> precompile 折叠 data-items）+ 裸 items JSON；
 * - 键盘（stage 焦点域左右翻页）+ 样式通道字符串断言（button 范式 ADR-0012）。
 */
import "../../setup";
import { describe, expect, test, afterEach, afterAll } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { CAROUSEL_NAME, bootstrapCarouselPlugin } from "../../../components/display/carousel/index";

/** x-show 隐藏不摘 DOM（display:none 内联）——可见性断言走 display 通道（家族惯例） */
const isHidden = (el: Element | null): boolean => !!el && (el as HTMLElement).style.display === "none";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[CAROUSEL_NAME] as string).replace(/\s+/g, " ");

/* ── engine 回收（autoplay 定时器 + window resize 监听随实例累积，须逐用例销毁隔离） ── */
const engines: any[] = [];
const mountCarousel = (html: string, state: any, options?: any) => {
    const m = mount(html, state, options);
    engines.push(m.engine);
    return m;
};
/** 文件加载时的全局 matchMedia 原值（happy-dom 注入）——文件级复原用（见 afterAll） */
const savedMatchMedia = (globalThis as any).matchMedia;
afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    (globalThis as any).matchMedia = undefined; // reduce stub 复位（下个用例惰性重建缺省行为）
});
// 跨文件全局态复原：afterEach 的置 undefined 是**用例间**语义（carousel 组件惰性重建
// 缺省 reduce stub），但文件跑完后不恢复会污染后续测试文件——所有 engine 构造走
// ViewportManager 时 warn「当前环境无 matchMedia」（劫持 console.warn 计数的用例被
// 多收一条）、响应式档位组件（grid 等）按 innerWidth 的档位判定失效（bun test 全部
// 文件共享同一进程，全局即跨文件）
afterAll(() => {
    (globalThis as any).matchMedia = savedMatchMedia;
});

/** 标准挂载：包裹层承载事件监听（测试侧 addEventListener 断言，规避模板 @事件面） */
const mountStd = (props: string, state: any) =>
    mountCarousel(
        `<div id="wrap"><div x-component:autospark.carousel="{ ${props} }"></div></div>`,
        state,
    );

/** 指定元素 clientWidth（happy-dom 无布局——spy 化滚动算术的尺寸前提） */
const fakeWidth = (el: Element, w: number) => {
    Object.defineProperty(el, "clientWidth", { value: w, configurable: true });
};

/** scrollTo 记录器（替换原生方法，捕获调用参数） */
const spyScroll = (el: Element) => {
    const calls: any[] = [];
    (el as any).scrollTo = (opts: any) => { calls.push(opts); };
    return calls;
};

describe("carousel 组件插件（ADR-0018 P2 display）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.carousel 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[CAROUSEL_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${CAROUSEL_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
        expect(template).toContain('id="autospark-components-carousel"'); // 样式幂等键
    });

    test("化身渲染：track/dots 双 x-for + 默认首项激活 + 箭头/指示器在场", async () => {
        const { root } = mountStd("items: slides", {
            slides: ["a.png", "b.png", "c.png"],
        });
        await nextTick();
        expect(root.querySelectorAll(".asc-carousel-item").length).toBe(3); // 幻灯项
        expect(root.querySelectorAll(".asc-carousel-dot").length).toBe(3); // 指示点
        expect(root.querySelector(".asc-carousel-item")!.hasAttribute("data-active")).toBe(true); // 首项激活
        expect(root.querySelector(".asc-carousel-dot")!.hasAttribute("data-active")).toBe(true);
        expect(root.querySelector(".asc-carousel-item-img")!.getAttribute("src")).toBe("a.png");
        expect(isHidden(root.querySelector('[data-arrow="prev"]'))).toBe(false); // 箭头在场（显隐走 CSS opacity）
        expect(isHidden(root.querySelector(".asc-carousel-indicator"))).toBe(false);
        expect(root.querySelector(".asc-carousel-body")!.getAttribute("data-effect")).toBe("scroll"); // 缺省档
        expect(root.querySelector(".asc-carousel-body")!.getAttribute("data-indicator")).toBe("bottom");
    });

    test("项形态探测：string / { src, alt } / { html } / { caption } 四形态分叉渲染", async () => {
        const { root } = mountStd("items: slides", {
            slides: [
                "a.png",
                { src: "b.png", alt: "山峰" },
                { html: "<strong>促销</strong>内容页" },
                { src: "d.png", caption: "说明条文案" },
            ],
        });
        await nextTick();
        const items = [...root.querySelectorAll(".asc-carousel-item")];
        // ① string 项 → 图片形态
        expect(isHidden(items[0].querySelector(".asc-carousel-item-img"))).toBe(false);
        expect((items[0].querySelector(".asc-carousel-item-img") as HTMLElement).getAttribute("src")).toBe("a.png");
        // ② { src, alt } 项 → 图片形态 + alt 透传
        expect((items[1].querySelector(".asc-carousel-item-img") as HTMLElement).getAttribute("alt")).toBe("山峰");
        // ③ { html } 项 → 内容形态（x-html 直出）+ 图片形态让位
        expect(isHidden(items[2].querySelector(".asc-carousel-item-html"))).toBe(false);
        expect(isHidden(items[2].querySelector(".asc-carousel-item-img"))).toBe(true);
        expect(items[2].querySelector(".asc-carousel-item-html")!.innerHTML).toContain("<strong>促销</strong>");
        // ④ { src, caption } 项 → 图片 + 说明条
        const caption = items[3].querySelector(".asc-carousel-item-caption")!;
        expect(isHidden(caption)).toBe(false);
        expect(caption.textContent).toBe("说明条文案");
    });

    test("下一页：change 广播 detail={index} + 指示点/幻灯激活态迁移 + 非循环首末页 disabled", async () => {
        const { root } = mountStd("items: slides", { slides: ["a.png", "b.png", "c.png"] });
        await nextTick();
        const wrap = root.querySelector("#wrap")!;
        const details: any[] = [];
        wrap.addEventListener("change", (e) => { details.push((e as CustomEvent).detail); });
        expect(root.querySelector('[data-arrow="prev"]')!.disabled).toBe(true); // 首页
        expect(root.querySelector('[data-arrow="next"]')!.disabled).toBe(false);
        root.querySelector('[data-arrow="next"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(details).toEqual([{ index: 1 }]); // change detail 形态
        expect(root.querySelectorAll(".asc-carousel-dot")[1]!.hasAttribute("data-active")).toBe(true); // 激活迁移
        expect(root.querySelectorAll(".asc-carousel-dot")[0]!.hasAttribute("data-active")).toBe(false);
        expect(root.querySelectorAll(".asc-carousel-item")[1]!.hasAttribute("data-active")).toBe(true);
        // 末页：next disabled（非循环）
        root.querySelector('[data-arrow="next"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(root.querySelector('[data-arrow="next"]')!.disabled).toBe(true);
        root.querySelector('[data-arrow="next"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(details).toEqual([{ index: 1 }, { index: 2 }]); // 末页不越界（无第三次广播）
    });

    test("loop 环形：末页 next 回首页 / 首页 prev 到末页", async () => {
        const { root } = mountStd("items: slides, loop: true", { slides: ["a.png", "b.png", "c.png"] });
        await nextTick();
        const details: any[] = [];
        root.querySelector("#wrap")!.addEventListener("change", (e) => { details.push((e as CustomEvent).detail); });
        root.querySelector('[data-arrow="prev"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(details).toEqual([{ index: 2 }]); // 首页 prev → 末页（环形）
        root.querySelector('[data-arrow="next"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(details).toEqual([{ index: 2 }, { index: 0 }]); // 末页 next → 首页
    });

    test("指示点点击直达 + goTo 夹取边界（-1/越界值钳制）+ 同值短路", async () => {
        const { root } = mountStd("items: slides", { slides: ["a.png", "b.png", "c.png"] });
        await nextTick();
        const details: any[] = [];
        root.querySelector("#wrap")!.addEventListener("change", (e) => { details.push((e as CustomEvent).detail); });
        root.querySelectorAll(".asc-carousel-dot")[2]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(details).toEqual([{ index: 2 }]);
        // el.value 桥：写越界值夹取、写同值短路（无广播）
        (root.querySelector(".asc-carousel") as HTMLElement).value = 99;
        await nextTick();
        expect(details).toEqual([{ index: 2 }]); // 99 夹取到 2 = 同值短路
        (root.querySelector(".asc-carousel") as HTMLElement).value = -1;
        await nextTick();
        expect(details).toEqual([{ index: 2 }, { index: 0 }]); // -1 夹取到 0
        expect((root.querySelector(".asc-carousel") as HTMLElement).value).toBe(0); // 读桥
    });

    test("el.value 读桥：当前页直读", async () => {
        const { root } = mountStd("items: slides", { slides: ["a.png", "b.png"] });
        await nextTick();
        expect((root.querySelector(".asc-carousel") as HTMLElement).value).toBe(0);
        root.querySelector('[data-arrow="next"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect((root.querySelector(".asc-carousel") as HTMLElement).value).toBe(1);
    });

    test("键盘通道：stage 焦点域左右翻页", async () => {
        const { root } = mountStd("items: slides, loop: true", { slides: ["a.png", "b.png"] });
        await nextTick();
        const details: any[] = [];
        root.querySelector("#wrap")!.addEventListener("change", (e) => { details.push((e as CustomEvent).detail); });
        const stage = root.querySelector(".asc-carousel-stage")!;
        stage.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        await nextTick();
        stage.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
        await nextTick();
        expect(details).toEqual([{ index: 1 }, { index: 0 }]); // 左右翻页（loop 环形）
    });

    test("arrows / indicator 开关与位置：x-show 通道 + data-indicator 三态", async () => {
        const { root } = mountStd("items: slides, arrows: false, indicator: 'top'", { slides: ["a.png", "b.png"] });
        await nextTick();
        expect(isHidden(root.querySelector('[data-arrow="prev"]'))).toBe(true); // 箭头关
        expect(isHidden(root.querySelector('[data-arrow="next"]'))).toBe(true);
        expect(isHidden(root.querySelector(".asc-carousel-indicator"))).toBe(false); // 指示器在场
        expect(root.querySelector(".asc-carousel-body")!.getAttribute("data-indicator")).toBe("top"); // 顶部
        const off = mountStd("items: slides, indicator: false", { slides: ["a.png"] });
        await nextTick();
        expect(isHidden(off.root.querySelector(".asc-carousel-indicator"))).toBe(true); // 指示器关
        expect(off.root.querySelector(".asc-carousel-body")!.getAttribute("data-indicator")).toBe("off");
    });

    test("fade 档：data-effect=fade + data-active 纯 CSS 分支（无 scrollTo 参与）", async () => {
        const { root } = mountStd("items: slides, effect: 'fade'", { slides: ["a.png", "b.png", "c.png"] });
        await nextTick();
        expect(root.querySelector(".asc-carousel-body")!.getAttribute("data-effect")).toBe("fade");
        const track = root.querySelector(".asc-carousel-track")!;
        const calls = spyScroll(track); // fade 档切换不触滚动
        root.querySelector('[data-arrow="next"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(calls).toEqual([]); // fade 纯 data-active 分支
        expect(root.querySelectorAll(".asc-carousel-item")[1]!.hasAttribute("data-active")).toBe(true);
    });
});

describe("scroll 档滚动机制（scroll-snap 真滚动取舍的核心面）", () => {
    test("切换驱动 scrollTo（目标页 × 页宽）+ resize 重定位", async () => {
        const { root } = mountStd("items: slides", { slides: ["a.png", "b.png", "c.png"] });
        await nextTick();
        const track = root.querySelector(".asc-carousel-track")!;
        fakeWidth(track, 300);
        const calls = spyScroll(track);
        root.querySelector('[data-arrow="next"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(calls.length).toBe(1);
        expect(calls[0].left).toBe(300); // 第 2 页 × 300px
        expect(calls[0].behavior).toBe("smooth"); // 非 reduce 用户走平滑
        window.dispatchEvent(new Event("resize")); // 容器尺寸变化重定位
        await nextTick();
        expect(calls.length).toBe(2);
        expect(calls[1].left).toBe(300); // 当前页 × 新页宽重贴齐
        expect(calls[1].behavior).toBe("auto"); // instant
    });

    test("程序滚动中间态吞掉（settleTarget 旗）+ 到达收旗", async () => {
        const { root } = mountStd("items: slides", { slides: ["a.png", "b.png", "c.png"] });
        await nextTick();
        const track = root.querySelector(".asc-carousel-track")!;
        fakeWidth(track, 300);
        spyScroll(track);
        const details: any[] = [];
        root.querySelector("#wrap")!.addEventListener("change", (e) => { details.push((e as CustomEvent).detail); });
        // 直达第 3 页（settleTarget=2；scrollTo 被 spy，scroll 事件由测试手动模拟浏览器行为）
        root.querySelectorAll(".asc-carousel-dot")[2]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(details).toEqual([{ index: 2 }]);
        // smooth 中间态（路过第 2 页）：吞掉——不回写 index、不广播
        (track as HTMLElement).scrollLeft = 300;
        track.dispatchEvent(new Event("scroll"));
        await nextTick();
        expect(details).toEqual([{ index: 2 }]); // 中间态静默
        expect(root.querySelectorAll(".asc-carousel-dot")[2]!.hasAttribute("data-active")).toBe(true); // 激活不闪跳
        // 到达目标页：收旗
        (track as HTMLElement).scrollLeft = 600;
        track.dispatchEvent(new Event("scroll"));
        await nextTick();
        expect(details).toEqual([{ index: 2 }]);
    });

    test("用户拖动反推同步：scroll 位置变化广播 change（settleTarget 空闲）", async () => {
        const { root } = mountStd("items: slides", { slides: ["a.png", "b.png", "c.png"] });
        await nextTick();
        const track = root.querySelector(".asc-carousel-track")!;
        fakeWidth(track, 300);
        const details: any[] = [];
        root.querySelector("#wrap")!.addEventListener("change", (e) => { details.push((e as CustomEvent).detail); });
        (track as HTMLElement).scrollLeft = 600; // 用户拖到第 3 页
        track.dispatchEvent(new Event("scroll"));
        await nextTick();
        expect(details).toEqual([{ index: 2 }]); // 拖动同步广播
        expect(root.querySelectorAll(".asc-carousel-dot")[2]!.hasAttribute("data-active")).toBe(true);
        expect((root.querySelector(".asc-carousel") as HTMLElement).value).toBe(2); // 值桥随动
    });
});

describe("autoplay（自动播放）", () => {
    /** 轮询等待值桥到达目标页（定时器时序抖动容错） */
    const waitForPage = async (root: HTMLElement, target: number, budgetMs = 1500) => {
        const read = () => (root.querySelector(".asc-carousel") as HTMLElement).value;
        for (let t = 0; t < budgetMs && read() !== target; t += 25) {
            await new Promise((r) => setTimeout(r, 25));
        }
        return read();
    };

    test("间隔切页 + 非循环末页停播", async () => {
        const { root } = mountStd("items: slides, autoplay: 60", { slides: ["a.png", "b.png", "c.png"] });
        await nextTick();
        expect(await waitForPage(root as HTMLElement, 1)).toBe(1); // 自动切到第 2 页
        expect(await waitForPage(root as HTMLElement, 2)).toBe(2); // → 末页
        await new Promise((r) => setTimeout(r, 200)); // 末页停播（非循环）
        expect((root.querySelector(".asc-carousel") as HTMLElement).value).toBe(2); // 恒末页
    });

    test("loop 末页回首页持续播（环形）", async () => {
        const { root } = mountStd("items: slides, autoplay: 60, loop: true", { slides: ["a.png", "b.png"] });
        await nextTick();
        expect(await waitForPage(root as HTMLElement, 1)).toBe(1); // → 末页
        expect(await waitForPage(root as HTMLElement, 0)).toBe(0); // 环形回首页
    });

    test("prefers-reduced-motion 停播（reduce 用户不被自动动效打扰）", async () => {
        (globalThis as any).matchMedia = (q: string) => ({ matches: true, media: q }); // reduce stub
        const { root } = mountStd("items: slides, autoplay: 60", { slides: ["a.png", "b.png"] });
        await nextTick();
        await new Promise((r) => setTimeout(r, 200));
        expect((root.querySelector(".asc-carousel") as HTMLElement).value).toBe(0); // 恒停首页
    });
});

describe("items 双形态（状态引用 / 子元素声明）", () => {
    test("状态引用整体替换驱动重渲（原地变异不发信号——文档披露边界）", async () => {
        const { root, engine } = mountStd("items: slides", { slides: ["a.png", "b.png"] });
        await nextTick();
        expect(root.querySelectorAll(".asc-carousel-item").length).toBe(2);
        (engine.store.state as any).slides = ["x.png", "y.png", "z.png"]; // 整体替换
        await nextTick();
        expect(root.querySelectorAll(".asc-carousel-item").length).toBe(3);
        expect((root.querySelector(".asc-carousel-item-img") as HTMLElement).getAttribute("src")).toBe("x.png");
    });

    test("<x-carousel-item> 子元素声明：标量折叠 + 子内容随迁 html 字段（data-items 通道）", async () => {
        const { root } = mountCarousel(
            `<div><x-carousel>
                <x-carousel-item src="a.png" alt="山"></x-carousel-item>
                <x-carousel-item src="b.png" caption="海"></x-carousel-item>
                <x-carousel-item><em>促销内容</em></x-carousel-item>
            </x-carousel></div>`,
            {},
        );
        await nextTick();
        const items = [...root.querySelectorAll(".asc-carousel-item")];
        expect(items.length).toBe(3);
        expect((items[0].querySelector(".asc-carousel-item-img") as HTMLElement).getAttribute("src")).toBe("a.png");
        expect((items[0].querySelector(".asc-carousel-item-img") as HTMLElement).getAttribute("alt")).toBe("山");
        expect(items[1].querySelector(".asc-carousel-item-caption")!.textContent).toBe("海");
        expect(items[2].querySelector(".asc-carousel-item-html")!.innerHTML).toContain("<em>促销内容</em>");
        expect(root.querySelector("x-carousel")).toBeNull(); // 宿主已变换
    });

    test("裸 items 属性（JSON 字符串）同经 data-items 通道", async () => {
        const { root } = mountCarousel(
            `<div><x-carousel items='["a.png","b.png"]'></x-carousel></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-carousel-item").length).toBe(2);
    });

    test("<x-carousel> 静态属性折叠 props + 裸布尔归一 true（autoplay/loop 开关）", async () => {
        const { root } = mountCarousel(
            `<div><x-carousel autoplay="0" loop><x-carousel-item src="a.png"></x-carousel-item></x-carousel></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-carousel-body")!;
        expect(root.querySelector('[data-arrow="prev"]')!.disabled).toBe(false); // loop 生效（裸属性归一 true）
    });

    test("props 状态引用优先于声明形态（data-items 不落盘）", async () => {
        const { root } = mountCarousel(
            `<div><x-carousel :items="slides"><x-carousel-item src="a.png"></x-carousel-item></x-carousel></div>`,
            { slides: ["p.png", "q.png"] },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-carousel-item").length).toBe(2); // 引用注入胜出
        expect((root.querySelector(".asc-carousel-item-img") as HTMLElement).getAttribute("src")).toBe("p.png");
    });
});

describe("样式通道（button 范式 ADR-0012 / ADR-0129）", () => {
    test("三级回退链 + scroll-snap / fade 双档块 + 暗色兜底", () => {
        const t = tpl();
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-carousel-font-size, 0.875rem));");
        expect(t).toContain("background: var(--auto-third-bgcolor, var(--asc-carousel-bg, rgba(0, 0, 0, 0.04)));");
        expect(t).toContain("scroll-snap-type: x mandatory;");
        expect(t).toContain('.asc-carousel-body[data-effect="fade"] .asc-carousel-item {');
        expect(t).toContain('[dark] .asc-carousel-stage, [data-dark] .asc-carousel-stage {');
        expect(t).toContain("@media (prefers-reduced-motion: reduce) {");
    });

    test("x-for 容器宿主纪律：track/dots 上无动态绑定（克隆体承载）", () => {
        const t = tpl();
        // track / dots 行内不得出现 :绑定或 @事件（x-for 宿主绑定不编译）
        expect(t).not.toMatch(/class="asc-carousel-track"[^>]*(:Register or [@:][a-z])/);
        expect(t).not.toMatch(/class="asc-carousel-dots"[^>]*[@:][a-z]/);
    });

    test("箭头组合 x-icon 内置 arrow（prev 经 CSS 旋转 180°）", () => {
        const t = tpl();
        expect(t).toContain('x-icon="\'arrow\'"');
        expect(t).toContain('.asc-carousel-arrow[data-arrow="prev"] .asc-carousel-arrow-icon {');
        expect(t).toContain("transform: rotate(180deg);");
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapCarouselPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[CAROUSEL_NAME];
        bootstrapCarouselPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[CAROUSEL_NAME]).toBe(before);
    });
});
