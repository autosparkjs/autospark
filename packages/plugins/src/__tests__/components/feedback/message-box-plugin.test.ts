/**
 * message-box 组件插件测试（组件库 P1，ADR-0018 清单权威表 feedback 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染（x-component 直染）+ type 变体通道；
 * - i18n 内置文案（ADR-0018 决策 6 约定 1）：message-box.confirm/cancel 键查表覆译 +
 *   未装/未命中回退硬编码中文「确定」「取消」（键等值判定）；显式传入优先；
 * - type 图标映射（alert 同款）与确认钮语义色联动（danger 询问配 danger 钮）；
 * - confirm/cancel 事件出口（detail 空 + action:close 信号——x-dialog 请求关闭链）；
 * - x-dialog 组合链（本件核心边界：弹层机制全组合消费 x-dialog，勿自建弹层）：
 *   值通道开关 + props 注入 + 确认点击 → confirm 冒泡 + visible 自动回写。
 */
import "../../setup";
import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import "../../../modules/i18n/index"; // i18n 插件在场（translate 槽覆写——与 empty 测试同款双场景共用回退路径）
import "../../../components/general/button/index"; // 组合依赖：确认/取消钮（autospark.button）
import "../../../directives/overlay/index"; // x-dialog 组合链用例：overlay 家族插件（外移后测试须自挂双路径自举）
import { MESSAGE_BOX_NAME, MESSAGE_BOX_ALIAS, bootstrapMessageBoxPlugin } from "../../../components/feedback/message-box/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[MESSAGE_BOX_NAME] as string).replace(/\s+/g, " ");

/** 动作钮（data-mb-action 通道）：confirm | cancel */
const actionBtn = (root: HTMLElement, action: string) => root.querySelector(`[data-mb-action="${action}"]`);

/** 钮文案归一（button 化身子树含模板缩进空白——空白归一后比对，?raw CSS 断言同款纪律） */
const btnText = (root: HTMLElement, action: string) =>
    actionBtn(root, action)!.textContent!.replace(/\s+/g, "");

