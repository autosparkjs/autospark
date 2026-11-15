/**
 * anchor 组件插件测试（组件库 P3 导航轻件，ADR-0018 清单权威表 navigation 行 /
 * ADR-0029 轻件对 ADR）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - items 渲染：链接逐项生成、href 缺省 #key / 显式 href、label 文案；
 * - scroll 高亮：getBoundingClientRect 判定线（越线即当前，全未达线不高亮）、
 *   offset 偏移参与、同值短路、change 冒泡 detail={key}；
 * - 点击：preventDefault + window.scrollTo（目标位置 = 锚顶 + 滚动偏移 - offset）
 *   + 即时高亮迁移 + change 派发；
 * - affix 形态绑定落 body（T4=B）；
 * - unmounted 清理：destroy 后 scroll 监听摘除（grid 的 matchMedia 先例）；
 * - precompile 元素名变换：<x-anchor> → nav 宿主 + props 折叠 + <x-anchor-item> →
 *   data-items JSON 通道（字面量数组 props 死环规避）+ 裸属性布尔糖。
 *
 * happy-dom 无真实滚动：锚位经元素级 getBoundingClientRect 补丁注入确定性 top 值，
 * scroll 经 window 手动派发——真浏览器滚动链路见 docs demo（e2e 验证面）。
 */
import "../../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { ANCHOR_NAME, bootstrapAnchorPlugin } from "../../../components/navigation/anchor/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[ANCHOR_NAME] as string).replace(/\s+/g, " ");

/** 锚目标节（挂 document 树——锚解析走 document.getElementById） */
const SECTIONS = [
    { key: "intro", label: "概述" },
    { key: "usage", label: "用法" },
    { key: "api", label: "参考" },
];

/** 挂载 + 锚目标区块注入 document（getElementById 可达）；返回清理器 */
const mountAnchor = async (html: string, state: any) => {
    const { root, engine } = mount(html, state);
    document.body.appendChild(root);
    await nextTick();
    return {
        root,
        engine,
        cleanup: () => {
            engine.destroy();
            root.remove();
        },
    };
};

/** 注入锚目标区块（挂 document 树）并按 id 建索引 */
const seedSections = () => {
    const ids = ["intro", "usage", "api"];
    const els = ids.map((id) => {
        const s = document.createElement("section");
        s.id = id;
        document.body.appendChild(s);
        return s;
    });
    return { els, remove: () => els.forEach((e) => e.remove()) };
};

/** 元素级 getBoundingClientRect 补丁（确定性 top 注入——happy-dom 无真实布局） */
const patchRect = (el: Element, top: number) => {
    (el as any).getBoundingClientRect = () =>
        ({ top, bottom: top + 100, height: 100, width: 100, left: 0, right: 100, x: 0, y: 0 }) as DOMRect;
};

/** window.scrollY 补丁（点击目标位置计算消费） */
const patchScrollY = (v: number) => {
    Object.defineProperty(window, "scrollY", { value: v, configurable: true });
};

/** window.scrollTo 间谍（点击滚动断言面） */
const spyScrollTo = () => {
    const calls: any[] = [];
    const original = window.scrollTo;
    (window as any).scrollTo = (...args: any[]) => { calls.push(args[0] ?? {}); };
    return { calls, restore: () => { (window as any).scrollTo = original; } };
};

const fireScroll = () => window.dispatchEvent(new Event("scroll"));

/** 本文件所有挂载的统一回收（scroll 监听卫生：防用例间串扰） */
const cleanups: Array<() => void> = [];
afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
});

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.anchor 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[ANCHOR_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${ANCHOR_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[ANCHOR_NAME];
        bootstrapAnchorPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[ANCHOR_NAME]).toBe(before);
    });
});

describe("items 渲染", () => {
    test("链接逐项生成：href 缺省 #key、显式 href 原样、label 文案（nav 宿主化身）", async () => {
        const { root, cleanup } = await mountAnchor(
            `<nav x-component:autospark.anchor="{ items: secs }"></nav>`,
            { secs: [...SECTIONS, { key: "ext", label: "外链区", href: "#custom-id" }] },
        );
        cleanups.push(cleanup);
        const links = Array.from(root.querySelectorAll(".asc-anchor-link"));
        expect(links.length).toBe(4);
        expect(links[0]!.getAttribute("href")).toBe("#intro"); // href 缺省 key 作锚 id
        expect(links[0]!.textContent).toContain("概述");
        expect(links[3]!.getAttribute("href")).toBe("#custom-id"); // 显式 href 原样
        expect(root.querySelector(".asc-anchor")!.tagName).toBe("NAV"); // 宿主化身保留
    });
});

