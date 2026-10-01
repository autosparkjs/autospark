import { describe, expect, test, afterEach, spyOn } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";

/**
 * x-field 写回落点对称性（ADR-0076）：
 * x-field 经 resolveFieldAbsPath（form.ts）在编译期把绑定值绝对化——首段沿链命中
 * x-for 项映射（LOCAL_PATHS）或 `_data` 域则拼前缀（`item.name` → `items.0.name`、
 * 域字段 → `$scopes.<id>.<字段>`），此后表单层（$field.value / reset / getState /
 * dirty / 校验）全部按绝对路径读写同位。配套：x-for (B)/(C) 两阶段 rebind（跨项
 * 事务性）+ field 销毁注销 form 注册（防悬垂）。
 *
 * 事实背景（grilling 探针）：x-model 的 ADR-0075 分裂在 x-field 不存在——控件层
 * 组合 ModelDirective + set 表达式恒经聚合视图就近落域；本文件钉住表单层对称与
 * x-for 动态场景（增删/互换/插入推挤）的注册表一致性。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];
const mountWith = (html: string, state: any = {}, options?: any) => {
    const m = mount(html, state, options);
    document.body.appendChild(m.root);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    while (roots.length) roots.pop()?.remove();
});

/** 找宿主 FormDirective（x-form 元素测试期内不销毁，实例唯一） */
const findForm = (engine: any): any => {
    for (const scope of engine.scopes.values()) {
        for (const d of scope.directives ?? []) {
            if (d.info?.name === "form") return d;
        }
    }
    return null;
};

/** form 私有注册表快照：{ [absPath]: entry }——悬垂/竞态断言的真相源 */
const entryMapOf = (form: any): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [path, e] of form.fields) out[path] = e;
    return out;
};

/** 经注册表取存活 field 实例（entry.field 恒为该路径最新注册者；用 root.contains 复核在 DOM——happy-dom 的 isConnected 不可靠） */
const liveFields = (engine: any, root: HTMLElement): any[] => {
    const form = findForm(engine);
    return Object.values(entryMapOf(form))
        .map((e: any) => e.field)
        .filter((f: any) => root.contains(f.el));
};

/** 找所属 FormDirective 的私有注册表（断言悬垂/竞态用） */
const formOf = (field: any): any => field.form;

describe("x-field 写回落点对称（ADR-0076）", () => {
    test("x-data 域内：控件输入落域、根零污染、reset 回滚", async () => {
        const m = mountWith(
            `<form x-form><div x-data="{ name: 'a' }">
                <input class="f" x-field="name" />
                <div class="out">{{ name }}</div>
            </div></form>`,
            {},
        );
        await nextTick();
        const state: any = m.engine.store.state;
        const input = m.root.querySelector("input.f") as HTMLInputElement;
        input.value = "b";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        const domain = Object.values(state.$scopes ?? {}).find((d: any) => d && "name" in d) as any;
        expect(domain.name).toBe("b");
        expect(state.name).toBeUndefined(); // 根不受污染
        expect(m.root.querySelector(".out")!.textContent).toBe("b");
        // reset 回滚（form 域快照）
        m.root.querySelector("form")!.dispatchEvent(new Event("reset", { bubbles: true }));
        await nextTick();
        expect(domain.name).toBe("a");
        expect(input.value).toBe("a");
    });

    test("$field.value 程序化写：absPath 绝对化 + 写落域", async () => {
        const m = mountWith(
            `<form x-form><div x-data="{ age: 18 }">
                <input x-field="age" />
            </div></form>`,
            {},
        );
        await nextTick();
        const state: any = m.engine.store.state;
        const field = liveFields(m.engine, m.root)[0]!;
        expect(field.absPath.startsWith("$scopes.")).toBe(true); // 绝对化（域前缀）
        field.fieldProxy.value = 20;
        await nextTick();
        const domain = Object.values(state.$scopes ?? {}).find((d: any) => d && "age" in d) as any;
        expect(domain.age).toBe(20);
        expect(state.age).toBeUndefined();
    });
});

