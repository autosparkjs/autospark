/**
 * alert 组件插件测试（组件形态，样板同 button-plugin.test.ts）：
 * - 全局表注册 + 化身渲染（语义色 data-type / 标题描述两行 / 可选图标）；
 * - closable 关闭（点击收起 data-hidden 标记 + close 事件冒泡）；
 * - open 受控键（父状态翻转显隐 + 重新显示复位内部收起标记）。
 */
import "../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../helpers";
import { ALERT_NAME } from "../../components/alert/index";

/** 取实例宿主（化身后类名 asc-alert 落在宿主上） */
const hostOf = (root: HTMLElement) => root.querySelector<HTMLElement>(".asc-alert")!;

describe("alert 组件插件", () => {
    test("模块加载即注册：插件全局组件表含 autospark.alert 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[ALERT_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${ALERT_NAME}"`);
    });

    test("化身渲染：语义色 data-type + 标题/描述两行 + 描述缺省不渲染第二行", async () => {
        const { root } = mount(
            `<div>
                <div x-component:autospark.alert="{ type: 'danger', title: '错误危险', description: '提交失败' }"></div>
                <div x-component:autospark.alert="{ type: 'info', title: '仅标题' }"></div>
            </div>`,
            {},
        );
        await nextTick();
        const hosts = root.querySelectorAll(".asc-alert");
        expect(hosts.length).toBe(2);
        const [full, titleOnly] = hosts;
        expect(full.querySelector(".asc-alert-body")?.getAttribute("data-type")).toBe("danger");
        expect(full.querySelector(".asc-alert-title")?.textContent).toBe("错误危险");
        expect(full.querySelector(".asc-alert-description")?.textContent).toBe("提交失败");
        expect(full.querySelector(".asc-alert-description")?.style.display).toBe("");
        expect(titleOnly.querySelector(".asc-alert-body")?.getAttribute("data-type")).toBe("info");
        expect(titleOnly.querySelector(".asc-alert-description")?.style.display).toBe("none");
    });

    test("左侧图标：缺省按 type 取语义图标，false 关闭，字符串自定义", async () => {
        const { root } = mount(
            `<div>
                <div x-component:autospark.alert="{ type: 'warning', title: '语义图标' }"></div>
                <div x-component:autospark.alert="{ type: 'warning', title: '无图标', icon: false }"></div>
                <div x-component:autospark.alert="{ type: 'info', title: '自定义图标', icon: 'file' }"></div>
            </div>`,
            {},
        );
        await nextTick();
        const icons = Array.from(root.querySelectorAll<HTMLElement>(".asc-alert-icon"));
        expect(icons[0]?.style.display).toBe(""); // 缺省显示
        expect(icons[0]?.querySelector("use")?.getAttribute("href")).toBe("#as-warn"); // warning → warn
        expect(icons[1]?.style.display).toBe("none"); // icon: false
        expect(icons[2]?.querySelector("use")?.getAttribute("href")).toBe("#as-file"); // 自定义名
    });

    test("closable：缺省无关闭钮；开启后点击收起（data-hidden 标记）并派发 close 事件", async () => {
        const { root } = mount(
            `<div id="wrap">
                <div x-component:autospark.alert="{ type: 'info', title: '不可关闭' }"></div>
                <div x-component:autospark.alert="{ type: 'info', title: '可关闭', closable: true }"></div>
            </div>`,
            {},
        );
        await nextTick();
        const closers = Array.from(root.querySelectorAll<HTMLElement>(".asc-alert-close"));
        expect(closers[0]?.style.display).toBe("none"); // closable 缺省 false
        expect(closers[1]?.style.display).toBe(""); // 显式开启

        let closeCount = 0;
        root.addEventListener("close", () => closeCount++);
        closers[1]!.click();
        await nextTick();
        expect(closeCount).toBe(1);
        const body = root.querySelectorAll<HTMLElement>(".asc-alert-body")[1]!;
        expect(body.getAttribute("data-hidden")).not.toBeNull(); // 收起标记（:has() 驱动宿主隐藏）
        expect(body.style.display).toBe("none"); // x-show 双保险
    });

    test("open 受控：绑定父状态直接显隐；重新显示（假→真翻转）复位内部收起标记", async () => {
        const { root, engine } = mount(
            `<div @close="show = false">
                <div x-component:autospark.alert="{
                    type: 'danger',
                    title: '受控警告',
                    closable: true,
                    open: show,
                }"></div>
            </div>`,
            { show: true },
        );
        await nextTick();
        const host = hostOf(root);
        expect(host.querySelector(".asc-alert-body")?.getAttribute("data-hidden")).toBeNull();

        // 点击关闭：内部收起 + close 事件同步父状态 show=false（open 随之转假）
        host.querySelector<HTMLElement>(".asc-alert-close")!.click();
        await nextTick();
        expect(host.querySelector(".asc-alert-body")?.getAttribute("data-hidden")).not.toBeNull();
        expect((engine.store.state as { show: boolean }).show).toBe(false);

        // 父状态重新置真：open 假→真翻转复位 closed，警告条重新显示
        (engine.store.state as { show: boolean }).show = true;
        await nextTick();
        expect(host.querySelector(".asc-alert-body")?.getAttribute("data-hidden")).toBeNull();
        expect(host.querySelector(".asc-alert-body")?.style.display).toBe("");

        // 纯受控显隐：open 直接转假隐藏（无须点击关闭）
        (engine.store.state as { show: boolean }).show = false;
        await nextTick();
        expect(host.querySelector(".asc-alert-body")?.getAttribute("data-hidden")).not.toBeNull();
    });

    test("响应式 type：props 切换语义色标记与语义图标联动", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.alert="{ type: t, title: '响应式' }"></div>`,
            { t: "info" },
        );
        await nextTick();
        const host = hostOf(root);
        expect(host.querySelector(".asc-alert-body")?.getAttribute("data-type")).toBe("info");
        expect(host.querySelector(".asc-alert-icon use")?.getAttribute("href")).toBe("#as-info");

        (engine.store.state as { t: string }).t = "danger";
        await nextTick();
        expect(host.querySelector(".asc-alert-body")?.getAttribute("data-type")).toBe("danger");
        expect(host.querySelector(".asc-alert-icon use")?.getAttribute("href")).toBe("#as-error");
    });
});
