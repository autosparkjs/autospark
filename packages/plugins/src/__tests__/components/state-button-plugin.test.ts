/**
 * state-button 组件插件测试（ADR-0016 继承骨架 + 机制自治）：
 * - 注册与继承化身（asc-button + asc-state-button 双类、父模板 label 复用）；
 * - 缺省组零配置即 check 按钮（value 缺省 states[0]、decorate 佩戴态渲染）；
 * - 循环 next / 无匹配灰 / autoswitch / clickable 出边锁 / dataset 反射；
 * - 表单桥（布尔组 checkbox / N 态 hidden）与 x-model 布尔桥；
 * - 元素名快速写法（x-state-button precompile 变换）。
 *
 * states 数组一律经状态路径引用（`states: sRef`）——x-component 字面量数组 props 存在
 * 引擎更新环缺陷（与 tags 同款约束、HEAD 未修），字面量写法死锁测试进程。
 */
import "../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../helpers";
// 父组件插件须先于子加载（全局表注册面——继承解析查父，ADR-0016 产物依赖同款契约）
import "../../components/button/index";
import { STATE_BUTTON_NAME } from "../../components/stateButton/index";

/** 点击宿主（button 原生语义，dispatchEvent MouseEvent 同 button-plugin 惯用法） */
const click = (root: HTMLElement) =>
    root.querySelector("button")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

describe("state-button 注册与继承骨架（ADR-0016）", () => {
    test("模块加载即注册：全局组件表含 autospark.state-button 模板（继承声明在场）", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[STATE_BUTTON_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${STATE_BUTTON_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.button"');
    });

    test("继承化身渲染：宿主双类（asc-button + asc-state-button）、父模板 label 复用", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '状态', states: sRef }"></button>`,
            { sRef: [1, 2] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).toContain("asc-button");
        expect(host.className).toContain("asc-state-button");
        expect(host.textContent.replace(/\s/g, "")).toContain("状态"); // 继承父模板默认出口
        expect(host.querySelector(".asc-button-body")).not.toBeNull(); // 父 body 骨架在场
    });

    test("元素名快速写法：<x-state-button> 经 precompile 变换为 button + x-component 值形态", async () => {
        const { root } = mount(
            `<div><x-state-button id="sb" label="标签态" :states="sRef"></x-state-button></div>`,
            { sRef: [1, 2] },
        );
        await nextTick();
        const host = root.querySelector("#sb") as HTMLElement;
        expect(host.tagName).toBe("BUTTON"); // 宿主替换为真 button（表单桥/键盘激活前提）
        expect(host.className).toContain("asc-state-button"); // 变换后实例化渲染
        expect(host.textContent.replace(/\s/g, "")).toContain("标签态");
        expect(host.getAttribute("data-value")).toBe("1"); // :states 表达式折叠进值对象正常注入
    });
});

describe("缺省组与 check 行为（ADR-0016 决策 3）", () => {
    test("零配置：value 缺省 = states[0].value（false 未勾选）、无装饰无灰态", async () => {
        const { root } = mount(`<button x-component:autospark.state-button="{ label: '勾选' }"></button>`, {});
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.getAttribute("data-value")).toBe("false"); // dataset 反射初值
        expect(host.className).not.toContain("asc-d-"); // 未佩戴装饰（false 态）
        expect(host.className).not.toContain("asc-unmatched");
    });

    test("点击循环：false → true 佩戴 corner 装饰 + change detail 三元组；再点回 false", async () => {
        const { root } = mount(`<button x-component:autospark.state-button="{ label: '勾选' }"></button>`, {});
        await nextTick();
        const host = root.querySelector("button")!;
        const details: any[] = [];
        host.addEventListener("change", (e) => details.push((e as CustomEvent).detail));
        click(root);
        await nextTick();
        expect(host.className).toContain("asc-d-corner"); // true 态佩戴 corner（缺省组）
        expect(host.getAttribute("data-value")).toBe("true");
        expect(details.length).toBe(1);
        expect(details[0].value).toBe(true);
        expect(details[0].index).toBe(1);
        expect(details[0].state?.value).toBe(true); // detail 三元组（标量投影断言）
        click(root);
        await nextTick();
        expect(host.className).not.toContain("asc-d-corner");
        expect(host.getAttribute("data-value")).toBe("false");
    });

    test("三态循环 next + 尾态回卷：标量数组归一化、value 缺省落首态", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '三态', states: s3 }"></button>`,
            { s3: [1, 2, 3] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.getAttribute("data-value")).toBe("1"); // 首态
        click(root);
        await nextTick();
        expect(host.getAttribute("data-value")).toBe("2");
        click(root);
        await nextTick();
        expect(host.getAttribute("data-value")).toBe("3");
        click(root);
        await nextTick();
        expect(host.getAttribute("data-value")).toBe("1"); // 尾态回卷
    });

    test("对象缺 value 回退下标：[{},{}] 即 value=0/1", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '下标', states: sIdx }"></button>`,
            { sIdx: [{}, {}] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.getAttribute("data-value")).toBe("0");
        click(root);
        await nextTick();
        expect(host.getAttribute("data-value")).toBe("1");
    });
});

