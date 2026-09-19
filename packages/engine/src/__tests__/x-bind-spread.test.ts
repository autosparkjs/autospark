import { describe, expect, test } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";

/**
 * 属性展开 / Attribute Spread（`x-bind="expr"` 无参形态，ADR-0043）
 *
 * 覆盖共识行为面：值分派（通用规则 + 四键特判）、覆盖顺序（静态接管 + class 合并）、
 * 响应粒度（depth:2 五形态 / 字面量键级 / 局部上下文边界）、指令屏障、
 * 整值语义（空态静默 / 非对象 warn / .invert 忽略）。
 */

describe("x-bind 无参属性展开：静态字面量", () => {
    test("原始示例：数字/字符串/布尔/对象值的全分派", () => {
        const { root } = mount(`<div x-bind="{a:1, b:'2', c:true, d:false, e:{e1:1}}"></div>`, {});
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("a")).toBe("1"); // 数字 → String()
        expect(div.getAttribute("b")).toBe("2"); // 字符串原样
        expect(div.hasAttribute("c")).toBe(true); // true → 裸属性（presence 语义）
        expect(div.getAttribute("c")).toBe(""); // 裸属性值为空串
        expect(div.hasAttribute("d")).toBe(false); // false → 移除
        expect(div.hasAttribute("e")).toBe(false); // 对象值 → warn + 剔除
    });

    test("null / undefined 值键被移除", () => {
        const { root } = mount(`<div x-bind="{a: zero, b: undefined}"></div>`, {
            zero: null,
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.hasAttribute("a")).toBe(false);
        expect(div.hasAttribute("b")).toBe(false);
    });

    test("无值裸 x-bind 静默跳过（沿用现状）", () => {
        const { root } = mount(`<div x-bind></div>`, {});
        expect(root.firstElementChild!.attributes.length).toBe(0);
    });
});

