import { describe, expect, test } from "bun:test";
import "./setup";
import { configurable } from "autostore";
import { nextTick } from "./helpers";
import { AutoSpark } from "../engine";

/**
 * x-field schema 转换函数（toInput/toState）测试（ADR-0050）。
 *
 * 覆盖：控件形态（text/radio/select 单选多选/checkbox）双向转换、容器形态（$field.value
 * getter/setter、handler、spread checked 键）、空值接管（声明 toInput → default 回填退出）、
 * 显式 get 优先、失败不破坏（读回退原值/写放弃 + 防循环标志回滚）、form 层恒原始值。
 */

function cfg(initial: any, options: Record<string, any>) {
    return configurable(initial, options as any);
}

function mountField(html: string, state: any, options?: any) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, options);
    return { root, engine };
}

/** sex 字段的标准转换对（1↔"男"、0↔"女"） */
const SEX = {
    toInput: (v: any) => (v === 1 ? "男" : v === 0 ? "女" : ""),
    toState: (v: any) => (v === "男" ? 1 : v === "女" ? 0 : v),
};

describe("x-field 转换：控件形态（ADR-0050）", () => {
    test("text 双向：state=1 显示「男」，输入「女」写回 0", async () => {
        const { root, engine } = mountField(
            `<form x-form><input x-field="user.sex"/></form>`,
            { user: { sex: cfg(1, SEX) } },
        );
        const input = root.querySelector("input")!;
        expect(input.value).toBe("男");
        input.value = "女";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).user.sex).toBe(0);
        // 程序改 state → toInput 再渲染
        (engine.state as any).user.sex = 1;
        await nextTick();
        expect(input.value).toBe("男");
    });

    test("radio：toInput 产物匹配 value 属性（数字 state ↔ 字符串 value）", async () => {
        const { root, engine } = mountField(
            `<form x-form>
                <input type="radio" name="sex" value="1" x-field="user.sex"/>
                <input type="radio" name="sex" value="0" x-field="user.sex"/>
            </form>`,
            {
                user: {
                    sex: cfg(1, {
                        toInput: (v: any) => (v === undefined || v === null ? "" : String(v)),
                        toState: (v: any) => (v === "1" ? 1 : v === "0" ? 0 : v),
                    }),
                },
            },
        );
        const radios = root.querySelectorAll<HTMLInputElement>("input");
        expect(radios[0]!.checked).toBe(true);
        expect(radios[1]!.checked).toBe(false);
        // 勾选另一支 → toState 写数字 0
        radios[1]!.checked = true;
        radios[1]!.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).user.sex).toBe(0);
        // 程序改回 1 → toInput("1") 勾中第一支
        (engine.state as any).user.sex = 1;
        await nextTick();
        expect(radios[0]!.checked).toBe(true);
        expect(radios[1]!.checked).toBe(false);
    });

    test("select 单选：数字 state 勾中字符串 option + 选择写回经 toState", async () => {
        const { root, engine } = mountField(
            `<form x-form><select x-field="user.sex"></select></form>`,
            {
                user: {
                    sex: cfg(1, {
                        widget: "select",
                        choices: [
                            { label: "男", value: 1 },
                            { label: "女", value: 0 },
                        ],
                        toInput: (v: any) => (v === undefined || v === null ? "" : String(v)),
                        toState: (v: any) => (v === "1" ? 1 : v === "0" ? 0 : v),
                    }),
                },
            },
        );
        const select = root.querySelector("select")!;
        expect(select.options.length).toBe(2);
        await nextTick();
        expect(select.value).toBe("1"); // toInput(1)="1" 勾中
        select.value = "0";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).user.sex).toBe(0); // toState("0") → 0（非字符串）
    });

    test("select 多选：toInput/toState 逐项", async () => {
        const { root, engine } = mountField(
            `<form x-form><select x-field="user.tags"></select></form>`,
            {
                user: {
                    tags: cfg([1, 2], {
                        widget: "select",
                        multiple: true,
                        choices: [
                            { label: "一", value: 1 },
                            { label: "二", value: 2 },
                            { label: "三", value: 3 },
                        ],
                        toInput: (v: any) => String(v),
                        toState: (v: any) => Number(v),
                    }),
                },
            },
        );
        const select = root.querySelector<HTMLSelectElement>("select")!;
        expect(select.multiple).toBe(true);
        await nextTick();
        // state [1,2] 逐项 toInput → ["1","2"] 勾中前两项
        expect(select.options[0]!.selected).toBe(true);
        expect(select.options[1]!.selected).toBe(true);
        expect(select.options[2]!.selected).toBe(false);
        // 勾选第三项 → 逐项 toState → 数字数组
        select.options[2]!.selected = true;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).user.tags).toEqual([1, 2, 3]);
    });

    test("checkbox：toInput 读勾选态 + toState 写 1/0（布尔→数字的唯一通道）", async () => {
        const { root, engine } = mountField(
            `<form x-form><input type="checkbox" x-field="user.on"/></form>`,
            {
                user: {
                    on: cfg(1, {
                        toInput: (v: any) => v === 1,
                        toState: (b: any) => (b ? 1 : 0),
                    }),
                },
            },
        );
        const input = root.querySelector("input") as HTMLInputElement;
        expect(input.checked).toBe(true); // Boolean(toInput(1)=true)
        input.checked = false;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).user.on).toBe(0); // toState(false) → 0
        (engine.state as any).user.on = 1;
        await nextTick();
        expect(input.checked).toBe(true);
    });

    test("select autoSelect 回写经 toState（_writeToState 统一出口）", async () => {
        const { root, engine } = mountField(
            `<form x-form><select x-field="user.sex"></select></form>`,
            {
                user: {
                    // 字符串 "9" 不在选项集内（autoSelect 仅对字符串 display 生效）；
                    // toInput/toState 成对声明——toState 写回数字后读方向靠 toInput 桥接匹配
                    sex: cfg("9", {
                        widget: "select",
                        choices: [
                            { label: "男", value: 1 },
                            { label: "女", value: 0 },
                        ],
                        toInput: (v: any) => (v == null ? "" : String(v)),
                        toState: (v: any) => (v === "1" ? 1 : v === "0" ? 0 : v),
                    }),
                },
            },
        );
        await nextTick();
        // autoSelect 勾中首项并回写 "1"——回写经 toState → 数字 1
        expect((engine.state as any).user.sex).toBe(1);
    });

    test("显式 get 优先：toInput 忽略（不叠加）", async () => {
        const { root } = mountField(
            `<form x-form><input x-field="user.sex" x-field-options="{get:'value+1'}"/></form>`,
            { user: { sex: cfg(1, SEX) } },
        );
        // get(stateValue=1) = 2；toInput 若参与会显示「男」——get 赢
        expect(root.querySelector("input")!.value).toBe("2");
    });

    test("修饰符在前、toState 在后（.number → toState）", async () => {
        const { root, engine } = mountField(
            `<form x-form><input x-field.number="user.score"/></form>`,
            { user: { score: cfg(0, { toState: (v: any) => v * 10 }) } },
        );
        const input = root.querySelector("input")!;
        input.value = "5";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        // "5" → .number → 5 → toState → 50（若 toState 在前会得到 NaN）
        expect((engine.state as any).user.score).toBe(50);
    });
});

