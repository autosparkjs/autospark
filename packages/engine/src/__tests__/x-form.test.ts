import { describe, expect, test, mock } from "bun:test";
import "./setup";
import { configurable } from "autostore";
import { nextTick } from "./helpers";
import { AutoSpark } from "../engine";

/**
 * x-form 表单域指令测试（ADR-0045）。
 *
 * 覆盖：值三形态（空/字面量/路径）、mount 强制 local、submit 校验门、reset 快照回滚、
 * `$form` 上下文（getState 双形态 / dirty / valid / errors / 字段名三层解析与冲突）。
 */

/** 本地 configurable 包装（放宽 options 类型，规避重载噪音） */
function cfg(initial: any, options: Record<string, any>) {
    return configurable(initial, options as any);
}

/** 挂载辅助：裸状态自建 store（engine 默认 configManager，ADR-0044） */
function mountForm(html: string, state: any, options?: any) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, options);
    return { root, engine, form: root.querySelector("form")! };
}

/** 派发 submit/reset（cancelable，断言 defaultPrevented） */
const fire = (el: Element, type: string) =>
    el.dispatchEvent(new Event(type, { cancelable: true, bubbles: true }));

describe("x-form：值三形态", () => {
    test("literal 建私有域（字段插值可见 + 控件绑定读写）", async () => {
        const { root, engine } = mountForm(
            `<form x-form="{username:'fisher'}">
                <input x-field="username"/>
                <span x-text="username"></span>
            </form>`,
            {},
        );
        const input = root.querySelector("input")!;
        expect(input.value).toBe("fisher");
        expect(root.querySelector("span")!.textContent).toBe("fisher");
        input.value = "wx";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("wx");
        // 域数据不进根 state（mount 强制 local，决策 2）
        expect((engine.state as any).username).toBeUndefined();
        expect((engine.state as any).$scopes).toBeDefined();
    });

    test("空 x-form = 行为壳（字段走全局状态绝对路径）", () => {
        const { root } = mountForm(
            `<form x-form="">
                <input x-field="login.username"/>
            </form>`,
            { login: { username: "fisher" } },
        );
        expect(root.querySelector("input")!.value).toBe("fisher");
    });

    test("路径形态命中全局状态 → 建立路径上下文（x-field 相对路径拼接，决策 2/4）", () => {
        const { root } = mountForm(
            `<form x-form="login">
                <div x-field="username">
                    <input x-bind="$field"/>
                    <span x-text="$field.value"></span>
                </div>
            </form>`,
            { login: { username: "fisher" } },
        );
        expect(root.querySelector("input")!.value).toBe("fisher");
        expect(root.querySelector("span")!.textContent).toBe("fisher");
    });

    test("路径形态支持嵌套相对路径", () => {
        const { root } = mountForm(
            `<form x-form="user">
                <input x-field="address.city"/>
            </form>`,
            { user: { address: { city: "泉州" } } },
        );
        expect(root.querySelector("input")!.value).toBe("泉州");
    });

    test("路径未命中 → warn 退化为行为壳（绝对路径字段仍工作）", () => {
        const { root } = mountForm(
            `<form x-form="notexist">
                <input x-field="login.username"/>
            </form>`,
            { login: { username: "fisher" } },
        );
        expect(root.querySelector("input")!.value).toBe("fisher");
    });

    test("mount/global 选项被忽略（强制 local）+ warn", () => {
        const { root, engine } = mountForm(
            `<form x-form="{a:1}" x-form-options="{mount:'x'}"></form>`,
            {},
        );
        expect((engine.state as any).x).toBeUndefined();
        expect((engine.state as any).$scopes).toBeDefined();
        void root;
    });
});

describe("x-form：submit 校验门（决策 8）", () => {
    test("恒 preventDefault（拦截原生提交）", () => {
        const { form } = mountForm(`<form x-form action="/x"><button type="submit"></button></form>`, {});
        expect(fire(form, "submit")).toBe(false); // cancelable + preventDefault → dispatchEvent 返回 false
    });

    test("校验通过 → @submit action 放行执行", () => {
        const calls: string[] = [];
        const { form } = mountForm(
            `<form x-form="{name:'ok'}" @submit="save">
                <input x-field="name"/>
                <button type="submit">注册</button>
            </form>`,
            {},
            { actions: { save: () => calls.push("save") } },
        );
        fire(form, "submit");
        expect(calls).toEqual(["save"]);
    });

    test("校验失败（schema.validate 直调）→ action 不执行 + $field.error 显示", async () => {
        const calls: string[] = [];
        const { root, form } = mountForm(
            `<form x-form @submit="save">
                <div x-field="login.name">
                    <input x-bind="$field"/>
                    <span x-text="$field.error"></span>
                </div>
                <button type="submit">注册</button>
            </form>`,
            {
                login: {
                    name: cfg("", {
                        validate: (v: string) => v.length > 0,
                        errorMessage: "必填字段",
                        onInvalid: "pass",
                    }),
                },
            },
            { actions: { save: () => calls.push("save") } },
        );
        const input = root.querySelector("input")!;
        // 写入触发写入校验（表单级 onInvalid 默认 pass，错误静默收集）
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        fire(form, "submit");
        expect(calls).toEqual([]); // 校验门拦截
        await nextTick();
        expect(root.querySelector("span")!.textContent).toContain("必填");
    });

    test("validateOnSubmit:false → 关闭校验门直接放行", () => {
        const calls: string[] = [];
        const { form } = mountForm(
            `<form x-form x-form-options="{validateOnSubmit:false}" @submit="save">
                <input x-field="login.name"/>
            </form>`,
            { login: { name: cfg("", { validate: (v: string) => v.length > 0 }) } },
            { actions: { save: () => calls.push("save") } },
        );
        fire(form, "submit");
        expect(calls).toEqual(["save"]);
    });
});