describe("scroll 高亮（判定线语义）", () => {
    test("越线即当前：最后越线项激活（data-active + aria-current）+ change 冒泡 detail={key}", async () => {
        const changes: string[] = [];
        const secs = seedSections();
        patchRect(secs.els[0]!, -50); // intro 已滚过（顶在判定线上方）
        patchRect(secs.els[1]!, 30);  // usage 顶在线下 30px → 未越线
        patchRect(secs.els[2]!, 300);
        const { root, cleanup } = await mountAnchor(
            `<div @change="changes.push($event.detail.key)">
                <nav x-component:autospark.anchor="{ items: secs }"></nav>
            </div>`,
            { secs: SECTIONS, changes },
        );
        cleanups.push(() => { cleanup(); secs.remove(); });
        const links = Array.from(root.querySelectorAll(".asc-anchor-link"));
        expect(links[0]!.hasAttribute("data-active")).toBe(true); // 初始一跳同步（mounted setTimeout）
        expect(changes).toEqual(["intro"]);
        expect(links[0]!.getAttribute("aria-current")).toBe("true");

        patchRect(secs.els[1]!, -10); // usage 越线
        fireScroll();
        await nextTick();
        expect(links[1]!.hasAttribute("data-active")).toBe(true);
        expect(links[0]!.hasAttribute("data-active")).toBe(false);
        expect(changes).toEqual(["intro", "usage"]);
    });

    test("全未达线不高亮（antd 缺省语义）：清空也是变化（change detail.key 为空串）", async () => {
        const changes: string[] = [];
        const secs = seedSections();
        patchRect(secs.els[0]!, 100);
        patchRect(secs.els[1]!, 300);
        patchRect(secs.els[2]!, 600);
        // props current 初值注入后，初始一跳 syncActive 即以判定为权威源清空（页顶无高亮）
        const { root, cleanup } = await mountAnchor(
            `<div @change="changes.push($event.detail.key)">
                <nav x-component:autospark.anchor="{ items: secs, current: 'intro' }"></nav>
            </div>`,
            { secs: SECTIONS, changes },
        );
        cleanups.push(() => { cleanup(); secs.remove(); });
        const links = Array.from(root.querySelectorAll(".asc-anchor-link"));
        expect(links.every((l) => !l.hasAttribute("data-active"))).toBe(true); // 初始一跳即清空
        expect(changes).toEqual([""]); // 清空广播（key 为空串）
        fireScroll(); // 同值短路：无新派发
        await nextTick();
        expect(changes).toEqual([""]);
    });

    test("offset 判定线偏移：锚顶 - offset <= 1 即越线（吸顶导航高度补偿）", async () => {
        const secs = seedSections();
        patchRect(secs.els[0]!, 150); // 距顶 150px（无 offset 不越线，offset=200 越线）
        patchRect(secs.els[1]!, 260);
        patchRect(secs.els[2]!, 400);
        const withOffset = await mountAnchor(
            `<nav x-component:autospark.anchor="{ items: secs, offset: 200 }"></nav>`,
            { secs: SECTIONS },
        );
        cleanups.push(() => { withOffset.cleanup(); secs.remove(); });
        const links = Array.from(withOffset.root.querySelectorAll(".asc-anchor-link"));
        // intro(150-200=-50≤1) 越线；usage(260-200=60>1) 未越线 → 当前为 intro
        expect(links[0]!.hasAttribute("data-active")).toBe(true);
        expect(links[1]!.hasAttribute("data-active")).toBe(false);

        // 对照组（offset=0）：全未达线（150>1）→ 无高亮
        const noOffset = await mountAnchor(
            `<nav x-component:autospark.anchor="{ items: secs }"></nav>`,
            { secs: SECTIONS },
        );
        cleanups.push(noOffset.cleanup);
        expect(
            Array.from(noOffset.root.querySelectorAll(".asc-anchor-link")).every((l) => !l.hasAttribute("data-active")),
        ).toBe(true);
    });

    test("同值短路：连续 scroll 无状态变化不重复派发 change", async () => {
        const changes: string[] = [];
        const secs = seedSections();
        patchRect(secs.els[0]!, -50);
        patchRect(secs.els[1]!, 30);
        patchRect(secs.els[2]!, 300);
        const { root, cleanup } = await mountAnchor(
            `<div @change="changes.push($event.detail.key)">
                <nav x-component:autospark.anchor="{ items: secs }"></nav>
            </div>`,
            { secs: SECTIONS, changes },
        );
        cleanups.push(() => { cleanup(); secs.remove(); });
        fireScroll();
        fireScroll();
        await nextTick();
        expect(changes).toEqual(["intro"]); // 初始同步一次，后续 scroll 同值短路
        expect(root.querySelectorAll(".asc-anchor-link").length).toBe(3);
    });
});