describe("x-field 转换：容器形态（$field，ADR-0050）", () => {
    test("$field.value getter 显示转换值 + 响应式", async () => {
        const { root, engine } = mountField(
            `<form x-form>
                <div x-field="user.sex"><span x-text="$field.value"></span></div>
            </form>`,
            { user: { sex: cfg(1, SEX) } },
        );
        const span = root.querySelector("span")!;
        expect(span.textContent).toBe("男");
        (engine.state as any).user.sex = 0;
        await nextTick();
        expect(span.textContent).toBe("女");
    });

    test("$field.value setter 经 toState", async () => {
        const { root, engine } = mountField(
            `<form x-form>
                <div x-field="user.sex"><button @click="$field.value = '女'">f</button></div>
            </form>`,
            { user: { sex: cfg(1, SEX) } },
        );
        root.querySelector("button")!.dispatchEvent(new Event("click"));
        await nextTick();
        expect((engine.state as any).user.sex).toBe(0);
    });

    test("spread checked 键经 toInput + Boolean（checkbox widget）", async () => {
        const { root, engine } = mountField(
            `<form x-form>
                <div x-field="user.on"><input type="checkbox" x-bind="$field"/></div>
            </form>`,
            {
                user: {
                    on: cfg(1, {
                        widget: "checkbox",
                        toInput: (v: any) => v === 1,
                        toState: (b: any) => (b ? 1 : 0),
                    }),
                },
            },
        );
        const input = root.querySelector("input") as HTMLInputElement;
        expect(input.checked).toBe(true);
        input.checked = false;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).user.on).toBe(0); // handler 写方向过 toState
    });

    test("form 层恒原始值：$form.getState() 返回 0/1 而非「男/女」", async () => {
        const { root, engine } = mountField(
            `<form x-form>
                <input x-field="user.sex"/>
                <em x-text="$form.getState().sex"></em>
            </form>`,
            { user: { sex: cfg(1, SEX) } },
        );
        expect(root.querySelector("em")!.textContent).toBe("1"); // 原始状态值
        const input = root.querySelector("input")!;
        input.value = "女";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).user.sex).toBe(0);
        expect(root.querySelector("em")!.textContent).toBe("0"); // 仍是原始值
    });
});

