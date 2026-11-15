/**
 * steps 组件插件测试（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - items 渲染：title/description 逐项克隆、序号缺省（$index+1）、icon 值通道；
 * - 状态机：先行步 finish（打勾）/ 当前步 status 取值（process/error/finish）/ 后续步
 *   wait；data-state 与图标/序号显隐（x-show 双通道断言）；
 * - clickable 交互：点击切换 + change detail={current} + input 回写 + 同值短路 +
 *   关闭态点击无事件；
 * - 值通道：props current 受控单向、el.value 劫持桥（number 语域归一）、x-model 双向；
 * - 排向 direction：horizontal 缺省 / vertical 落 body 数据属性；
 * - precompile 元素名变换：<x-steps> → div 宿主 + props 折叠 + <x-step> → data-items
 *   JSON 通道（字面量数组 props 死环规避）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { STEPS_NAME, bootstrapStepsPlugin } from "../../../components/navigation/steps/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[STEPS_NAME] as string).replace(/\s+/g, " ");

/** 步 li 集（按 DOM 序） */
const steps = (root: Element) => Array.from(root.querySelectorAll(".asc-step"));

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.steps 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[STEPS_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${STEPS_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[STEPS_NAME];
        bootstrapStepsPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[STEPS_NAME]).toBe(before);
    });
});

describe("items 渲染", () => {
    test("渲染：title/description 逐项生成，序号缺省（$index+1），description 空值隐藏", async () => {
        const { root } = mount(
            `<div x-component:autospark.steps="{ items: flow }"></div>`,
            {
                flow: [
                    { title: "填写信息", description: "准备基础资料" },
                    { title: "验证身份" },
                ],
            },
        );
        await nextTick();
        const list = steps(root);
        expect(list.length).toBe(2);
        expect(list[0]!.querySelector(".asc-step-title")!.textContent).toContain("填写信息");
        expect(list[0]!.querySelector(".asc-step-desc")!.textContent).toContain("准备基础资料");
        expect((list[0]!.querySelector(".asc-step-desc") as HTMLElement).style.display).toBe("");
        expect((list[1]!.querySelector(".asc-step-desc") as HTMLElement).style.display).toBe("none"); // 空值隐藏
        expect(list[0]!.querySelector(".asc-step-num")!.textContent).toContain("1"); // 序号缺省
        expect(list[1]!.querySelector(".asc-step-num")!.textContent).toContain("2");
    });

    test("icon 值通道：item.icon 在场时后续步渲染自定义图标（序号隐藏）", async () => {
        const { root } = mount(
            `<div x-component:autospark.steps="{ items: flow, current: 0 }"></div>`,
            {
                flow: [
                    { title: "首步" },
                    { title: "图标步", icon: "file" },
                ],
            },
        );
        await nextTick();
        const second = steps(root)[1]!;
        expect(second.querySelector(".asc-step-custom")).toBeTruthy(); // icon 值通道
        expect((second.querySelector(".asc-step-custom") as HTMLElement).style.display).toBe("");
        expect((second.querySelector(".asc-step-num") as HTMLElement).style.display).toBe("none"); // 序号让位
    });
});

describe("状态机（data-state 与图标三态）", () => {
    test("先行步 finish 打勾（yes 图标）+ 当前步 process 序号 + 后续步 wait 序号", async () => {
        const { root } = mount(
            `<div x-component:autospark.steps="{ items: flow, current: 1 }"></div>`,
            { flow: [{ title: "一" }, { title: "二" }, { title: "三" }] },
        );
        await nextTick();
        const list = steps(root);
        expect(list[0]!.getAttribute("data-state")).toBe("finish");
        expect(list[1]!.getAttribute("data-state")).toBe("process");
        expect(list[2]!.getAttribute("data-state")).toBe("wait");
        expect((list[0]!.querySelector(".asc-step-check") as HTMLElement).style.display).toBe(""); // 打勾可见
        expect((list[0]!.querySelector(".asc-step-num") as HTMLElement).style.display).toBe("none");
        expect((list[1]!.querySelector(".asc-step-num") as HTMLElement).style.display).toBe(""); // 当前步序号
        expect(list[1]!.getAttribute("aria-current")).toBe("step"); // aria-current 按位
        expect(list[0]!.getAttribute("aria-current")).toBe(null);
    });

    test("status=error：当前步 error 态（叉号 no 图标 + data-state=error），其余状态机不变", async () => {
        const { root } = mount(
            `<div x-component:autospark.steps="{ items: flow, current: 1, status: 'error' }"></div>`,
            { flow: [{ title: "一" }, { title: "二" }, { title: "三" }] },
        );
        await nextTick();
        const list = steps(root);
        expect(list[0]!.getAttribute("data-state")).toBe("finish");
        expect(list[1]!.getAttribute("data-state")).toBe("error");
        expect(list[2]!.getAttribute("data-state")).toBe("wait");
        expect((list[1]!.querySelector(".asc-step-error") as HTMLElement).style.display).toBe(""); // 叉号可见
        expect((list[1]!.querySelector(".asc-step-num") as HTMLElement).style.display).toBe("none");
    });

    test("status=finish：当前步也打勾（完成态收尾）", async () => {
        const { root } = mount(
            `<div x-component:autospark.steps="{ items: flow, current: 2, status: 'finish' }"></div>`,
            { flow: [{ title: "一" }, { title: "二" }, { title: "三" }] },
        );
        await nextTick();
        const list = steps(root);
        expect(list.map((s) => s.getAttribute("data-state"))).toEqual(["finish", "finish", "finish"]);
        expect((list[2]!.querySelector(".asc-step-check") as HTMLElement).style.display).toBe("");
    });
});