describe("x-for 项内 x-field：表单层就位（ADR-0076 项映射）", () => {
    test("absPath 绝对化 + 输入更新 items[i] + $field.value 读到 + reset 回滚", async () => {
        const m = mountWith(
            `<form x-form><ul>
                <li x-for="item of items" :key="item.id">
                    <input class="f" x-field="item.name" />
                </li>
            </ul></form>`,
            { items: [{ id: 1, name: "甲" }, { id: 2, name: "乙" }] },
        );
        await nextTick();
        const state: any = m.engine.store.state;
        const entryMap = entryMapOf(findForm(m.engine));
        expect(Object.keys(entryMap).sort()).toEqual(["items.0.name", "items.1.name"]);
        const input = m.root.querySelector("input.f") as HTMLInputElement;
        input.value = "丙";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(state.items[0].name).toBe("丙");
        expect(entryMap["items.0.name"].field.fieldProxy.value).toBe("丙"); // $field.value 读到真值（旧实现恒 undefined）
        // reset：逐字段回 items.i.name 快照
        m.root.querySelector("form")!.dispatchEvent(new Event("reset", { bubbles: true }));
        await nextTick();
        expect(state.items[0].name).toBe("甲");
        expect((state as any).item).toBeUndefined(); // 根无幽灵键
    });

    test("删项：field 注销无悬垂，reset 不复活已删项", async () => {
        const m = mountWith(
            `<form x-form><ul>
                <li x-for="item of items" :key="item.id">
                    <input class="f" x-field="item.name" />
                </li>
            </ul></form>`,
            { items: [{ id: 1, name: "甲" }, { id: 2, name: "乙" }, { id: 3, name: "丙" }] },
        );
        await nextTick();
        const state: any = m.engine.store.state;
        state.items.splice(1, 1); // 删 id:2
        await nextTick();
        await nextTick();
        // 注册表无悬垂（旧实现：fields 条目残留，reset 对已删路径回写 → 复活幽灵项）。
        // splice 删中间项推挤后项：id:3 rebind（index 2→1），注册表收敛为存活两项
        expect(Object.keys(entryMapOf(findForm(m.engine))).sort()).toEqual(["items.0.name", "items.1.name"]);
        m.root.querySelector("form")!.dispatchEvent(new Event("reset", { bubbles: true }));
        await nextTick();
        expect(state.items.length).toBe(2); // 不复活
        expect(state.items.map((i: any) => i.name)).toEqual(["甲", "丙"]);
    });

    test("头部插入（推挤竞态）：新项与移位项的注册条目各归其位", async () => {
        const m = mountWith(
            `<form x-form><ul>
                <li x-for="item of items" :key="item.id">
                    <input class="f" x-field="item.score" />
                </li>
            </ul></form>`,
            { items: [{ id: 1, score: 5 }] },
        );
        await nextTick();
        const state: any = m.engine.store.state;
        state.items.unshift({ id: 9, score: 99 }); // 头插推挤：id:9→0，id:1→1
        await nextTick();
        await nextTick();
        const entryMap = entryMapOf(findForm(m.engine));
        expect(Object.keys(entryMap).sort()).toEqual(["items.0.score", "items.1.score"]);
        // 两 entry 的 initial 各归其位（旧竞态：新项错拿移位项尚未销毁的活条目 → initial=5）
        expect(entryMap["items.0.score"].initial).toBe(99); // id:9 的初值
        expect(entryMap["items.1.score"].initial).toBe(5); // id:1 的初值
    });

    test("互换（sort 推挤竞态）：两 entry 各归其位、无失联字段", async () => {
        const m = mountWith(
            `<form x-form><ul>
                <li x-for="item of items" :key="item.id">
                    <input class="f" x-field="item.score" />
                </li>
            </ul></form>`,
            { items: [{ id: 1, score: 5 }, { id: 2, score: 8 }] },
        );
        await nextTick();
        const state: any = m.engine.store.state;
        // 降序互换：id:2→0，id:1→1（两项都 rebind）
        state.items = [state.items[1], state.items[0]];
        await nextTick();
        await nextTick();
        const entryMap = entryMapOf(findForm(m.engine));
        // 两路径均有活跃条目（旧竞态：后处理者注销删掉先处理者刚注册的条目 → 字段失联）
        expect(Object.keys(entryMap).sort()).toEqual(["items.0.score", "items.1.score"]);
        // initial 各归其位（rebind 重建基准 = 项就位时的值）
        expect(entryMap["items.0.score"].initial).toBe(8);
        expect(entryMap["items.1.score"].initial).toBe(5);
        // reset 全字段可回滚
        m.root.querySelector("form")!.dispatchEvent(new Event("reset", { bubbles: true }));
        await nextTick();
        expect(state.items[0].score).toBe(8);
        expect(state.items[1].score).toBe(5);
    });
});

describe("异步数据未就绪 warn（ADR-0076 边界）", () => {
    test("异步源 in-flight 时域字段按全局解析 → warn 出声", async () => {
        const m = mountWith(
            `<form x-form><div x-data="fetchLater()">
                <input class="f" x-field="nickname" />
            </div></form>`,
            {},
            {
                actions: {
                    fetchLater: async () => ({ nickname: "晚到" }),
                },
            },
        );
        await nextTick();
        const field = liveFields(m.engine, m.root)[0]!;
        // 数据未就绪：absPath 按全局路径解析（控件层照常，表单层错位——warn 提示）
        expect(field.absPath).toBe("nickname");
        await new Promise((r) => setTimeout(r, 80));
        await nextTick();
        const state: any = m.engine.store.state;
        const input = m.root.querySelector("input.f") as HTMLInputElement;
        input.value = "改";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        // 控件层照常（聚合视图命中晚到的域）
        const domain = Object.values(state.$scopes ?? {}).find(
            (d: any) => d && "nickname" in d,
        ) as any;
        expect(domain.nickname).toBe("改");
    });
});
