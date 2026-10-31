/**
 * 运行时桥漂移锁（@autospark/plugins ADR-0001 决策 4 修订）：全家族零 autospark 值导入
 * （类型导入编译期剥除），autospark 能力经 src/utils/namespace.ts 运行时解析——
 * `globalThis.AutoSpark`（脚本场景，IIFE 引擎先加载）或预加载队列插件体第二参（ESM 场景，
 * engine 构造期 drain 注入）。
 *
 * 桥取用面 = engine index.ts 类静态补挂名单（源码级，ESM/CJS/IIFE 三形态同构）+ engine
 * 公开导出（SCOPES_KEY）。本测试锁两边同步：engine 侧改名/移除成员即红——缺位在生产中
 * 表现为插件运行期 nsMember 抛错（响而不哑），此处前置到测试期暴露。
 */
import { describe, expect, test } from "bun:test";
import { getOverlayContainer } from "../../utils/getOverlayContainer";
import { markRaw } from "../../utils/markRaw";
import { nsMember, resolveNamespace } from "../../utils/namespace";
import { scopesKey } from "../../utils/scopesKey";
import { shallow } from "../../utils/shallow";
import "../setup";

describe("运行时桥（ADR-0001 决策 4 修订）", () => {
    test("命名空间可达：globalThis.AutoSpark（setup 预置，模拟 IIFE 引擎先加载时序）", () => {
        expect(resolveNamespace()).toBe((globalThis as { AutoSpark?: unknown }).AutoSpark);
        expect(resolveNamespace()).not.toBeNull();
    });

    test("桥消费面成员齐备：engine 类静态补挂名单与 bridge 取用面同步（缺位即红）", () => {
        const ns = resolveNamespace() as Record<string, unknown>;
        // 与 components src 内 nsMember/桥函数取用面逐项对应，缺一项即一次生产期运行时错误
        for (const name of ["getOverlayContainer", "markRaw", "shallow", "ComponentInstance", "SCOPES_KEY"]) {
            expect(ns[name], `AutoSpark.${name} 缺位——engine index.ts 类静态补挂名单与桥消费面漂移`).toBeDefined();
        }
    });

    test("nsMember 缺位显式报错（响而不哑，不静默失效）", () => {
        expect(() => nsMember("__definitely_missing__")).toThrow(/缺少成员 "__definitely_missing__"/);
    });

    test("scopesKey 返回 engine 公开导出的 SCOPES_KEY（store 点路径订阅坐标）", () => {
        const ns = resolveNamespace() as Record<string, unknown>;
        expect(scopesKey()).toBe(ns.SCOPES_KEY);
        expect(typeof scopesKey()).toBe("string");
    });

    test("markRaw 恒等透传（_abort 免代理契约：AbortController 品牌校验依赖原生引用）", () => {
        const controller = new AbortController();
        expect(markRaw(controller)).toBe(controller);
    });

    test("shallow 可调用返回值（manager 浅响应化通道）", () => {
        expect(shallow({ a: 1 }, 0)).toBeDefined();
    });

    test("getOverlayContainer 桥函数就绪（overlay 挂载消费者取用）", () => {
        expect(typeof getOverlayContainer).toBe("function");
    });
});