describe("clickable 交互与值通道", () => {
    test("clickable 点击切换：change 冒泡 detail={current} + input 派发 + 状态机迁移", async () => {
        const changes: number[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail.current)">
                <div x-model="step" x-component:autospark.steps="{ items: flow, clickable: true }"></div>
            </div>`,
            { step: 0, changes, flow: [{ title: "一" }, { title: "二" }, { title: "三" }] },
        );
        await nextTick();
        (steps(root)[2] as HTMLElement).click();
        await nextTick();
        expect(changes).toEqual([2]); // change 冒泡 detail={current}
        expect(engine.store.state.step).toBe(2); // input 派发 → x-model 回写
        expect(steps(root)[2]!.getAttribute("data-state")).toBe("process"); // 状态机迁移
        expect(steps(root)[0]!.getAttribute("data-state")).toBe("finish");
        expect(steps(root)[1]!.getAttribute("data-state")).toBe("finish");
    });

    test("clickable 同值短路：点击当前步不派发", async () => {
        const changes: number[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail.current)">
                <div x-component:autospark.steps="{ items: flow, current: 1, clickable: true }"></div>
            </div>`,
            { changes, flow: [{ title: "一" }, { title: "二" }] },
        );
        await nextTick();
        (steps(root)[1] as HTMLElement).click();
        await nextTick();
        expect(changes).toEqual([]);
    });

    test("clickable 缺省关闭：点击步不切换、不派发", async () => {
        const changes: number[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail.current)">
                <div x-component:autospark.steps="{ items: flow, current: 0 }"></div>
            </div>`,
            { changes, flow: [{ title: "一" }, { title: "二" }] },
        );
        await nextTick();
        (steps(root)[1] as HTMLElement).click();
        await nextTick();
        expect(changes).toEqual([]);
        expect(steps(root)[1]!.getAttribute("data-state")).toBe("wait"); // 不迁移
    });

    test("props current 受控单向：state 变化 → 状态机迁移（无点击不广播）", async () => {
        const changes: number[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail.current)">
                <div x-component:autospark.steps="{ items: flow, current: step }"></div>
            </div>`,
            { step: 0, changes, flow: [{ title: "一" }, { title: "二" }] },
        );
        await nextTick();
        engine.store.state.step = 1;
        await nextTick();
        expect(steps(root)[1]!.getAttribute("data-state")).toBe("process");
        expect(changes).toEqual([]); // props 驱动不广播防回环
    });

    test("el.value 劫持桥：程序写值即迁移（number 语域，负值/NaN 归 0）", async () => {
        const { root } = mount(
            `<div x-component:autospark.steps="{ items: flow, current: 0 }"></div>`,
            { flow: [{ title: "一" }, { title: "二" }] },
        );
        await nextTick();
        const host = root.querySelector(".asc-steps") as unknown as { value: number };
        host.value = 1;
        await nextTick();
        expect(steps(root)[1]!.getAttribute("data-state")).toBe("process");
        expect(host.value).toBe(1);
        host.value = -5;
        await nextTick();
        expect(host.value).toBe(0); // 负值归 0
        expect(steps(root)[0]!.getAttribute("data-state")).toBe("process");
    });

    test("x-model 双向：state 外部变更 → 状态机迁移（x-model expando 初值）", async () => {
        const { root, engine } = mount(
            `<div><div x-model="step" x-component:autospark.steps="{ items: flow }"></div></div>`,
            { step: 1, flow: [{ title: "一" }, { title: "二" }] },
        );
        await nextTick();
        expect(steps(root)[1]!.getAttribute("data-state")).toBe("process");
        engine.store.state.step = 0;
        await nextTick();
        expect(steps(root)[0]!.getAttribute("data-state")).toBe("process");
    });
});

