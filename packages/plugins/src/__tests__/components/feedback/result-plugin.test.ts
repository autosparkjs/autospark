/**
 * result 组件插件测试（组件库 P2 反馈件，ADR-0018 清单权威表 feedback 行）：
 * - 组件形态官方样板：全局表注册 + 主题档位继承（autospark.base）；
 * - 渲染：type 四档语义色大图标（x-icon 映射）、title/description 渲染与空值退场；
 * - 插槽：icon 槽整体换图（缺省 type 映射兜底）+ 默认插槽动作区（:empty 无占位）；
 * - 纯展示语义：无事件无内部状态（模板断言）；
 * - 语义色组织（alert 同款 --asc-tone + :has() 反驱宿主）与暗色兜底变体（模板断言）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { RESULT_NAME, bootstrapResultPlugin } from "../../../components/feedback/result/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[RESULT_NAME] as string).replace(/\s+/g, " ");

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.result 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[RESULT_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${RESULT_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[RESULT_NAME];
        bootstrapResultPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[RESULT_NAME]).toBe(before);
    });

    test("纯展示语义：模板无事件派发 / 无 methods（与 alert 行内警示条正交——终态页占位）", () => {
        const t = tpl();
        expect(t).not.toContain("dispatchEvent");
        expect(t).not.toContain("methods:");
    });
});

describe("渲染", () => {
    test("type 四档：图标按 type 映射（success/error/warn/info）+ data-type 落 body（T4=B）", async () => {
        const cases: Array<[string, string]> = [
            ["success", "success"],
            ["error", "error"],
            ["warning", "warn"],
            ["info", "info"],
        ];
        for (const [type] of cases) {
            const { root } = mount(
                `<div x-component:autospark.result="{ type: '${type}', title: 'T', description: 'D' }"></div>`,
                {},
            );
            await nextTick();
            const body = root.querySelector(".asc-result-body")!;
            expect(body.getAttribute("data-type")).toBe(type); // 变体绑定落内层（根上动态绑定不求值）
            expect(root.querySelector(".asc-result-glyph")).toBeTruthy(); // x-icon 渲染的内置图标
        }
    });

    test("title/description 渲染与空值退场（x-if 结构退场）", async () => {
        const full = mount(
            `<div x-component:autospark.result="{ type: 'success', title: '提交成功', description: '预计 3 个工作日到账' }"></div>`,
            {},
        );
        await nextTick();
        expect(full.root.querySelector(".asc-result-title")!.textContent).toContain("提交成功");
        expect(full.root.querySelector(".asc-result-desc")!.textContent).toContain("预计 3 个工作日到账");

        const bare = mount(`<div x-component:autospark.result="{ type: 'info' }"></div>`, {});
        await nextTick();
        expect(bare.root.querySelector(".asc-result-title")).toBeNull(); // 空 title 不渲染
        expect(bare.root.querySelector(".asc-result-desc")).toBeNull(); // 空 description 不渲染
        expect(bare.root.querySelector(".asc-result-icon")).toBeTruthy(); // 图标位恒在（终态锚点）
    });

    test("icon 插槽整体换图：template x-slot:icon 投影替换 type 映射兜底", async () => {
        const { root } = mount(
            `<div x-component:autospark.result="{ type: 'success', title: 'T' }">
                <template x-slot:icon><img class="custom-icon" alt="自定义图" /></template>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-result-glyph")).toBeNull(); // 兜底图标被换下
        expect(root.querySelector(".asc-result-icon .custom-icon")).toBeTruthy(); // 槽内容落图标位
    });

    test("默认插槽动作区：裸子节点投影落 .asc-result-actions（button 组合配方位）", async () => {
        const { root } = mount(
            `<div x-component:autospark.result="{ type: 'error', title: '支付失败' }">
                <span class="act">重试</span><span class="act">返回</span>
            </div>`,
            {},
        );
        await nextTick();
        const actions = root.querySelector(".asc-result-actions")!;
        expect(actions.querySelectorAll(".act").length).toBe(2);
    });
});

describe("样式组织（模板断言）", () => {
    test("语义色 --asc-tone 中转 + body data-type 经 :has() 反驱宿主（alert 同款定型结构）", () => {
        const t = tpl();
        expect(t).toContain("--asc-tone: var(--auto-info-color");
        expect(t).toContain('.asc-result:has(> .asc-result-body[data-type="success"])');
        expect(t).toContain('.asc-result:has(> .asc-result-body[data-type="error"])');
        expect(t).toContain('.asc-result:has(> .asc-result-body[data-type="warning"])');
    });

    test("三级回退链 + 暗色兜底变体在场（ADR-0129）+ 动作区 :empty 无占位", () => {
        const t = tpl();
        expect(t).toContain("var(--auto-color, var(--asc-result-color,"); // 三级回退链
        expect(t).toContain("[dark] .asc-result,");
        expect(t).toContain("[data-dark] .asc-result:has(> .asc-result-body[data-type=\"error\"])");
        expect(t).toContain(".asc-result-actions:empty { display: none; }");
    });
});