describe("x-bind 无参属性展开：裸路径 depth:2 响应粒度", () => {
    test("首展 + 整体替换重展开", async () => {
        const { root, engine } = mount(`<div x-bind="attrs"></div>`, {
            attrs: { title: "hi", disabled: true },
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("title")).toBe("hi");
        expect(div.hasAttribute("disabled")).toBe(true);
        engine.state.attrs = { title: "yo" };
        await nextTick();
        expect(div.getAttribute("title")).toBe("yo");
        expect(div.hasAttribute("disabled")).toBe(false); // 键消失 → 清理
    });

    test("子键修改触发重展开（depth:2 核心价值）", async () => {
        const { root, engine } = mount(`<div x-bind="attrs"></div>`, {
            attrs: { title: "hi" },
        });
        const div = root.firstElementChild as HTMLElement;
        engine.state.attrs.title = "changed";
        await nextTick();
        expect(div.getAttribute("title")).toBe("changed");
    });

    test("新增键触发重展开", async () => {
        const { root, engine } = mount(`<div x-bind="attrs"></div>`, {
            attrs: { a: 1 },
        });
        const div = root.firstElementChild as HTMLElement;
        engine.state.attrs.b = 2;
        await nextTick();
        expect(div.getAttribute("b")).toBe("2");
    });

    test("删除键触发清理", async () => {
        const { root, engine } = mount(`<div x-bind="attrs"></div>`, {
            attrs: { a: 1, b: 2 },
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("b")).toBe("2");
        delete engine.state.attrs.b;
        await nextTick();
        expect(div.hasAttribute("b")).toBe(false);
        expect(div.getAttribute("a")).toBe("1"); // 其余键不受影响
    });

    test("整值 null：静默保留旧展开（异步空态不闪断）", async () => {
        const { root, engine } = mount(`<div x-bind="attrs"></div>`, {
            attrs: { title: "hi" },
        });
        const div = root.firstElementChild as HTMLElement;
        engine.state.attrs = null;
        await nextTick();
        expect(div.getAttribute("title")).toBe("hi"); // 旧展开保留
    });

    test("整值非对象：warn + 静默不动 DOM", async () => {
        const { root, engine } = mount(`<div x-bind="attrs"></div>`, {
            attrs: { title: "hi" },
        });
        const div = root.firstElementChild as HTMLElement;
        engine.state.attrs = true;
        await nextTick();
        expect(div.getAttribute("title")).toBe("hi"); // 保留旧展开
    });
});

describe("x-bind 无参属性展开：字面量键级响应", () => {
    test("内嵌状态引用，各键独立响应（collectDependencies 通路）", async () => {
        const { root, engine } = mount(`<div x-bind="{title: tip, disabled: locked}"></div>`, {
            tip: "hi",
            locked: true,
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("title")).toBe("hi");
        expect(div.hasAttribute("disabled")).toBe(true);
        engine.state.tip = "yo";
        await nextTick();
        expect(div.getAttribute("title")).toBe("yo");
        engine.state.locked = false;
        await nextTick();
        expect(div.hasAttribute("disabled")).toBe(false);
    });
});

describe("x-bind 无参属性展开：覆盖顺序", () => {
    test("书写在 spread 之前的静态属性被展开键覆盖", () => {
        const { root } = mount(`<div a="1" x-bind="{a:2}"></div>`, {});
        expect((root.firstElementChild as HTMLElement).getAttribute("a")).toBe("2");
    });

    test("书写在 spread 之后的静态属性恒赢（静态接管）", async () => {
        const { root, engine } = mount(`<div x-bind="attrs" b="2"></div>`, {
            attrs: { b: 3, a: 1 },
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("b")).toBe("2"); // 静态赢
        expect(div.getAttribute("a")).toBe("1"); // 其余键正常展开
        // 状态变化：接管键不被写、也永不因键消失被移除
        engine.state.attrs = { b: 9 };
        await nextTick();
        expect(div.getAttribute("b")).toBe("2");
        expect(div.hasAttribute("a")).toBe(false);
    });
});

describe("x-bind 无参属性展开：class / style / property 特判键", () => {
    test("class 走 classList diff 合并：静态 token 永不被碰", async () => {
        const { root, engine } = mount(
            `<div class="btn" x-bind="{class: {primary: isPrimary}, title: tip}"></div>`,
            { isPrimary: true, tip: "hi" },
        );
        const div = root.firstElementChild as HTMLElement;
        expect(div.className).toBe("btn primary");
        engine.state.isPrimary = false;
        await nextTick();
        expect(div.className).toBe("btn"); // 静态类保留，动态类清空
        expect(div.getAttribute("title")).toBe("hi");
    });

    test("class 键消失 → 清空本展开贡献的类，静态保留", async () => {
        const { root, engine } = mount(`<div class="btn" x-bind="attrs"></div>`, {
            attrs: { class: "dynamic" },
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.className).toBe("btn dynamic");
        engine.state.attrs = {};
        await nextTick();
        expect(div.className).toBe("btn");
    });

    test("style 走对象 diff：键级增删、残留清理", async () => {
        const { root, engine } = mount(`<div x-bind="attrs"></div>`, {
            attrs: { style: { color: "red", fontWeight: "bold" } },
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.style.color).toBe("red");
        expect(div.style.fontWeight).toBe("bold");
        engine.state.attrs = { style: { color: "blue" } };
        await nextTick();
        expect(div.style.color).toBe("blue");
        expect(div.style.fontWeight).toBe(""); // 残留 key 清除
    });

    test("value / checked 走 property 写入（state→DOM 单向）", async () => {
        const { root, engine } = mount(`<input x-bind="{value: text, checked: picked}">`, {
            text: "a",
            picked: true,
        });
        const input = root.firstElementChild as HTMLInputElement;
        expect(input.value).toBe("a");
        expect(input.checked).toBe(true);
        engine.state.text = "b";
        await nextTick();
        expect(input.value).toBe("b");
    });

    test("value 键消失 → property 置空清理", async () => {
        const { root, engine } = mount(`<input x-bind="attrs">`, {
            attrs: { value: "old" },
        });
        const input = root.firstElementChild as HTMLInputElement;
        expect(input.value).toBe("old");
        engine.state.attrs = {};
        await nextTick();
        expect(input.value).toBe("");
    });
});

describe("x-bind 无参属性展开：指令屏障", () => {
    test("形似指令的键照写为普通属性，不编译执行", () => {
        const { root } = mount(
            `<div x-bind="{'x-text': 'msg', ':title': 't', '@click': 'go', title: 'real'}"></div>`,
            { msg: "不应出现", t: "不应出现" },
        );
        const div = root.firstElementChild as HTMLElement;
        // 照写为普通属性（字面值，未求值）
        expect(div.getAttribute("x-text")).toBe("msg");
        expect(div.getAttribute(":title")).toBe("t");
        expect(div.getAttribute("@click")).toBe("go");
        // 文本内容未被 x-text 指令覆写（指令屏障：永不编译）
        expect(div.textContent).toBe("");
        expect(div.getAttribute("title")).toBe("real");
    });
});

describe("x-bind 无参属性展开：.invert 修饰符", () => {
    test("对象取反无意义：warn + 忽略，展开照常", () => {
        const { root } = mount(`<div x-bind.invert="{a:1}"></div>`, {});
        expect((root.firstElementChild as HTMLElement).getAttribute("a")).toBe("1");
    });
});

describe("x-bind 无参属性展开：局部上下文边界（ADR-0043）", () => {
    test("x-for 项内路径形态：item 整体替换触发重展开", async () => {
        const { root, engine } = mount(
            `<ul x-for="item of items"><li x-bind="item.props"></li></ul>`,
            {
                items: [{ props: { title: "a" } }, { props: { title: "b" } }],
            },
        );
        const li = root.querySelector("li") as HTMLElement;
        expect(li.getAttribute("title")).toBe("a");
        engine.state.items[0] = { props: { title: "replaced" } };
        await nextTick();
        expect(li.getAttribute("title")).toBe("replaced");
    });

    test("边界：局部上下文内子键修改不触发（depth 不作用于表达式支路）", async () => {
        const { root, engine } = mount(
            `<ul x-for="item of items"><li x-bind="item.props"></li></ul>`,
            {
                items: [{ props: { title: "a" } }],
            },
        );
        const li = root.querySelector("li") as HTMLElement;
        engine.state.items[0].props.title = "changed";
        await nextTick();
        expect(li.getAttribute("title")).toBe("a"); // 维持旧值（文档化边界）
        // 逃生门：字面量形态键级响应
        const { root: root2, engine: engine2 } = mount(
            `<ul x-for="item of items"><li x-bind="{title: item.props.title}"></li></ul>`,
            { items: [{ props: { title: "a" } }] },
        );
        const li2 = root2.querySelector("li") as HTMLElement;
        engine2.state.items[0].props.title = "changed";
        await nextTick();
        expect(li2.getAttribute("title")).toBe("changed");
    });
});

describe("x-bind 无参属性展开：与其他绑定共存", () => {
    test("同元素显式 :attr 与展开共存（不同键互不干扰）", async () => {
        const { root, engine } = mount(`<div x-bind="attrs" :lang="l"></div>`, {
            attrs: { title: "hi" },
            l: "zh",
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("title")).toBe("hi");
        expect(div.getAttribute("lang")).toBe("zh");
        engine.state.attrs = { title: "yo" };
        await nextTick();
        expect(div.getAttribute("title")).toBe("yo");
        expect(div.getAttribute("lang")).toBe("zh");
    });

    test("属性插值与展开共存（插值合成有参 bind，与无参互不冲突）", async () => {
        const { root, engine } = mount(`<div x-bind="attrs" data-x="{{flag}}"></div>`, {
            attrs: { title: "hi" },
            flag: 1,
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("data-x")).toBe("1");
        expect(div.getAttribute("title")).toBe("hi");
        engine.state.flag = 2;
        await nextTick();
        expect(div.getAttribute("data-x")).toBe("2");
    });
});

describe("x-bind 无参属性展开：数组形态（ADR-0043 数组扩展）", () => {
    test("多对象合并展开", () => {
        const { root } = mount(`<div x-bind="[{a:1}, {b:'2'}, {c:true}]"></div>`, {});
        expect(root).toEqualHTML(`<div>
  <div a="1" b="2" c></div>
</div>`);
    });

    test("键冲突后者覆盖前者（JS spread 心智）", () => {
        const { root } = mount(`<div x-bind="[{a:'x'}, {a:'y'}]"></div>`, {});
        expect(root).toEqualHTML(`<div>
  <div a="y"></div>
</div>`);
    });

    test("falsy 项跳过（条件段惯用法）", () => {
        const { root } = mount(`<div x-bind="[cond && {a:1}, {b:2}]"></div>`, { cond: false });
        expect(root).toEqualHTML(`<div>
  <div b="2"></div>
</div>`);
    });

    test("非对象项 warn + 剔除（对象项照常展开）", () => {
        const { root } = mount(`<div x-bind="[{a:1}, 'bad', {b:2}]"></div>`, {});
        expect(root).toEqualHTML(`<div>
  <div a="1" b="2"></div>
</div>`);
    });

    test("字面量数组内状态变化重展开（表达式支路键级响应）", async () => {
        const { root, engine } = mount(`<div x-bind="[{title: tip}, {disabled: off}]"></div>`, {
            tip: "hi",
            off: false,
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("title")).toBe("hi");
        expect(div.hasAttribute("disabled")).toBe(false);
        engine.state.off = true;
        await nextTick();
        expect(div.hasAttribute("disabled")).toBe(true);
    });

    test("合并后 class 特判键仍走 diff 合并（静态 token 不被碰）", async () => {
        const { root, engine } = mount(
            `<div class="btn" x-bind="[{class:{primary:isPrimary}}, {title:'hi'}]"></div>`,
            { isPrimary: true },
        );
        const div = root.firstElementChild as HTMLElement;
        expect(div.className).toBe("btn primary");
        expect(div.getAttribute("title")).toBe("hi");
        engine.state.isPrimary = false;
        await nextTick();
        expect(div.className).toBe("btn");
    });

    test("键消失清理对合并形态照常生效", async () => {
        const { root, engine } = mount(`<div x-bind="seg"></div>`, {
            seg: [{ a: 1, b: 2 }],
        });
        const div = root.firstElementChild as HTMLElement;
        expect(div.getAttribute("a")).toBe("1");
        expect(div.getAttribute("b")).toBe("2");
        engine.state.seg = [{ a: 1 }];
        await nextTick();
        expect(div.getAttribute("a")).toBe("1");
        expect(div.hasAttribute("b")).toBe(false);
    });
});
