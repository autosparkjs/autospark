import { describe, expect, test } from "bun:test";
import "./setup";
import { configurable } from "autostore";
import { nextTick } from "./helpers";
import { AutoSpark } from "../engine";

/**
 * x-field 字段域指令测试（ADR-0045）。
 *
 * 覆盖：强依赖、双形态（控件 = x-model 全部语义 / 容器 = $field 注入）、$field API
 * （value/error/onInput/onChange/元数据覆盖链）、`x-bind="$field"` 控件展开键集
 * （type/value/name/白名单属性/onXxx 事件/enable→disabled 反向/checkbox→checked/select 边界）。
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

describe("x-field：强依赖与失效", () => {
    test("无祖先 x-form → 指令失效（input 保持原值、无绑定写入）", async () => {
        const { root, engine } = mountField(`<input x-field="name"/>`, { name: "fisher" });
        const input = root.querySelector("input")!;
        expect(input.value).toBe(""); // 未绑定（保持 DOM 原值，不回填）
        input.value = "x";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).name).toBe("fisher"); // 未写入
    });
});

describe("x-field：控件形态（= x-model 全部语义，决策 3）", () => {
    test("双向绑定：state→DOM 首渲 + DOM→state 写回", async () => {
        const { root, engine } = mountField(
            `<form x-form><input x-field="login.username"/></form>`,
            { login: { username: "fisher" } },
        );
        const input = root.querySelector("input")!;
        expect(input.value).toBe("fisher");
        input.value = "wx";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).login.username).toBe("wx");
        // 反向：程序改 state → DOM 更新（依赖收集穿透）
        (engine.state as any).login.username = "zhang";
        await nextTick();
        expect(input.value).toBe("zhang");
    });

    test("私有域字段读写同位（literal x-form + 域内 x-field）", async () => {
        const { root, engine } = mountField(
            `<form x-form="{username:'fisher'}"><input x-field="username"/></form>`,
            {},
        );
        const input = root.querySelector("input")!;
        expect(input.value).toBe("fisher");
        input.value = "wx";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        const scopes = (engine.state as any).$scopes as Record<string, any>;
        const entry = Object.values(scopes).find((s: any) => s && s.username !== undefined)!;
        expect(entry.username).toBe("wx"); // 写进 $scopes 域（不是根）
    });

    test("修饰符透传（.number 经 x-field-options）", async () => {
        const { root, engine } = mountField(
            `<form x-form><input x-field.number="login.age"/></form>`,
            { login: { age: 20 } },
        );
        const input = root.querySelector("input")!;
        input.value = "18";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).login.age).toBe(18);
    });

    test("ADR-0020 元数据自动注入（schema.placeholder 合成隐式 @ 绑定）", () => {
        const { root } = mountField(
            `<form x-form><input x-field="login.name"/></form>`,
            { login: { name: cfg("", { placeholder: "请输入姓名" }) } },
        );
        expect(root.querySelector("input")!.getAttribute("placeholder")).toBe("请输入姓名");
    });

    test("name 属性注入（ADR-0020 决策 8：name = 绑定路径）", () => {
        const { root } = mountField(
            `<form x-form><input x-field="login.username"/></form>`,
            { login: { username: "a" } },
        );
        expect(root.querySelector("input")!.getAttribute("name")).toBe("login.username");
    });
});

describe("x-field：容器形态（$field 注入，决策 5）", () => {
    test("$field.label / $field.widget 元数据插值", () => {
        const { root } = mountField(
            `<form x-form>
                <div x-field="login.name">
                    <label x-text="$field.label"></label>
                    <em x-text="$field.widget"></em>
                </div>
            </form>`,
            { login: { name: cfg("", { label: "用户名", widget: "text" }) } },
        );
        expect(root.querySelector("label")!.textContent).toBe("用户名");
        expect(root.querySelector("em")!.textContent).toBe("text");
    });

    test("$field.value 响应式（state 变 → 插值变，依赖收集穿透）", async () => {
        const { root, engine } = mountField(
            `<form x-form>
                <div x-field="login.name"><span x-text="$field.value"></span></div>
            </form>`,
            { login: { name: "a" } },
        );
        expect(root.querySelector("span")!.textContent).toBe("a");
        (engine.state as any).login.name = "b";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("b");
    });

    test("$field.error 桥接（完整链路：store 写入 → 显示/消失）", async () => {
        const { root, engine } = mountField(
            `<form x-form>
                <div x-field="login.age"><span x-text="$field.error"></span></div>
            </form>`,
            {
                login: {
                    age: cfg(20, {
                        validate: (v: number) => v >= 18,
                        errorMessage: "未成年",
                        onInvalid: "pass",
                    }),
                },
            },
        );
        (engine.state as any).login.age = 16;
        await nextTick();
        expect(root.querySelector("span")!.textContent).toContain("未成年");
        (engine.state as any).login.age = 20;
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("");
    });

    test("元数据覆盖链：x-field-options > schema（不写回 schema 本体）", () => {
        const { root, engine } = mountField(
            `<form x-form>
                <div x-field="login.name" x-field-options="{label:'覆盖名'}">
                    <span x-text="$field.label"></span>
                </div>
            </form>`,
            { login: { name: cfg("", { label: "原名" }) } },
        );
        expect(root.querySelector("span")!.textContent).toBe("覆盖名");
        // schema 本体未被改写
        const store = engine.store as any;
        const schema = Object.values(store.configManager.state)[0] as any;
        expect(schema.label).toBe("原名");
    });

    test("多个 x-field 的 $field 独立（不互相污染——locals 独立拷贝层）", () => {
        const { root } = mountField(
            `<form x-form>
                <div x-field="login.username"><span class="a" x-text="$field.label"></span></div>
                <div x-field="login.password"><span class="b" x-text="$field.label"></span></div>
            </form>`,
            {
                login: {
                    username: cfg("", { label: "用户名" }),
                    password: cfg("", { label: "密码" }),
                },
            },
        );
        expect(root.querySelector(".a")!.textContent).toBe("用户名");
        expect(root.querySelector(".b")!.textContent).toBe("密码");
    });
});

describe("x-bind=\"$field\"：控件展开键集（决策 6）", () => {
    test("text：value/type/name 展开初始值", () => {
        const { root } = mountField(
            `<form x-form="login">
                <div x-field="email"><input x-bind="$field"/></div>
            </form>`,
            { login: { email: cfg("a@b.c", { widget: "email", name: "邮箱" }) } },
        );
        const input = root.querySelector("input")!;
        expect(input.value).toBe("a@b.c");
        expect(input.type).toBe("email");
        expect(input.getAttribute("name")).toBe("邮箱");
    });

    test("onInput 事件封装：输入 → 写回状态", async () => {
        const { root, engine } = mountField(
            `<form x-form="login">
                <div x-field="email"><input x-bind="$field"/></div>
            </form>`,
            { login: { email: cfg("a@b.c", { widget: "email" }) } },
        );
        const input = root.querySelector("input")!;
        input.value = "x@y.z";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).login.email).toBe("x@y.z");
    });

    test("onChange 事件封装：change 事件 → 写回状态", async () => {
        const { root, engine } = mountField(
            `<form x-form="login">
                <div x-field="email"><input x-bind="$field"/></div>
            </form>`,
            { login: { email: "a@b.c" } },
        );
        const input = root.querySelector("input")!;
        input.value = "x@y.z";
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).login.email).toBe("x@y.z");
    });

    test("value 响应式：state 变 → 展开重跑 → DOM value 更新", async () => {
        const { root, engine } = mountField(
            `<form x-form="login">
                <div x-field="email"><input x-bind="$field"/></div>
            </form>`,
            { login: { email: "a@b.c" } },
        );
        const input = root.querySelector("input")!;
        (engine.state as any).login.email = "n@o.p";
        await nextTick();
        expect(input.value).toBe("n@o.p");
    });

    test("白名单属性：placeholder/required 展开（schema 有才出键）", () => {
        const { root } = mountField(
            `<form x-form="login">
                <div x-field="name"><input x-bind="$field"/></div>
            </form>`,
            { login: { name: cfg("", { placeholder: "必填项", required: true }) } },
        );
        const input = root.querySelector("input")!;
        expect(input.getAttribute("placeholder")).toBe("必填项");
        expect(input.hasAttribute("required")).toBe(true);
    });

    test("enable→disabled 反向映射", () => {
        const { root } = mountField(
            `<form x-form="login">
                <div x-field="name"><input x-bind="$field"/></div>
            </form>`,
            { login: { name: cfg("", { enable: false }) } },
        );
        expect(root.querySelector("input")!.hasAttribute("disabled")).toBe(true);
    });

    test("checkbox widget：checked 键替代 value（布尔勾选语义）", async () => {
        const { root, engine } = mountField(
            `<form x-form="login">
                <div x-field="agree"><input type="checkbox" x-bind="$field"/></div>
            </form>`,
            { login: { agree: cfg(false, { widget: "checkbox" }) } },
        );
        const input = root.querySelector("input") as HTMLInputElement;
        expect(input.checked).toBe(false);
        (engine.state as any).login.agree = true;
        await nextTick();
        expect(input.checked).toBe(true);
        input.checked = false;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).login.agree).toBe(false);
    });

    test("select：value + onChange 展开，choices 渲染 option 子树（决策 6 修订）+ 状态初选", async () => {
        const { root, engine } = mountField(
            `<form x-form="login">
                <div x-field="city"><select x-bind="$field"></select></div>
            </form>`,
            {
                login: {
                    city: cfg("qz", {
                        widget: "select",
                        choices: [
                            { label: "泉州", value: "qz" },
                            { label: "厦门", value: "xm" },
                        ],
                    }),
                },
            },
        );
        const select = root.querySelector("select")!;
        // choices 经 spread 渲染 option 子树
        expect(select.options.length).toBe(2);
        expect(select.options[0]!.textContent).toBe("泉州");
        // 状态值初选（value 键 microtask 重放）
        await nextTick();
        expect(select.value).toBe("qz");
        // change 写回
        select.value = "xm";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).login.city).toBe("xm");
    });

    test("select：schema.choices 变更 → 全量重建 + 选中重放（经 form 的 schema watcher 桥接）", async () => {
        const { root, engine } = mountField(
            `<form x-form="login">
                <div x-field="city"><select x-bind="$field"></select></div>
            </form>`,
            {
                login: {
                    city: cfg("n1", {
                        widget: "select",
                        choices: [
                            { label: "一", value: "n1" },
                            { label: "二", value: "n2" },
                        ],
                    }),
                },
            },
        );
        const select = root.querySelector("select")!;
        expect(select.options.length).toBe(2);
        // 程序改写 schema.choices（经 cm 响应式代理）→ 桥接 refresh → re-apply 重渲染
        const cm = (engine.store as any).configManager;
        cm.state["login.city"].choices = [{ label: "三", value: "n3" }];
        await nextTick();
        expect(select.options.length).toBe(1);
        expect(select.options[0]!.textContent).toBe("三");
        // state 值 "n1" 不在新集内 → 重放不勾中旧值（无匹配 option）
        await nextTick();
        expect(select.value).not.toBe("n1");
    });

    test("select：静态手写 option 优先（choices 忽略）", async () => {
        const { root } = mountField(
            `<form x-form="login">
                <div x-field="city">
                    <select x-bind="$field">
                        <option value="static">手写</option>
                    </select>
                </div>
            </form>`,
            {
                login: {
                    city: cfg("static", {
                        widget: "select",
                        choices: [{ label: "泉州", value: "qz" }],
                    }),
                },
            },
        );
        const select = root.querySelector("select")!;
        expect(select.options.length).toBe(1); // 手写保留，choices 不渲染
        expect(select.options[0]!.textContent).toBe("手写");
        await nextTick();
        expect(select.value).toBe("static");
    });

    test("label/help 等非控件元数据不进键集（不产生无效属性）", () => {
        const { root } = mountField(
            `<form x-form="login">
                <div x-field="name"><input x-bind="$field"/></div>
            </form>`,
            { login: { name: cfg("", { label: "用户名", help: "帮助", choices: [1, 2] }) } },
        );
        const input = root.querySelector("input")!;
        expect(input.getAttribute("label")).toBeNull();
        expect(input.getAttribute("help")).toBeNull();
        expect(input.getAttribute("choices")).toBeNull();
    });
});

describe("x-field：边界（决策 10）", () => {
    test("无 schema 字段：绑定照常、元数据键 undefined（不 warn）", async () => {
        const { root, engine } = mountField(
            `<form x-form>
                <div x-field="login.name">
                    <input x-bind="$field"/>
                    <span x-text="$field.label"></span>
                </div>
            </form>`,
            { login: { name: "fisher" } },
        );
        expect(root.querySelector("input")!.value).toBe("fisher");
        expect(root.querySelector("span")!.textContent).toBe("");
        const input = root.querySelector("input")!;
        input.value = "wx";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).login.name).toBe("wx");
    });

    test("路径上下文拼接失败回退原路径 + warn", () => {
        const { root } = mountField(
            `<form x-form="login">
                <div x-field="nickname"><span x-text="$field.value"></span></div>
            </form>`,
            { login: { username: "a" }, nickname: "nick" },
        );
        expect(root.querySelector("span")!.textContent).toBe("nick");
    });

    test("容器形态嵌套 x-field：内层遮蔽外层（就近原则）", () => {
        const { root } = mountField(
            `<form x-form>
                <div x-field="login.username">
                    <span class="outer" x-text="$field.label"></span>
                    <div x-field="login.password">
                        <span class="inner" x-text="$field.label"></span>
                    </div>
                </div>
            </form>`,
            {
                login: {
                    username: cfg("", { label: "用户名" }),
                    password: cfg("", { label: "密码" }),
                },
            },
        );
        expect(root.querySelector(".outer")!.textContent).toBe("用户名");
        expect(root.querySelector(".inner")!.textContent).toBe("密码");
    });
});