describe("x-form：reset 快照回滚（决策 8）", () => {
    test("reset 事件 → preventDefault + 状态回初始快照 + dirty 复位", async () => {
        const { root, form, engine } = mountForm(
            `<form x-form="{username:'fisher'}">
                <input x-field="username"/>
                <span x-text="$form.dirty"></span>
                <button type="reset">重置</button>
            </form>`,
            {},
        );
        const input = root.querySelector("input")!;
        input.value = "changed";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("true");
        expect(fire(form, "reset")).toBe(false);
        await nextTick();
        expect(input.value).toBe("fisher");
        expect(root.querySelector("span")!.textContent).toBe("false");
        // 域内状态确已回滚
        const scopes = (engine.state as any).$scopes as Record<string, any>;
        const entry = Object.values(scopes).find((s) => s && s.username !== undefined);
        expect(entry!.username).toBe("fisher");
    });
});

describe("$form：表单上下文（决策 7）", () => {
    test("getState() 无参 → { name: 值 }（默认 name = 路径末段）", () => {
        const { root } = mountForm(
            `<form x-form>
                <input x-field="login.username"/>
                <input x-field="login.password"/>
                <span x-text="JSON.stringify($form.getState())"></span>
            </form>`,
            { login: { username: "fisher", password: "123" } },
        );
        expect(root.querySelector("span")!.textContent).toBe(JSON.stringify({ username: "fisher", password: "123" }));
    });

    test("getState() name 三层解析（schema.name > 默认末段；x-field-options 最高）", () => {
        const { root } = mountForm(
            `<form x-form>
                <input x-field="login.username"/>
                <input x-field="login.password" x-field-options="{name:'pwd'}"/>
                <span x-text="JSON.stringify($form.getState())"></span>
            </form>`,
            {
                login: {
                    username: cfg("fisher", { name: "用户名" }),
                    password: "123",
                },
            },
        );
        expect(root.querySelector("span")!.textContent).toBe(JSON.stringify({ 用户名: "fisher", pwd: "123" }));
    });

    test("getState(true) → { path: value }（键为完整状态路径）", () => {
        const { root } = mountForm(
            `<form x-form="login">
                <input x-field="username"/>
                <span x-text="JSON.stringify($form.getState(true))"></span>
            </form>`,
            { login: { username: "fisher" } },
        );
        expect(root.querySelector("span")!.textContent).toBe(JSON.stringify({ "login.username": "fisher" }));
    });

    test("name 冲突 → 后者覆盖 + warn", () => {
        const { root } = mountForm(
            `<form x-form>
                <input x-field="login.username"/>
                <input x-field="profile.username"/>
                <span x-text="JSON.stringify($form.getState())"></span>
            </form>`,
            { login: { username: "a" }, profile: { username: "b" } },
        );
        expect(root.querySelector("span")!.textContent).toBe(JSON.stringify({ username: "b" }));
    });

    test("valid / errors：校验错误聚合（写入即校验 + 桥接）", async () => {
        const { root } = mountForm(
            `<form x-form>
                <input x-field="login.age"/>
                <span class="v" x-text="$form.valid"></span>
                <span class="e" x-text="JSON.stringify($form.errors)"></span>
            </form>`,
            {
                login: {
                    age: cfg(20, {
                        validate: (v: number) => v >= 18,
                        onInvalid: "pass",
                        errorMessage: "未成年",
                    }),
                },
            },
        );
        expect(root.querySelector(".v")!.textContent).toBe("true");
        const input = root.querySelector("input")!;
        input.value = "16";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(root.querySelector(".v")!.textContent).toBe("false");
        expect(root.querySelector(".e")!.textContent).toContain("未成年");
    });
});

describe("x-form：边界", () => {
    test("非 form 元素声明 → warn 但行为壳照常", () => {
        const { root } = mountForm(
            `<div x-form><input x-field="login.name"/></div>`,
            { login: { name: "fisher" } },
        );
        expect(root.querySelector("input")!.value).toBe("fisher");
    });

    test("x-form 嵌套：内层表单就近遮蔽（x-field 归属最近 x-form）", () => {
        const { root } = mountForm(
            `<form x-form="outer">
                <input x-field="name"/>
                <form x-form="inner">
                    <input class="inner-name" x-field="name"/>
                </form>
            </form>`,
            { outer: { name: "outerName" }, inner: { name: "innerName" } },
        );
        const inputs = root.querySelectorAll("input");
        expect(inputs[0]!.value).toBe("outerName");
        expect(inputs[1]!.value).toBe("innerName");
    });

    test("mock 引用防摇树（保留 mock 导入）", () => {
        expect(typeof mock).toBe("function");
    });
});
