/**
 * image-viewer 组件插件测试（组件库 P2，ADR-0018 清单权威表 display 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染（自建 fixed 全屏层）+ visible/index 受控；
 * - 切换链：前后翻页钮（clamp 语义 disabled）+ change 事件（detail={index}）+
 *   计数器随动 + 切图重置缩放/旋转（同值幂等守卫）；
 * - 缩放/旋转/重置工具栏（:style 内联 transform 通道）；
 * - 键盘（document 级：左右切换 / ESC 请求关闭 / ±缩放，仅 visible 响应）+
 *   遮罩点击请求关闭（受控语义——close 广播后不自行隐藏）；
 * - 样式通道字符串断言（button 范式 ADR-0012）+ 全屏恒暗色声明。
 */
import "../../setup";
import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { IMAGE_VIEWER_NAME, bootstrapImageViewerPlugin } from "../../../components/display/image-viewer/index";

/** x-show 隐藏不摘 DOM（display:none 内联）——可见性断言走 display 通道（家族惯例） */
const isHidden = (el: Element | null): boolean => !!el && (el as HTMLElement).style.display === "none";
const isVisible = (el: Element | null): boolean => !!el && (el as HTMLElement).style.display !== "none";

/** 工具栏钮按 aria-label 定位（title 兼职 tooltip 不参与断言） */
const btn = (root: HTMLElement, label: string) => root.querySelector(`[aria-label="${label}"]`) as HTMLElement | null;

/* ── engine 回收（document 级键盘监听随实例累积，须逐用例销毁隔离） ── */
const engines: any[] = [];
const mountViewer = (html: string, state: any) => {
    const m = mount(html, state);
    engines.push(m.engine);
    return m;
};
afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

/** 标准挂载：包裹层承载事件监听（测试侧 addEventListener 断言，规避模板 @事件面） */
const mountStd = (extra = "") =>
    mountViewer(
        `<div id="wrap">
            <div x-component:autospark.image-viewer="{ images: pics, visible: viewer.open, index: viewer.idx }"></div>
        </div>${extra}`,
        { pics: ["a.png", "b.png", "c.png"], viewer: { open: false, idx: 0 } },
    );

