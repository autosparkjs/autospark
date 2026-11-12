/**
 * progress 组件插件测试（组件库 P1 轻件，ADR-0018 清单权威表 feedback 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 变体/状态数据属性通道；
 * - percent 钳制（负归 0 / 超百归 100 / 非数字归 0）与 aria 值同步（JS 通道）；
 * - line 形态（填充 width）/ circle 形态（SVG 圆环 dashoffset 几何）双形态；
 * - status 语义色联动（显式三档 + percent>=100 自动 success）与 showText 图标切换；
 * - 样式基线（button 范式 ADR-0012）：三级回退链 + 暗色兜底 + 过渡停播（字符串断言）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { PROGRESS_NAME, bootstrapProgressPlugin } from "../../../components/feedback/progress/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[PROGRESS_NAME] as string).replace(/\s+/g, " ");

/** 填充宽度内联（引擎 :style 对象绑定输出，取 width 声明值） */
const barWidth = (root: HTMLElement) => root.querySelector<HTMLElement>(".asc-progress-bar")!.style.width;

describe("progress 组件插件（ADR-0018 P1 轻件）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.progress 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[PROGRESS_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${PROGRESS_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：line 缺省形态 + percent 填充宽度 + 百分比文本 + aria 值同步", async () => {
        const { root } = mount(
            `<div x-component:autospark.progress="{ percent: 30 }"></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-progress")!;
        expect(host).toBeTruthy();
        expect(host.getAttribute("role")).toBe("progressbar"); // 根静态属性并入宿主
        const body = host.querySelector(".asc-progress-body")!;
        expect(body.getAttribute("data-variant")).toBe("line"); // line 缺省形态
        expect(body.hasAttribute("data-status")).toBe(false); // 无状态缺省（假值变体属性整个移除）
        expect(barWidth(root)).toBe("30%");
        expect(host.querySelector(".asc-progress-pct")!.textContent).toBe("30%"); // showText 缺省开
        expect(host.getAttribute("aria-valuenow")).toBe("30"); // mounted JS 通道同步
        expect(host.getAttribute("aria-valuemax")).toBe("100");
    });

    test("percent 钳制：负数归 0 / 超百归 100 / 非数字归 0", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.progress="{ percent: -20 }"></div>` +
            `<div x-component:autospark.progress="{ percent: 150 }"></div>` +
            `<div x-component:autospark.progress="{ percent: 'abc' }"></div></div>`,
            {},
        );
        await nextTick();
        const widths = [...root.querySelectorAll<HTMLElement>(".asc-progress-bar")].map((b) => b.style.width);
        expect(widths).toEqual(["0%", "100%", "0%"]);
    });

    test("percent 响应式推进：外部状态变化即时重求值（指令值通道）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.progress="{ percent: p }"></div>`,
            { p: 40 },
        );
        await nextTick();
        expect(barWidth(root)).toBe("40%");
        (engine.store.state as { p: number }).p = 75;
        await nextTick();
        expect(barWidth(root)).toBe("75%");
        expect(root.querySelector(".asc-progress")!.getAttribute("aria-valuenow")).toBe("75"); // watch 通道同步
    });

    test("showText: false：文本出口隐藏（x-show 通道，不摘 DOM）", async () => {
        const { root } = mount(
            `<div x-component:autospark.progress="{ percent: 50, showText: false }"></div>`,
            {},
        );
        await nextTick();
        const text = root.querySelector<HTMLElement>(".asc-progress-text")!;
        expect(text).toBeTruthy();
        expect(text.style.display).toBe("none"); // x-show 隐藏（不摘 DOM）
        expect(root.querySelector(".asc-progress-icon")).toBeNull(); // 内层 x-if 分支不渲染
    });

    test("strokeWidth：--asc-progress-sw 变量经 :style 内联下发 body（line 轨道高度消费）", async () => {
        const { root } = mount(
            `<div x-component:autospark.progress="{ percent: 10, strokeWidth: 12 }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector<HTMLElement>(".asc-progress-body")!;
        expect(body.style.getPropertyValue("--asc-progress-sw")).toBe("12px");
    });
});

describe("circle 形态（SVG 圆环，JS 通道几何）", () => {
    test("化身渲染：svg 在场 + r/dasharray/dashoffset 按 strokeWidth 与 percent 现算（mounted JS 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.progress="{ percent: 50, variant: 'circle', strokeWidth: 6 }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-progress-body")!;
        expect(body.getAttribute("data-variant")).toBe("circle");
        const bar = root.querySelector<SVGCircleElement>(".asc-progress-ring-bar")!;
        expect(bar).toBeTruthy();
        // r = 50 - 6/2 = 47；周长 = 2π×47 ≈ 295.31；50% → offset ≈ 147.66
        expect(Number(bar.getAttribute("r"))).toBeCloseTo(47);
        expect(Number(bar.getAttribute("stroke-dasharray"))).toBeCloseTo(2 * Math.PI * 47, 1);
        expect(Number(bar.getAttribute("stroke-dashoffset"))).toBeCloseTo(Math.PI * 47, 1);
        // 环心文本（circle 态文本绝对居中，与 line 态同一出口）
        expect(root.querySelector(".asc-progress-pct")!.textContent).toBe("50%");
    });

    test("SVG 子树编译边界：圆环属性不经绑定通道（静态初值 + JS 通道更新，无字面泄漏歧义）", async () => {
        const t = tpl();
        // 引擎边界（compiler transformer 只认 HTMLElement）：SVG 子树内不写 :attr 绑定，
        // 几何静态初值 + mounted syncCircle 的 JS 通道——模板断言锁定该纪律
        expect(t).not.toContain(":stroke-dashoffset");
        expect(t).toContain('<svg class="asc-progress-svg" viewBox="0 0 100 100" aria-hidden="true">'); // svg 开标签无任何指令
        expect(t).toContain(".asc-progress-body[data-variant=\"circle\"] .asc-progress-svg {");
        expect(t).toContain('.asc-progress-body[data-variant="circle"] .asc-progress-track {');
    });

    test("strokeWidth 变化重算：watch 通道同步圆环几何", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.progress="{ percent: 50, variant: 'circle', strokeWidth: sw }"></div>`,
            { sw: 6 },
        );
        await nextTick();
        let bar = root.querySelector<SVGCircleElement>(".asc-progress-ring-bar")!;
        expect(Number(bar.getAttribute("r"))).toBeCloseTo(47);
        (engine.store.state as { sw: number }).sw = 10;
        await nextTick();
        bar = root.querySelector<SVGCircleElement>(".asc-progress-ring-bar")!;
        expect(Number(bar.getAttribute("r"))).toBeCloseTo(45); // 50 - 10/2
        expect(Number(bar.getAttribute("stroke-dashoffset"))).toBeCloseTo(Math.PI * 45, 1); // 50% 半环
    });

    test("circle 满环：percent=100 → dashoffset 归 0", async () => {
        const { root } = mount(
            `<div x-component:autospark.progress="{ percent: 100, variant: 'circle' }"></div>`,
            {},
        );
        await nextTick();
        expect(Number(root.querySelector(".asc-progress-ring-bar")!.getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 5);
    });
});