describe("x-field 转换：空值接管与失败语义（ADR-0050）", () => {
    test("声明 toInput 即接管空值：default 元数据失效（Q12a）", async () => {
        const { root, engine } = mountField(
            `<form x-form><input x-field="user.name"/></form>`,
            {
                user: {
                    name: cfg(null, {
                        default: "未知",
                        toInput: (v: any) => (v == null ? "" : String(v)),
                    }),
                },
            },
        );
        // toInput(null) → ""：产物直出控件，default「未知」不参与
        expect(root.querySelector("input")!.value).toBe("");
        expect((engine.state as any).user.name).toBeNull(); // 仅显示层，state 不回写
    });

    test("无 toInput：空值回填照旧（ADR-0027 回归）", () => {
        const { root } = mountField(
            `<form x-form><input x-field="user.name"/></form>`,
            { user: { name: cfg(null, { default: "未知" }) } },
        );
        expect(root.querySelector("input")!.value).toBe("未知");
    });

    test("toInput throw：warn 一次 + 原值直出（不切回框架兜底）", () => {
        const { root } = mountField(
            `<form x-form><input x-field="user.name"/></form>`,
            {
                user: {
                    name: cfg(null, {
                        default: "未知",
                        toInput: () => {
                            throw new Error("boom");
                        },
                    }),
                },
            },
        );
        // 原值 null 直出 → text 空串显示；default「未知」不参与（未切回框架兜底）
        expect(root.querySelector("input")!.value).toBe("");
    });

    test("toState throw：放弃本次写入 + 防循环标志回滚（外部写入仍更新显示）", async () => {
        const { root, engine } = mountField(
            `<form x-form><input x-field="user.name"/></form>`,
            {
                user: {
                    name: cfg("a", {
                        toState: () => {
                            throw new Error("bad");
                        },
                    }),
                },
            },
        );
        const input = root.querySelector("input")!;
        input.value = "x";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).user.name).toBe("a"); // 写入被放弃
        // 标志已回滚：外部写入的 read 回调不被误跳过
        (engine.state as any).user.name = "ok";
        await nextTick();
        expect(input.value).toBe("ok");
    });
});