describe("点击（平滑滚动 + 即时高亮）", () => {
    test("点击链接：preventDefault + scrollTo 目标 = 锚顶 + scrollY - offset + 即时高亮 + change", async () => {
        const changes: string[] = [];
        const secs = seedSections();
        patchRect(secs.els[0]!, -50);
        patchRect(secs.els[1]!, 120); // 未越线（点击驱动过去）
        patchRect(secs.els[2]!, 400);
        patchScrollY(260);
        const spy = spyScrollTo();
        const { root, cleanup } = await mountAnchor(
            `<div @change="changes.push($event.detail.key)">
                <nav x-component:autospark.anchor="{ items: secs, offset: 20 }"></nav>
            </div>`,
            { secs: SECTIONS, changes },
        );
        cleanups.push(() => { cleanup(); secs.remove(); spy.restore(); });
        const links = Array.from(root.querySelectorAll(".asc-anchor-link")) as HTMLAnchorElement[];
        const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
        links[1]!.dispatchEvent(ev);
        await nextTick();
        expect(ev.defaultPrevented).toBe(true); // 拦原生 hash 瞬跳
        expect(spy.calls.length).toBe(1);
        expect(spy.calls[0]!.top).toBe(120 + 260 - 20); // 锚顶 + 滚动偏移 - 判定线
        expect(spy.calls[0]!.behavior).toBe("smooth");
        expect(links[1]!.hasAttribute("data-active")).toBe(true); // 即时迁移（不等滚动事件）
        expect(changes).toEqual(["intro", "usage"]);
    });

    test("目标缺席的项：点击无滚动无迁移（容错静默）", async () => {
        const secs = seedSections(); // api 区块存在但 items 指向缺席 id
        const spy = spyScrollTo();
        const { root, cleanup } = await mountAnchor(
            `<nav x-component:autospark.anchor="{ items: missing }"></nav>`,
            { missing: [{ key: "ghost", label: "幽灵锚" }] },
        );
        cleanups.push(() => { cleanup(); secs.remove(); spy.restore(); });
        const link = root.querySelector(".asc-anchor-link") as HTMLAnchorElement;
        const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
        link.dispatchEvent(ev);
        await nextTick();
        expect(ev.defaultPrevented).toBe(true); // 仍拦默认跳转（#ghost 空锚）
        expect(spy.calls.length).toBe(0);
        expect(link.hasAttribute("data-active")).toBe(false);
    });
});

describe("affix 形态与模板样式", () => {
    test("affix 绑定落 body（T4=B：根上动态绑定不求值）：缺省无 / true 落 data-affix", async () => {
        const a = await mountAnchor(`<nav x-component:autospark.anchor="{ items: secs }"></nav>`, { secs: SECTIONS });
        cleanups.push(a.cleanup);
        expect(a.root.querySelector(".asc-anchor-body")!.hasAttribute("data-affix")).toBe(false);

        const b = await mountAnchor(
            `<nav x-component:autospark.anchor="{ items: secs, affix: true }"></nav>`,
            { secs: SECTIONS },
        );
        cleanups.push(b.cleanup);
        expect(b.root.querySelector(".asc-anchor-body")!.hasAttribute("data-affix")).toBe(true);
    });

    test("样式规则（模板断言）：tabs 同源 tone 链 + 激活左墨线 + affix fixed 块 + 暗色兜底", () => {
        const t = tpl();
        // 高亮与 tabs 激活同源：--asc-tone 主色中转 + 次要文字色链
        expect(t).toContain("--asc-tone: var(--auto-primary-color, var(--asc-anchor-primary, #009aff));");
        expect(t).toContain("color: var(--auto-secondary-color, var(--asc-anchor-link-color, rgba(0, 0, 0, 0.55)));");
        // 激活：tone 着色 + 字重 + 左墨线点亮
        expect(t).toContain(".asc-anchor-link[data-active] {");
        expect(t).toContain("font-weight: var(--x-font-weight-large, 600);");
        // affix：fixed 右缘悬浮经 :has() 驱动
        expect(t).toContain(".asc-anchor:has(> .asc-anchor-body[data-affix]) {");
        expect(t).toContain("position: fixed;");
        // 暗色兜底变体在场（ADR-0129）
        expect(t).toContain("[dark] .asc-anchor-link,");
        expect(t).toContain("[data-dark] .asc-anchor-link[data-active] {");
    });
});