describe("无匹配态与行为锁（ADR-0016 决策 6/7）", () => {
    test("域外 value 灰色态：asc-unmatched 在场、点击进 states[0] 摘灰", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '灰', states: sPair, value: 99 }"></button>`,
            { sPair: [1, 2] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).toContain("asc-unmatched");
        expect(host.getAttribute("data-value")).toBe("99"); // 受控真相原样反射
        click(root);
        await nextTick();
        expect(host.className).not.toContain("asc-unmatched");
        expect(host.getAttribute("data-value")).toBe("1"); // 无匹配点击进首态
    });

    test("无效状态集（空数组）：静默退化恒无匹配、点击无状态效果", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '退化', states: sNone }"></button>`,
            { sNone: [] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).toContain("asc-unmatched");
        click(root);
        await nextTick();
        expect(host.getAttribute("data-value")).toBe("undefined"); // 无处可切
    });

    test("autoswitch=false 纯受控：点击不切不发 change，原生 click 照常冒泡", async () => {
        const { root, engine } = mount(
            `<div @click="nativeClicks++"><button x-component:autospark.state-button="{ label: '受控', states: sPair, autoswitch: false }"></button></div>`,
            { sPair: [1, 2], nativeClicks: 0 },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        let changes = 0;
        host.addEventListener("change", () => changes++);
        click(root);
        await nextTick();
        expect(changes).toBe(0); // 不切换不派发
        expect(host.getAttribute("data-value")).toBe("1");
        expect(engine.store.state.nativeClicks as number).toBe(1); // 原生 click 冒泡可收
    });

    test("clickable 出边锁：当前态 clickable=false 点击零效果，外部改走后循环恢复", async () => {
        const states = [
            { value: "on" },
            { value: "off", clickable: false },
        ];
        const { root, engine } = mount(
            `<button x-component:autospark.state-button="{ label: '锁', states: statesRef, value: vRef }"></button>`,
            { statesRef: states, vRef: "off" },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        let changes = 0;
        host.addEventListener("change", () => changes++);
        click(root);
        await nextTick();
        expect(changes).toBe(0); // 出边锁：零效果（不切换不派发）
        expect(host.getAttribute("data-value")).toBe("off");
        engine.store.state.vRef = "on"; // 外部受控改走（value 通道）
        await nextTick();
        expect(host.getAttribute("data-value")).toBe("on");
        click(root); // on 态未锁 → 循环照常进 off
        await nextTick();
        expect(host.getAttribute("data-value")).toBe("off");
    });
});

