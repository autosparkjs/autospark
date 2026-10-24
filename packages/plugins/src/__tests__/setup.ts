/**
 * 测试环境初始化（自 packages/engine/src/__tests__/setup.ts 复制，ADR-0001 测试基座随
 * 通知插件迁入本包）
 *
 * bun test 默认不内置浏览器 DOM，这里通过 happy-dom 的全局注册器
 * 把 document、HTMLElement、Node 等 DOM API 注入到 globalThis，
 * 使被测代码中基于 HTMLElement 的逻辑可以在测试中运行。
 *
 * 同时注册自定义 matcher `toEqualHTML`：接收 Element 或字符串，两侧经
 * formatHTML 归一为缩进层次结构后比较（结构等价），失败时输出多行对照。
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { expect } from "bun:test";
import { AutoSpark } from "autospark";
import { formatHTML } from "./format";

GlobalRegistrator.register();

/**
 * 全局类预置（模拟 IIFE 引擎先加载的浏览器时序）：插件自举双路径中「AutoSpark 已存在 →
 * `directive(spec)` 直注册」依赖全局类可达。测试进程内首个 engine 构造会 drain 并冻结
 * `__AUTOSPARK_PLUGINS__` 预加载队列（ADR-0114），后加载的插件模块再 push 会抛
 * readonly 错——预置全局类让所有插件模块统一走 directive 通道，与生产 IIFE 主时序一致。
 */
(globalThis as { AutoSpark?: typeof AutoSpark }).AutoSpark = AutoSpark;

/**
 * 自定义 matcher：断言元素/HTML 的渲染结构等于期望。
 *
 * actual 与 expected 都经 formatHTML 归一（解析→缩进），断言建立在结构等价之上，
 * 宽容 happy-dom 序列化的无关差异。失败 message 直接给出两侧的多行格式化结果，
 * 便于人眼定位差异元素/属性/文本。
 */
expect.extend({
    toEqualHTML(received: unknown, expected: string) {
        let actual: string;
        if (typeof received === "string") {
            actual = received;
        } else if (received instanceof Element) {
            // data-autospark（engine 根标识，ADR-0060）与 data-viewport（全局档位，
            // ADR-0105）是运行时打点的引擎根级属性，不属于模板编译产物——结构等价比较前
            // 精确剥除，避免既有 HTML 断言逐一修改。
            const clone = received.cloneNode(true) as Element;
            clone.removeAttribute("data-autospark");
            clone.removeAttribute("data-viewport");
            for (const name of [...clone.getAttributeNames()]) {
                if (name.startsWith("data-autospark-")) clone.removeAttribute(name);
            }
            actual = clone.outerHTML;
        } else {
            actual = String(received ?? "");
        }
        const actualFmt = formatHTML(actual);
        const expectedFmt = formatHTML(expected);
        const pass = actualFmt === expectedFmt;
        return {
            pass,
            message: () =>
                `HTML 结构不一致（已格式化为缩进层次）：\n── 预期 ──\n${expectedFmt}\n── 实际 ──\n${actualFmt}`,
        };
    },
});

// TS 声明合并：把 toEqualHTML 注入 bun:test 的 Matchers 接口，获得类型提示。
// 类型参数须与 bun-types 原声明 `Matchers<T = unknown>` 完全一致（TS2428）。
declare module "bun:test" {
    interface Matchers<T = unknown> {
        toEqualHTML(expected: string): T;
    }
}