describe("unmounted 清理（grid 的 matchMedia 先例）", () => {
    test("destroy 后 scroll 监听摘除：不再派发 change（无泄漏）", async () => {
        const changes: string[] = [];
        const secs = seedSections();
        patchRect(secs.els[0]!, -50);
        patchRect(secs.els[1]!, 30);
        patchRect(secs.els[2]!, 300);
        const { root, engine } = await mountAnchor(
            `<div @change="changes.push($event.detail.key)">
                <nav x-component:autospark.anchor="{ items: secs }"></nav>
            </div>`,
            { secs: SECTIONS, changes },
        );
        expect(changes).toEqual(["intro"]);
        engine.destroy();
        root.remove();
        patchRect(secs.els[1]!, -10);
        fireScroll();
        await nextTick();
        expect(changes).toEqual(["intro"]); // destroy 后监听已摘，无新派发
        secs.remove();
    });
});

describe("元素名快速写法（precompile 变换）", () => {
    test("<x-anchor> 替换为 nav 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
        const { root } = mount(
            `<div><x-anchor offset="80"><span>占位</span></x-anchor></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("NAV");
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const props = attrOf(host, "x-component:autospark.anchor")!;
        expect(props).toContain("offset: 80");
        expect(host.querySelector("span")!.textContent).toBe("占位"); // 子内容随迁
    });

    test("裸属性布尔糖：<x-anchor affix> 折叠为 affix: true（HTML 裸属性语义）", () => {
        const { root } = mount(`<div><x-anchor affix></x-anchor></div>`, {}, { autostart: false });
        const host = root.children[0]!.children[0]!;
        const props = [...host.attributes].find((a) => a.name === "x-component:autospark.anchor")!.value;
        expect(props).toContain("affix: true");
        expect(host.hasAttribute("affix")).toBe(false); // 裸属性不残留宿主
    });

    test("<x-anchor-item> 子元素声明：折叠为 items JSON 落 data-items + 声明元素摘除 + 渲染还原", async () => {
        const secs = seedSections();
        const { root, cleanup } = await mountAnchor(
            `<div><x-anchor>
                <x-anchor-item key="intro" label="概述"></x-anchor-item>
                <x-anchor-item key="usage" label="用法" href="#intro"></x-anchor-item>
            </x-anchor></div>`,
            {},
        );
        cleanups.push(() => { cleanup(); secs.remove(); });
        expect(root.querySelector("x-anchor-item")).toBe(null); // 声明元素不残留
        const links = Array.from(root.querySelectorAll(".asc-anchor-link"));
        expect(links.length).toBe(2);
        expect(links[0]!.textContent).toContain("概述");
        expect(links[1]!.getAttribute("href")).toBe("#intro"); // href 折叠进 JSON 通道
    });

    test(":items 状态引用在场：data-items 不落盘（props 优先）+ 裸 items JSON 走 data-items 通道", async () => {
        const secs = seedSections();
        const bound = await mountAnchor(
            `<div><x-anchor :items="secs"><x-anchor-item key="z" label="声明形态被忽略"></x-anchor-item></x-anchor></div>`,
            { secs: SECTIONS },
        );
        cleanups.push(() => { bound.cleanup(); secs.remove(); });
        expect(bound.root.querySelector(".asc-anchor")!.hasAttribute("data-items")).toBe(false);
        expect(bound.root.querySelector("x-anchor-item")).toBe(null);
        expect(bound.root.querySelectorAll(".asc-anchor-link").length).toBe(3);

        const bare = await mountAnchor(
            `<div><x-anchor items='[{"key":"intro","label":"JSON 形态"}]'></x-anchor></div>`,
            {},
        );
        cleanups.push(bare.cleanup);
        const links = bare.root.querySelectorAll(".asc-anchor-link");
        expect(links.length).toBe(1);
        expect(links[0]!.textContent).toContain("JSON 形态");
    });
});