describe("decorate 装饰渲染（ADR-0016 决策 2）", () => {
    test("solid 佩戴态：tone 实底类挂载（当前态佩戴即显）", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '实底', states: sSolid }"></button>`,
            { sSolid: [{ value: 1 }, { value: 2, decorate: "solid" }] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).not.toContain("asc-d-solid");
        click(root);
        await nextTick();
        expect(host.className).toContain("asc-d-solid");
    });

    test("icon 占位型：组内任一佩戴即常驻占位标记、当前态佩戴显指示", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '图标', states: sIcon }"></button>`,
            { sIcon: [{ value: 1 }, { value: 2, decorate: "icon" }] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).toContain("asc-p-icon"); // 组内任一佩戴 → 常驻占位（防跳动）
        expect(host.className).not.toContain("asc-d-icon");
        click(root);
        await nextTick();
        expect(host.className).toContain("asc-d-icon");
    });

    test("ripple 占位型：指示 span 注入 body 最前、组标记与佩戴态类分置", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '涟漪', states: sRipple }"></button>`,
            { sRipple: [{ value: 1, decorate: "ripple" }, { value: 2 }] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        const body = root.querySelector(".asc-button-body")!;
        expect(host.className).toContain("asc-p-ripple");
        expect(host.className).toContain("asc-d-ripple"); // 首态佩戴（value 缺省落首态）
        const check = body.querySelector(":scope > .asc-state-check");
        expect(check).not.toBeNull(); // mounted 注入的指示器（body 最前）
    });

    test("态视觉键：type 覆盖语义色通道、label 覆盖兜底文案（插槽优先不在此测）", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '底', states: sLook }"></button>`,
            { sLook: [{ value: 1, type: "danger", label: "危险态" }] },
        );
        await nextTick();
        await nextTick(); // 态视觉写 data 键后绑定重算
        const host = root.querySelector("button")!;
        expect(host.querySelector(".asc-button-body")!.getAttribute("data-type")).toBe("danger");
        expect(host.textContent!.replace(/\s/g, "")).toContain("危险态");
        expect(host.textContent!.replace(/\s/g, "")).not.toContain("底");
    });

    test("button props 透传（2026-11-11 泛化）：variant/ghost/shape 随态整组切换", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '形态', states: sShape }"></button>`,
            {
                sShape: [
                    { value: 1, variant: "primary", type: "success" },
                    { value: 2, variant: "dashed", type: "danger" },
                    { value: 3, variant: "text", ghost: true },
                ],
            },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        const body = () => host.querySelector(".asc-button-body")!;
        expect(body().getAttribute("data-variant")).toBe("primary"); // 首态注入
        expect(body().getAttribute("data-type")).toBe("success");
        click(root);
        await nextTick();
        expect(body().getAttribute("data-variant")).toBe("dashed"); // 切态整组换装
        expect(body().getAttribute("data-type")).toBe("danger");
        click(root);
        await nextTick();
        expect(body().getAttribute("data-variant")).toBe("text");
        expect(body().getAttribute("data-ghost")).toBe("true");
        click(root);
        await nextTick();
        expect(body().getAttribute("data-variant")).toBe("primary"); // 回卷回退首态值
    });

    test("label 循环覆盖：后续态切换直写通道生效（computed 对后续赋值不重算的规避）", async () => {
        const { root } = mount(
            `<button x-component:autospark.state-button="{ label: '任务', states: sCycle }"></button>`,
            {
                sCycle: [
                    { value: "todo", label: "待办" },
                    { value: "doing", label: "进行中" },
                    { value: "done", label: "已完成" },
                ],
            },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.textContent!.replace(/\s/g, "")).toContain("待办"); // 初始态 label
        click(root);
        await nextTick();
        expect(host.textContent!.replace(/\s/g, "")).toContain("进行中"); // 后续态直写
        click(root);
        await nextTick();
        expect(host.textContent!.replace(/\s/g, "")).toContain("已完成");
    });
});

describe("表单桥与 x-model（ADR-0016 决策 9）", () => {
    test("布尔组：内嵌 checkbox（name 透传）、勾选随真值态、提交值在场", async () => {
        const { root } = mount(
            `<button name="agree" x-component:autospark.state-button="{ label: '同意' }"></button>`,
            {},
        );
        await nextTick();
        const real = root.querySelector("button")!.querySelector("input")!;
        expect(real.type).toBe("checkbox");
        expect(real.name).toBe("agree");
        expect(real.checked).toBe(false); // 缺省 false 态
        click(root);
        await nextTick();
        expect(real.checked).toBe(true);
        expect(real.value).toBe("true"); // 提交值 = String(true 态 value)
    });

    test("N>2 态：内嵌 hidden input、value 随当前值", async () => {
        const { root } = mount(
            `<button name="mode" x-component:autospark.state-button="{ label: '模式', states: sModes }"></button>`,
            { sModes: ["a", "b", "c"] },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        const real = host.querySelector("input")!;
        expect(real.type).toBe("hidden");
        expect(real.name).toBe("mode");
        expect(real.value).toBe("a");
        click(root);
        await nextTick();
        expect(real.value).toBe("b");
    });

    test("x-model 布尔桥：宿主 x-model（.boolean）点击回写 state 真布尔", async () => {
        const { root, engine } = mount(
            `<button x-model.boolean="flag" x-component:autospark.state-button="{ label: '桥' }"></button>`,
            { flag: false },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.className).not.toContain("asc-d-corner"); // x-model 编译期写 "false" → 未勾选
        click(root);
        await nextTick();
        expect(engine.store.state.flag).toBe(true); // input 派发 → x-model 回写（布尔保真）
        expect(host.className).toContain("asc-d-corner"); // 视觉同步
    });

    test("value 受控通道：外部改 value → 视觉跟随（watch 路径）", async () => {
        const { root, engine } = mount(
            `<button x-component:autospark.state-button="{ label: '受控视觉', states: sPair, value: vRef }"></button>`,
            { sPair: [1, 2], vRef: 1 },
        );
        await nextTick();
        const host = root.querySelector("button")!;
        expect(host.getAttribute("data-value")).toBe("1");
        engine.store.state.vRef = 2;
        await nextTick();
        expect(host.getAttribute("data-value")).toBe("2"); // watch → syncVisual
        engine.store.state.vRef = 99;
        await nextTick();
        expect(host.className).toContain("asc-unmatched"); // 域外回灰（value 不被擅改）
    });
});