describe("image-viewer 组件插件（ADR-0018 P2 display）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.image-viewer 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[IMAGE_VIEWER_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${IMAGE_VIEWER_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
        expect(template).toContain('id="autospark-components-image-viewer"'); // 样式幂等键
    });

    test("化身渲染：visible=false 全屏层隐藏；受控打开后主图/计数器在场", async () => {
        const { root, engine } = mountStd();
        await nextTick();
        const layer = root.querySelector(".asc-image-viewer-layer")!;
        expect(layer).toBeTruthy();
        expect(isHidden(layer)).toBe(true); // 受控关闭
        (engine.store.state as any).viewer.open = true;
        await nextTick();
        expect(isVisible(layer)).toBe(true); // 受控打开
        const img = root.querySelector(".asc-image-viewer-img") as HTMLImageElement;
        expect(img.getAttribute("src")).toBe("a.png"); // 首图
        expect(root.querySelector(".asc-image-viewer-counter")!.textContent).toContain("1 / 3");
    });

    test("下一张：change 广播 detail={index} + 主图/计数器随动 + 首页 prev disabled", async () => {
        const { root, engine } = mountStd();
        (engine.store.state as any).viewer.open = true;
        await nextTick();
        const wrap = root.querySelector("#wrap")!;
        let detail: any = "unset";
        wrap.addEventListener("change", (e) => { detail = (e as CustomEvent).detail; });
        expect(btn(root as HTMLElement, "上一张")!.disabled).toBe(true); // 首页 clamp
        expect(btn(root as HTMLElement, "下一张")!.disabled).toBe(false);
        btn(root as HTMLElement, "下一张")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(detail).toEqual({ index: 1 }); // change detail 形态
        expect((root.querySelector(".asc-image-viewer-img") as HTMLImageElement).getAttribute("src")).toBe("b.png");
        expect(root.querySelector(".asc-image-viewer-counter")!.textContent).toContain("2 / 3");
        expect(btn(root as HTMLElement, "上一张")!.disabled).toBe(false); // 离开首页
    });

    test("index 受控：外部状态直驱当前图（props 单向驱动）", async () => {
        const { root, engine } = mountStd();
        (engine.store.state as any).viewer.open = true;
        (engine.store.state as any).viewer.idx = 2;
        await nextTick();
        expect((root.querySelector(".asc-image-viewer-img") as HTMLImageElement).getAttribute("src")).toBe("c.png");
        expect(root.querySelector(".asc-image-viewer-counter")!.textContent).toContain("3 / 3");
        expect(btn(root as HTMLElement, "下一张")!.disabled).toBe(true); // 末页 clamp
    });

    test("缩放/旋转/重置：transform 内联通道 + 夹取边界", async () => {
        const { root, engine } = mountStd();
        (engine.store.state as any).viewer.open = true;
        await nextTick();
        const img = root.querySelector(".asc-image-viewer-img") as HTMLImageElement;
        // 放大两步 → 1.4；缩小四步 → 0.6（夹取通道正常步进）
        btn(root as HTMLElement, "放大")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        btn(root as HTMLElement, "放大")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(img.getAttribute("style")).toContain("scale(1.4)");
        btn(root as HTMLElement, "向右旋转")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(img.getAttribute("style")).toContain("rotate(90deg)");
        // 重置：1:1 / 0°
        btn(root as HTMLElement, "重置")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(img.getAttribute("style")).toContain("scale(1)");
        expect(img.getAttribute("style")).toContain("rotate(0deg)");
    });

    test("切图重置视图：换图后 scale/rotate 归位（同值重注入不重置）", async () => {
        const { root, engine } = mountStd();
        (engine.store.state as any).viewer.open = true;
        await nextTick();
        const img = root.querySelector(".asc-image-viewer-img") as HTMLImageElement;
        btn(root as HTMLElement, "放大")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(img.getAttribute("style")).toContain("scale(1.2)");
        // 切图（外部状态驱动 index 变化）→ 视图重置
        (engine.store.state as any).viewer.idx = 1;
        await nextTick();
        expect(img.getAttribute("style")).toContain("scale(1)");
        expect(img.getAttribute("src")).toBe("b.png");
        // 同值重注入（无关信号触发 watcher 同值重跑）→ 不重置已放大视图（边沿守卫）
        btn(root as HTMLElement, "放大")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        (engine.store.state as any).viewer.open = true; // 同值 true 幂等信号
        await nextTick();
        expect(img.getAttribute("style")).toContain("scale(1.2)"); // 保留（打开重置仅 false→true 边沿）
    });

    test("键盘通道：左右切换 / ESC 请求关闭 / ±缩放；visible=false 全局不响应", async () => {
        const { root, engine } = mountStd();
        await nextTick();
        const wrap = root.querySelector("#wrap")!;
        const changes: number[] = [];
        let closes = 0;
        wrap.addEventListener("change", (e) => { changes.push((e as CustomEvent).detail.index); });
        wrap.addEventListener("close", () => { closes++; });
        // 关闭态：键盘全静默（document 级监听不响应）
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(changes).toEqual([]);
        expect(closes).toBe(0);
        // 打开态：左右切换
        (engine.store.state as any).viewer.open = true;
        await nextTick();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        await nextTick();
        expect(changes).toEqual([1]);
        // ±缩放（+ 与 - 键）
        const img = root.querySelector(".asc-image-viewer-img") as HTMLImageElement;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "+" }));
        await nextTick();
        expect(img.getAttribute("style")).toContain("scale(1.2)");
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "-" }));
        await nextTick();
        expect(img.getAttribute("style")).toContain("scale(1)");
        // ESC 请求关闭（受控：close 广播，不自行隐藏）
        expect(isVisible(root.querySelector(".asc-image-viewer-layer"))).toBe(true);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(closes).toBe(1);
        expect(isVisible(root.querySelector(".asc-image-viewer-layer"))).toBe(true); // 未回写保持打开（受控语义）
        (engine.store.state as any).viewer.open = false;
        await nextTick();
        expect(isHidden(root.querySelector(".asc-image-viewer-layer"))).toBe(true); // 回写后关闭
    });

    test("遮罩点击请求关闭（close 广播）；images 空数组不亮相", async () => {
        const { root, engine } = mountViewer(
            `<div id="wrap"><div x-component:autospark.image-viewer="{ images: pics, visible: viewer.open }"></div></div>`,
            { pics: [], viewer: { open: true } },
        );
        await nextTick();
        expect(isHidden(root.querySelector(".asc-image-viewer-layer"))).toBe(true); // 空组防呆
        (engine.store.state as any).pics = ["x.png"]; // 整体替换（原地变异不发信号，ADR-0021 规避 5）
        await nextTick();
        expect(isVisible(root.querySelector(".asc-image-viewer-layer"))).toBe(true);
        let closes = 0;
        root.querySelector("#wrap")!.addEventListener("close", () => { closes++; });
        root.querySelector(".asc-image-viewer-mask")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(closes).toBe(1);
    });

    test("单图场景：翻页钮整体隐藏（x-show 通道）", async () => {
        const { root } = mountViewer(
            `<div><div x-component:autospark.image-viewer="{ images: pics, visible: true }"></div></div>`,
            { pics: ["only.png"] },
        );
        await nextTick();
        expect(isHidden(root.querySelector('[data-nav="prev"]'))).toBe(true);
        expect(isHidden(root.querySelector('[data-nav="next"]'))).toBe(true);
        expect(root.querySelector(".asc-image-viewer-counter")!.textContent).toContain("1 / 1");
    });
});

describe("样式通道（button 范式 ADR-0012 / 全屏恒暗色声明）", () => {
    test("三级回退链 + 恒暗遮罩语域 + reduced-motion 停播", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[IMAGE_VIEWER_NAME] as string)
            .replace(/\s+/g, " "); // ?raw CSS 断言空白归一化（oxfmt 折行防假红）
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-image-viewer-font-size, 0.875rem));");
        expect(t).toContain("background: var(--asc-image-viewer-mask, rgba(0, 0, 0, 0.72));");
        expect(t).toContain("color: var(--asc-image-viewer-btn-color, #ffffff);");
        expect(t).toContain("position: fixed;"); // 自建 fixed 全屏层形态声明
        expect(t).toContain("@media (prefers-reduced-motion: reduce) {");
        expect(t).toContain(".asc-image-viewer-layer { animation: none; }");
    });

    test("恒暗色语境声明在文件头（无暗色兜底变体的例外声明）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[IMAGE_VIEWER_NAME] as string)
            .replace(/\s+/g, " ");
        expect(t).toContain("全屏恒暗色声明");
    });

    test("工具栏自绘 SVG 静态结构（SVG 子树零指令属性——规避清单第 1 条）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[IMAGE_VIEWER_NAME] as string)
            .replace(/\s+/g, " ");
        expect(t).toContain("<circle cx=\"11\" cy=\"11\" r=\"7\"></circle>"); // 放大/缩小镜
        expect(t).not.toMatch(/<(path|circle|svg)[^>]*\s(x-|:|@)[a-z-]+=/); // SVG 元素上无指令属性
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapImageViewerPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[IMAGE_VIEWER_NAME];
        bootstrapImageViewerPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[IMAGE_VIEWER_NAME]).toBe(before);
    });
});