describe("排向（direction）与样式规则（模板断言）", () => {
    test("direction 绑定落 body（T4=B）：horizontal 缺省 / vertical", async () => {
        const h = mount(`<div x-component:autospark.steps="{ items: flow }"></div>`, {
            flow: [{ title: "一" }],
        });
        await nextTick();
        expect(h.root.querySelector(".asc-steps-body")!.getAttribute("data-direction")).toBe("horizontal");

        const v = mount(`<div x-component:autospark.steps="{ items: flow, direction: 'vertical' }"></div>`, {
            flow: [{ title: "一" }],
        });
        await nextTick();
        expect(v.root.querySelector(".asc-steps-body")!.getAttribute("data-direction")).toBe("vertical");
    });

    test("样式规则（模板断言）：节点四态 + 连接线 finish 染色 + vertical 竖线 + 暗色兜底", () => {
        const t = tpl();
        // 节点四态：process 实底反白 / finish 描边主色 / error danger 实底
        expect(t).toContain('.asc-step[data-state="process"] .asc-step-dot {');
        expect(t).toContain('.asc-step[data-state="finish"] .asc-step-dot {');
        expect(t).toContain('.asc-step[data-state="error"] .asc-step-dot {');
        // 连接线：随所属步 finish 染主色（进度染色）+ 末步无线
        expect(t).toContain('.asc-step[data-state="finish"] .asc-step-line { background: var(--asc-tone); }');
        expect(t).toContain(".asc-step:last-child .asc-step-line {");
        // vertical：纵排 + 步下竖线
        expect(t).toContain('[data-direction="vertical"] .asc-step {');
        expect(t).toContain('[data-direction="vertical"] .asc-step-line {');
        // clickable：可点手势 + hover 标题主色
        expect(t).toContain(".asc-steps-body[data-clickable] .asc-step {");
        // 暗色兜底变体在场（ADR-0129）
        expect(t).toContain("[dark] .asc-step-dot,");
        expect(t).toContain("[data-dark] .asc-step[data-state=\"finish\"] .asc-step-line {");
    });
});

describe("元素名快速写法（precompile 变换）", () => {
    test("<x-steps> 替换为 div 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
        const { root } = mount(
            `<div><x-steps current="1" clickable><span>占位</span></x-steps></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("DIV");
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const props = attrOf(host, "x-component:autospark.steps")!;
        expect(props).toContain("current: 1"); // 数字类型推断
        expect(props).toContain("clickable: true"); // 裸属性归一 true
        expect(host.querySelector("span")!.textContent).toBe("占位"); // 子内容随迁为默认插槽
    });

    test("<x-step> 子元素声明：折叠为 items JSON 落 data-items + 声明元素摘除 + 渲染还原", async () => {
        const { root } = mount(
            `<div><x-steps current="1">
                <x-step title="填写" description="基本信息"></x-step>
                <x-step title="验证"></x-step>
                <x-step title="完成" icon="yes"></x-step>
            </x-steps></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("x-step")).toBe(null); // 声明元素不残留
        const list = steps(root);
        expect(list.length).toBe(3);
        expect(list[0]!.textContent).toContain("填写");
        expect(list[0]!.querySelector(".asc-step-desc")!.textContent).toContain("基本信息");
        expect(list[2]!.querySelector(".asc-step-custom")).toBeTruthy(); // icon 折叠进 JSON 通道
        expect(list[1]!.getAttribute("data-state")).toBe("process"); // current=1 静态折叠
        expect(list[0]!.getAttribute("data-state")).toBe("finish");
    });

    test(":items 状态引用在场：data-items 不落盘（props 优先）+ 声明子元素仍摘除", async () => {
        const { root } = mount(
            `<div><x-steps :items="flow"><x-step title="声明形态被忽略"></x-step></x-steps></div>`,
            { flow: [{ title: "状态引用" }] },
        );
        await nextTick();
        const host = root.querySelector(".asc-steps")!;
        expect(host.hasAttribute("data-items")).toBe(false);
        expect(root.querySelector("x-step")).toBe(null);
        expect(steps(root).length).toBe(1);
        expect(steps(root)[0]!.textContent).toContain("状态引用");
    });

    test("裸 items 属性（JSON 字符串）走 data-items 通道（不进 props 值对象——字面量数组死环规避）", async () => {
        const { root } = mount(
            `<div><x-steps items='[{"title":"JSON 形态"},{"title":"二"}]'></x-steps></div>`,
            {},
        );
        await nextTick();
        const list = steps(root);
        expect(list.length).toBe(2);
        expect(list[0]!.textContent).toContain("JSON 形态");
        expect(list[0]!.getAttribute("data-state")).toBe("process"); // 缺省 current=0
    });
});
