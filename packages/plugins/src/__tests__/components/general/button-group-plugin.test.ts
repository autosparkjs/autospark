/**
 * button-group 组件插件测试（ADR-0014）：
 * - precompile 变换：x-button-group → div + x-component 值形态、子钮缺省下发
 *   （variant/type/disabled，显式优先）、data-value stamp；
 * - 布局绑定：gap / vertical / block / 融合（data-fused）属性通道；
 * - 选中模式（x-model 在场激活）：单选排他、不反选、无值钮不参与、初始不匹配全不选、
 *   组值桥（el.value 劫持字符串语域 + input/change 双事件 + hidden input）；
 * - 纯布局组（无 x-model）：无选中态、无隐藏 input；
 * - props value 受控通道（无 x-model 时单向驱动视觉）。
 *
 * import 顺序契约：button-group 须先于 button（precompile 注册顺序 = 执行顺序，
 * 组变换需赶在 button 折叠子钮 props 之前 stamp——ADR-0014 决策 1）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { BUTTON_GROUP_NAME, bootstrapButtonGroupPlugin } from "../../../components/general/button-group/index";
import { BUTTON_NAME } from "../../../components/general/button/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[BUTTON_GROUP_NAME] as string).replace(/\s+/g, " ");

describe("注册与 precompile 变换（ADR-0014 决策 1）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.button-group 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[BUTTON_GROUP_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${BUTTON_GROUP_NAME}"`);
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[BUTTON_GROUP_NAME];
        bootstrapButtonGroupPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[BUTTON_GROUP_NAME]).toBe(before);
    });

    test("变换：x-button-group 替换为 div + x-component 值形态，静态属性折叠 props（布尔裸属性归一 true）", async () => {
        // autostart:false——precompile 变换照跑（构造期）但不编译，x-component 属性未剥除可断言；
        // 属性名带冒号被 happy-dom 按命名空间解析，getAttribute(全串) 取不到——attributes 遍历取值
        const { root } = mount(
            `<div><x-button-group vertical gap="8"><x-button label="A"></x-button></x-button-group></div>`,
            {},
            { autostart: false },
        );
        // 直接索引取 transform 产物（querySelector("div > div") 会按 :scope 语义命中 mount 容器
        // 的直接子 div——root 本身是 div，原外层 div 即匹配）
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("DIV");
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const groupAttr = attrOf(host, "x-component:autospark.button-group")!;
        expect(groupAttr).toContain("vertical: true"); // 裸属性（无值）归一 true
        expect(groupAttr).toContain("gap: 8"); // 数字类型推断
        // 子钮经 button 变换折叠（未编译，属性在场可断言）
        const btn = host.querySelector("button")!;
        expect(btn).toBeTruthy();
        expect(attrOf(btn, "x-component:autospark.button")).toContain('label: "A"');
    });
});

describe("缺省下发（ADR-0014 决策 3：子钮显式优先）", () => {
    test("组级 type 下发：未显式声明的子钮继承，显式声明的不覆盖", async () => {
        const { root } = mount(
            `<div><x-button-group type="danger">
                <x-button id="a" label="继承"></x-button>
                <x-button id="b" label="显式" type="primary"></x-button>
            </x-button-group></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#a .asc-button-body")!.getAttribute("data-type")).toBe("danger");
        expect(root.querySelector("#b .asc-button-body")!.getAttribute("data-type")).toBe("primary");
    });

    test("组级 :绑定转发：表达式原样 stamp 到子钮，同 scope 响应式求值", async () => {
        const { root } = mount(
            `<div><x-button-group :type="mode"><x-button id="a" label="A"></x-button></x-button-group></div>`,
            { mode: "success" },
        );
        await nextTick();
        expect(root.querySelector("#a .asc-button-body")!.getAttribute("data-type")).toBe("success");
    });

    test("组级 disabled 下发：stamp disabled=true 经子钮 mounted 落原生禁用", async () => {
        const { root } = mount(
            `<div><x-button-group disabled><x-button id="a" label="A"></x-button></x-button-group></div>`,
            {},
        );
        await nextTick();
        expect((root.querySelector("#a") as HTMLButtonElement).disabled).toBe(true);
    });
});

describe("布局与融合（ADR-0014 决策 2）", () => {
    test("融合属性通道：缺省 gap=0 → data-fused 在场；gap 有值 → 移除 + gap 内联", async () => {
        const fused = mount(
            `<div><x-button-group><x-button label="A"></x-button><x-button label="B"></x-button></x-button-group></div>`,
            {},
        );
        await nextTick();
        const body = fused.root.querySelector(".asc-button-group-body")!;
        expect(body.getAttribute("data-fused")).toBe("true");
        expect(body.style.gap).toBe("");

        const apart = mount(
            `<div><x-button-group gap="12"><x-button label="A"></x-button></x-button></div>`,
            {},
        );
        await nextTick();
        const body2 = apart.root.querySelector(".asc-button-group-body")!;
        expect(body2.hasAttribute("data-fused")).toBe(false); // 绑定假值属性移除
        expect(body2.style.gap).toBe("12px");
    });

    test("垂直与块级属性通道：data-vertical / data-block 落 body", async () => {
        const { root } = mount(
            `<div><x-button-group vertical block><x-button label="A"></x-button></x-button-group></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-button-group-body")!;
        expect(body.getAttribute("data-vertical")).toBe("true");
        expect(body.getAttribute("data-block")).toBe("true");
    });

    test("融合样式规则（模板断言）：出口盒 display:contents + 相邻圆角清除 + 负 margin 边线复用 + 垂直换轴 + 交互抬层", () => {
        const t = tpl();
        // 出口盒不产生布局盒（x-slot 出口保留包裹层不剥标签——无此规则子钮嵌在出口 span 内：
        // inline 空白产生间隔、gap/融合/等高拉伸全部失效——2026-11-10 线上反馈修复）
        expect(t).toContain(".asc-button-group-items { display: contents; }");
        expect(t).toContain('.asc-button-group-body[data-fused="true"] .asc-button:has(+ .asc-button) { border-start-end-radius: 0; border-end-end-radius: 0; }');
        expect(t).toContain('.asc-button-group-body[data-fused="true"] .asc-button + .asc-button { border-start-start-radius: 0; border-end-start-radius: 0; margin-inline-start: calc( -1 * var(--auto-border-size, var(--asc-button-border-size, 1px)) ); }');
        expect(t).toContain('.asc-button-group-body[data-fused="true"][data-vertical="true"] .asc-button + .asc-button {');
        expect(t).toContain(".asc-button-group-body[data-fused=\"true\"] .asc-button:hover,");
        expect(t).toContain('.asc-button-group-body[data-fused="true"] .asc-button.asc-group-checked {');
    });

    test("选中视觉规则（模板断言）：组自有 class tone 实底反白", () => {
        expect(tpl()).toContain(
            ".asc-button-group .asc-button.asc-group-checked { --asc-bg: var(--asc-tone) !important; --asc-ink: #fff !important; --asc-line: transparent !important; }",
        );
    });
});

describe("选中模式（ADR-0014 决策 4/5/6：x-model 在场激活）", () => {
    test("data-value stamp：子钮静态 value 落为 data-value 属性（button 折叠 props 后 DOM 无痕的补偿通道）", async () => {
        const { root } = mount(
            `<div><x-button-group><x-button value="day" label="日"></x-button><x-button label="无值"></x-button></x-button-group></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-button")!.getAttribute("data-value")).toBe("day");
        const noValue = root.querySelectorAll(".asc-button")[1];
        expect(noValue!.hasAttribute("data-value")).toBe(false);
    });

    test("x-model 初值选中 + 点击切换：组值回写 state、选中标记迁移、change 冒泡", async () => {
        const changes: unknown[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail.value)">
                <x-button-group x-model="view">
                    <x-button value="day" label="日"></x-button>
                    <x-button value="week" label="周"></x-button>
                    <x-button value="month" label="月"></x-button>
                </x-button-group>
            </div>`,
            { view: "day", changes },
        );
        await nextTick();
        const [day, week, month] = Array.from(root.querySelectorAll(".asc-button"));
        // 初始：state 初值 "day" → 对应钮选中，其余不选
        expect(day.classList.contains("asc-group-checked")).toBe(true);
        expect(week.classList.contains("asc-group-checked")).toBe(false);
        // 点击 week → 组值切换、标记迁移、state 回写
        (week as HTMLElement).click();
        await nextTick();
        expect(engine.store.state.view).toBe("week");
        expect(week.classList.contains("asc-group-checked")).toBe(true);
        expect(day.classList.contains("asc-group-checked")).toBe(false);
        expect(month!.classList.contains("asc-group-checked")).toBe(false);
        expect(changes).toEqual(["week"]);
        // 点击已选钮不反选（radio 语义）
        (week as HTMLElement).click();
        await nextTick();
        expect(engine.store.state.view).toBe("week");
        expect(week.classList.contains("asc-group-checked")).toBe(true);
    });

    test("初始不匹配任何子钮 value → 全不选（不猜首钮）", async () => {
        const { root } = mount(
            `<div><x-button-group x-model="view">
                <x-button value="day" label="日"></x-button>
            </x-button-group></div>`,
            { view: "year" },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-group-checked").length).toBe(0);
    });

    test("state 外部变更 → 选中迁移（x-model 反向同步）", async () => {
        const { root, engine } = mount(
            `<div><x-button-group x-model="view">
                <x-button value="day" label="日"></x-button>
                <x-button value="week" label="周"></x-button>
            </x-button-group></div>`,
            { view: "day" },
        );
        await nextTick();
        const [day, week] = Array.from(root.querySelectorAll(".asc-button"));
        expect(day.classList.contains("asc-group-checked")).toBe(true);
        engine.store.state.view = "week";
        await nextTick();
        expect(week.classList.contains("asc-group-checked")).toBe(true);
        expect(day.classList.contains("asc-group-checked")).toBe(false);
    });

    test("hidden input：x-model 在场内嵌 input[type=hidden]，name 透传、value 随选中同步", async () => {
        const { root } = mount(
            `<div><x-button-group x-model="view" name="range">
                <x-button value="day" label="日"></x-button>
                <x-button value="week" label="周"></x-button>
            </x-button-group></div>`,
            { view: "day" },
        );
        await nextTick();
        const hidden = root.querySelector<HTMLInputElement>("input[type=hidden]")!;
        expect(hidden).toBeTruthy();
        expect(hidden.name).toBe("range");
        expect(hidden.value).toBe("day");
        (root.querySelectorAll(".asc-button")[1] as HTMLElement).click();
        await nextTick();
        expect(hidden.value).toBe("week");
    });

    test("无值钮点击不参与选中；纯布局组（无 x-model）无选中态、无隐藏 input", async () => {
        const plain = mount(
            `<div><x-button-group>
                <x-button label="工具 A"></x-button>
                <x-button label="工具 B"></x-button>
            </x-button-group></div>`,
            {},
        );
        await nextTick();
        (plain.root.querySelectorAll(".asc-button")[1] as HTMLElement).click();
        await nextTick();
        expect(plain.root.querySelectorAll(".asc-group-checked").length).toBe(0);
        expect(plain.root.querySelector("input")).toBe(null);

        const withModel = mount(
            `<div><x-button-group x-model="view">
                <x-button value="day" label="日"></x-button>
                <x-button label="无值钮"></x-button>
            </x-button-group></div>`,
            { view: "day" },
        );
        await nextTick();
        (withModel.root.querySelectorAll(".asc-button")[1] as HTMLElement).click();
        await nextTick();
        expect(withModel.engine.store.state.view).toBe("day"); // 无值钮点击不改变组值
        expect(withModel.root.querySelectorAll(".asc-group-checked")[0].getAttribute("data-value")).toBe("day");
    });
});

describe("props value 受控通道（无 x-model 时的单向驱动，ADR-0014 决策 6）", () => {
    test(":value 绑定变化 → 选中标记迁移（props 单向显示）", async () => {
        const { root, engine } = mount(
            `<div><x-button-group :value="view">
                <x-button value="day" label="日"></x-button>
                <x-button value="week" label="周"></x-button>
            </x-button-group></div>`,
            { view: "day" },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-button")[0].classList.contains("asc-group-checked")).toBe(true);
        engine.store.state.view = "week";
        await nextTick();
        expect(root.querySelectorAll(".asc-button")[1].classList.contains("asc-group-checked")).toBe(true);
    });
});

describe("button/index.ts 共享工具抽取回归（DRY）", () => {
    test("button 组件注册不受抽取影响（inferPropValue/propKey/kebabToCamel 经 utils 导入）", async () => {
        const { root } = mount(
            `<button x-component:${BUTTON_NAME}="{ label: '回归', type: 'primary' }"></button>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-button-body")!.getAttribute("data-type")).toBe("primary");
    });
});