/* ── x-dialog 组合链用例的 engine 回收（弹层渲染进 document.body 容器，须整体回收隔离） ── */
const engines: any[] = [];
const mountBox = (html: string, state: any, options?: any) => {
    const m = mount(html, state, options);
    engines.push(m.engine);
    return m;
};
afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("message-box 组件插件（ADR-0018 P1）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.message-box 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[MESSAGE_BOX_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${MESSAGE_BOX_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：标题/内容 + 确认/取消双钮（i18n 回退「确定」「取消」）+ info 缺省档", async () => {
        const { root } = mount(
            `<div x-component:autospark.message-box="{ title: '删除确认', content: '此操作不可恢复，是否继续？' }"></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-message-box")!;
        expect(host).toBeTruthy();
        expect(host.getAttribute("role")).toBe("alertdialog"); // 根静态属性并入宿主
        const body = host.querySelector(".asc-message-box-body")!;
        expect(body.getAttribute("data-type")).toBe("info"); // info 缺省档
        expect(host.querySelector(".asc-message-box-title")!.textContent).toContain("删除确认");
        expect(host.querySelector(".asc-message-box-content")!.textContent).toContain("此操作不可恢复");
        // 双钮经 autospark.button 化身（组合依赖）；i18n 词典未命中回退硬编码中文
        expect(btnText(root, "confirm")).toBe("确定");
        expect(btnText(root, "cancel")).toBe("取消");
    });

    test("内容插槽优先于 content 兜底（富内容可换）", async () => {
        const { root } = mount(
            `<div x-component:autospark.message-box="{ title: '确认', content: '兜底文案' }"><strong>插槽内容</strong>优先</div>`,
            {},
        );
        await nextTick();
        const content = root.querySelector(".asc-message-box-content")!;
        expect(content.textContent).toContain("插槽内容优先");
        expect(content.textContent).not.toContain("兜底文案");
        expect(content.querySelector("strong")).toBeTruthy();
    });

    test("title 空：标题行不渲染（x-if 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.message-box="{ content: '仅内容' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-message-box-title")).toBeNull();
        expect(root.querySelector(".asc-message-box-content")!.textContent).toContain("仅内容");
    });

    test("showCancel: false：取消钮不渲染（确认钮独占动作区）", async () => {
        const { root } = mount(
            `<div x-component:autospark.message-box="{ title: '通知', showCancel: false }"></div>`,
            {},
        );
        await nextTick();
        expect(actionBtn(root as HTMLElement, "cancel")).toBeNull();
        expect(actionBtn(root as HTMLElement, "confirm")).toBeTruthy();
    });
});

describe("i18n 词典机制（ADR-0018 决策 6 约定 1）", () => {
    test("options.i18n.messages 覆译：confirm/cancel 双键按语言取译文", async () => {
        const { root } = mount(
            `<div x-component:autospark.message-box="{ title: '确认' }"></div>`,
            {},
            {
                i18n: {
                    language: "en",
                    messages: {
                        "message-box.confirm": { en: "OK" },
                        "message-box.cancel": { en: "Cancel" },
                    },
                },
            },
        );
        await nextTick();
        expect(btnText(root, "confirm")).toBe("OK");
        expect(btnText(root, "cancel")).toBe("Cancel");
    });

    test("confirmText/cancelText 显式传入优先于词典", async () => {
        const { root } = mount(
            `<div x-component:autospark.message-box="{ confirmText: '立即删除', cancelText: '再想想' }"></div>`,
            {},
        );
        await nextTick();
        expect(btnText(root, "confirm")).toBe("立即删除");
        expect(btnText(root, "cancel")).toBe("再想想");
    });
});

describe("type 图标映射与确认钮色联动（alert 同款映射）", () => {
    test("四档 type 落 body data-type + 图标位经 x-icon 渲染", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.message-box="{ title: 'a', type: 'success' }"></div>` +
            `<div x-component:autospark.message-box="{ title: 'b', type: 'warning' }"></div>` +
            `<div x-component:autospark.message-box="{ title: 'c', type: 'danger' }"></div>` +
            `<div x-component:autospark.message-box="{ title: 'd', type: 'info' }"></div></div>`,
            {},
        );
        await nextTick();
        const types = [...root.querySelectorAll(".asc-message-box-body")].map((b) => b.getAttribute("data-type"));
        expect(types).toEqual(["success", "warning", "danger", "info"]);
        for (const icon of root.querySelectorAll(".asc-message-box-icon")) {
            expect(icon.querySelector("svg")).toBeTruthy(); // x-icon 渲染在场
        }
    });

    test("确认钮 type 联动：danger 询问配 danger 色实底（confirmBtnType computed）", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.message-box="{ title: 'a' }"></div>` +
            `<div x-component:autospark.message-box="{ title: 'b', type: 'danger' }"></div>` +
            `<div x-component:autospark.message-box="{ title: 'c', confirmType: 'success' }"></div></div>`,
            {},
        );
        await nextTick();
        const btns = [...root.querySelectorAll('[data-mb-action="confirm"]')].map((b) => (b.querySelector(".asc-button-body") as HTMLElement).getAttribute("data-type"));
        expect(btns).toEqual(["primary", "danger", "success"]); // 缺省联动 / danger 联动 / 显式覆盖
    });
});

describe("事件出口（confirm/cancel + 关闭信号）", () => {
    test("确认点击：confirm 事件冒泡（detail 空）+ action:close 信号冒泡", async () => {
        const { root } = mount(
            `<div id="wrap" x-component:autospark.message-box="{ title: '确认' }"><div id="inner"></div></div>`,
            {},
        );
        await nextTick();
        const wrap = root.querySelector("#wrap")!;
        let confirms = 0;
        let closes = 0;
        let detail: unknown = "unset";
        wrap.addEventListener("confirm", (e) => { confirms++; detail = (e as CustomEvent).detail; });
        wrap.addEventListener("action:close", () => { closes++; });
        actionBtn(root as HTMLElement, "confirm")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(confirms).toBe(1);   // confirm 广播（先）
        expect(closes).toBe(1);     // action:close 关闭信号（后——请求关闭链）
        expect(detail).toBe(null);  // detail 空
    });

    test("取消点击：cancel 事件冒泡 + action:close 信号", async () => {
        const { root } = mount(
            `<div id="wrap" x-component:autospark.message-box="{ title: '确认' }"></div>`,
            {},
        );
        await nextTick();
        const wrap = root.querySelector("#wrap")!;
        let cancels = 0;
        let closes = 0;
        wrap.addEventListener("cancel", () => { cancels++; });
        wrap.addEventListener("action:close", () => { closes++; });
        actionBtn(root as HTMLElement, "cancel")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(cancels).toBe(1);
        expect(closes).toBe(1);
    });

    test("动作区空白点击不广播（容器委托命中判定）", async () => {
        const { root } = mount(
            `<div id="wrap" x-component:autospark.message-box="{ title: '确认' }"></div>`,
            {},
        );
        await nextTick();
        const wrap = root.querySelector("#wrap")!;
        let fired = 0;
        wrap.addEventListener("confirm", () => { fired++; });
        wrap.addEventListener("cancel", () => { fired++; });
        root.querySelector(".asc-message-box-actions")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await nextTick();
        expect(fired).toBe(0); // 未命中 data-mb-action 静默
    });
});

describe("x-dialog 组合链（本件核心边界——弹层机制全组合消费 x-dialog）", () => {
    test("值通道开关 + props 注入 + 确认点击 → visible 自动回写闭环", async () => {
        const { root, engine } = mountBox(
            `<div>
                <button id="open" x-dialog:message-box="ui.open"
                  x-dialog-options.props="{ title: '删除确认', content: '此操作不可恢复，是否继续？', type: 'danger' }"
                  @click="ui.open = true">删除</button>
            </div>`,
            { ui: { open: false } },
            { animate: false },
        );
        // 打开：全局表组件经 x-dialog 消费（scope 链 + 全局兜底查找）
        root.querySelector("#open")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        const panel = document.querySelector(`.autospark-overlays [data-overlay="${MESSAGE_BOX_ALIAS}"]`);
        expect(panel).toBeTruthy(); // 弹层渲染进 body 容器（组合链通）
        expect(panel!.querySelector(".asc-message-box-title")!.textContent).toContain("删除确认"); // props 注入
        expect(panel!.querySelector(".asc-message-box-body")!.getAttribute("data-type")).toBe("danger");

        // 确认点击：confirm 事件自弹层根冒泡到 document（物理边界——模板内 @confirm 收不到）
        let confirmed = 0;
        const onConfirm = () => { confirmed++; };
        document.addEventListener("confirm", onConfirm);
        panel!.querySelector('[data-mb-action="confirm"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        document.removeEventListener("confirm", onConfirm);
        expect(confirmed).toBe(1);
        // visible 自动回写（action:close → 请求关闭链 → 值通道回写 false）
        expect((engine.store.state as any).ui.open).toBe(false);
    });
});

describe("样式基线（button 范式 ADR-0012 / ADR-0129）", () => {
    test("--asc-tone 中转 + :has() 反驱宿主：四档语义色块均在模板", () => {
        const t = tpl();
        expect(t).toContain("--asc-tone: var(--auto-info-color, var(--asc-message-box-info, #71717a));");
        expect(t).toContain('.asc-message-box:has(> .asc-message-box-body[data-type="success"]) { --asc-tone: var(--auto-success-color, var(--asc-message-box-success, #22c55e)); }');
        expect(t).toContain('.asc-message-box:has(> .asc-message-box-body[data-type="warning"]) { --asc-tone: var(--auto-warning-color, var(--asc-message-box-warning, #f59e0b)); }');
        expect(t).toContain('.asc-message-box:has(> .asc-message-box-body[data-type="danger"]) { --asc-tone: var(--auto-danger-color, var(--asc-message-box-danger, #ef4444)); }');
    });

    test("组合依赖声明：嵌套 autospark.button 化身 + 文案走 label props（嵌套插槽忽略规避）", () => {
        const t = tpl();
        expect(t).toContain("x-component:autospark.button=");
        expect(t).toContain("label: cancelText || (t('message-box.cancel')");
        expect(t).toContain("label: confirmText || (t('message-box.confirm')");
    });

    test("暗色兜底变体（ADR-0129）：四档 tone 与标题/内容暗色兜底在场", () => {
        const t = tpl();
        expect(t).toContain("[dark] .asc-message-box, [data-dark] .asc-message-box {");
        expect(t).toContain("--asc-tone: var(--auto-danger-color, var(--asc-message-box-danger, #e6696a));");
        expect(t).toContain("[dark] .asc-message-box-title,");
        expect(t).toContain("[dark] .asc-message-box-content,");
    });

    test("与 x-dialog 的边界声明在文件头（ADR-0018 决策 3）", () => {
        expect(tpl()).toContain("与 x-dialog 的边界声明");
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapMessageBoxPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[MESSAGE_BOX_NAME];
        bootstrapMessageBoxPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[MESSAGE_BOX_NAME]).toBe(before);
    });
});