describe("status 联动（语义色 + 自动升档 + 图标切换）", () => {
    test("显式三档：success/error/warning 落 body data-status", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.progress="{ percent: 60, status: 'success' }"></div>` +
            `<div x-component:autospark.progress="{ percent: 60, status: 'error' }"></div>` +
            `<div x-component:autospark.progress="{ percent: 60, status: 'warning' }"></div></div>`,
            {},
        );
        await nextTick();
        const statuses = [...root.querySelectorAll(".asc-progress-body")].map((b) => b.getAttribute("data-status"));
        expect(statuses).toEqual(["success", "error", "warning"]);
    });

    test("自动升档：percent>=100 且 status 缺省 → data-status=success + 文本位换成功图标", async () => {
        const { root } = mount(
            `<div x-component:autospark.progress="{ percent: 100 }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-progress-body")!.getAttribute("data-status")).toBe("success");
        expect(root.querySelector(".asc-progress-pct")).toBeNull(); // 百分比文本让位
        expect(root.querySelector(".asc-progress-icon")!.querySelector("svg")).toBeTruthy(); // 语义图标在场
    });

    test("显式 status 优先于自动升档（percent=100 配 error 保持 error）", async () => {
        const { root } = mount(
            `<div x-component:autospark.progress="{ percent: 100, status: 'error' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-progress-body")!.getAttribute("data-status")).toBe("error");
    });

    test("circle 态 status：环色与环心图标同切（data-status 同一通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.progress="{ percent: 40, variant: 'circle', status: 'error' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-progress-body")!.getAttribute("data-status")).toBe("error");
        expect(root.querySelector(".asc-progress-icon")!.querySelector("svg")).toBeTruthy();
    });
});

describe("样式基线（button 范式 ADR-0012 / ADR-0129）", () => {
    test("--asc-tone 中转 + :has() 反驱宿主：主色缺省与三档状态块均在模板", () => {
        const t = tpl();
        expect(t).toContain("--asc-tone: var(--auto-primary-color, var(--asc-progress-primary, #009aff));");
        expect(t).toContain('.asc-progress:has(> .asc-progress-body[data-status="success"]) { --asc-tone: var(--auto-success-color, var(--asc-progress-success, #22c55e)); }');
        expect(t).toContain('.asc-progress:has(> .asc-progress-body[data-status="error"]) { --asc-tone: var(--auto-danger-color, var(--asc-progress-error, #ef4444)); }');
        expect(t).toContain('.asc-progress:has(> .asc-progress-body[data-status="warning"]) { --asc-tone: var(--auto-warning-color, var(--asc-progress-warning, #f59e0b)); }');
    });

    test("双形态过渡（width / stroke-dashoffset）与 prefers-reduced-motion 停播（badge 先例）", () => {
        const t = tpl();
        expect(t).toContain("transition: width 0.3s ease;");
        expect(t).toContain("transition: stroke-dashoffset 0.3s ease;");
        expect(t).toContain("@media (prefers-reduced-motion: reduce) {");
        expect(t).toContain(".asc-progress-bar, .asc-progress-ring-bar { transition: none; }");
    });

    test("暗色兜底变体（ADR-0129）：四档 tone 与轨道/文本暗色兜底在场", () => {
        const t = tpl();
        expect(t).toContain("[dark] .asc-progress, [data-dark] .asc-progress {");
        expect(t).toContain("--asc-tone: var(--auto-danger-color, var(--asc-progress-error, #e6696a));");
        expect(t).toContain("[dark] .asc-progress-track,");
        expect(t).toContain("[dark] .asc-progress-text,");
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapProgressPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[PROGRESS_NAME];
        bootstrapProgressPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[PROGRESS_NAME]).toBe(before);
    });
});
