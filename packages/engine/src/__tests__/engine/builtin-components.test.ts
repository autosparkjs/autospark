import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount } from "../helpers";
import type { AutoSpark } from "../../engine/engine";
import {
    BUILTIN_COMPONENTS,
    DIALOG_SHELL_NAME,
    ERROR_COMPONENT_NAME,
    OVERLAY_COMPONENT_NAME,
    POPOVER_SHELL_NAME,
    DRAWER_SHELL_NAME,
} from "../../components";

/**
 * 内置组件注册位与查找统一（ADR-0094）：
 * - 双注册位：`options.builtinComponents`（内置默认）< `options.components`（业务定制）；
 * - 点前缀注册名：全部内置组件统一 `autospark.` 命名空间（与用户业务组件零冲突）；
 * - `getComponentDeclaration(name, el?)`：el 省略或反查失败退纯全局，el 有 scope 走链就近；
 * - `def.builtin` 命中点级标记：模板与内置种子逐字相同才为 true，用户任一侧覆盖即 false。
 *
 * 通知族已随 @autospark/plugins ADR-0001 迁出引擎种子表——其注册位/覆盖/族根语义
 * 由 plugins 包 `__tests__/features/notifications-*.test.ts` 承接（插件 ready 时
 * per-engine 写入 builtinComponents 种子，本表不再含通知键）。
 */

describe("内置组件注册位与查找统一（ADR-0094）", () => {
    const spawned: AutoSpark[] = [];
    afterEach(() => {
        for (const e of spawned) {
            try {
                e.destroy();
            } catch {
                // 幂等销毁吞错
            }
        }
        spawned.length = 0;
    });

    const spawn = (html: string, state: any = {}, options?: Parameters<typeof mount>[2]) => {
        const m = mount(html, state, options);
        spawned.push(m.engine);
        return m;
    };

    test("点前缀注册：省略 el 纯全局命中内置组件，def.builtin=true", () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const snap = engine.getComponentDeclaration(DIALOG_SHELL_NAME);
        expect(snap).not.toBeNull(); // 省略 el → 纯全局，内置种子兜底
        const def = engine.getGlobalComponentDef(DIALOG_SHELL_NAME);
        expect(def?.builtin).toBe(true); // 内置原版标记
        expect(def?.name).toBe(DIALOG_SHELL_NAME);
    });

    test("el 反查失败兜底全局：游离元素等价全局消费者", () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const free = document.createElement("div"); // 不在任何 engine 内
        const snap = engine.getComponentDeclaration(DIALOG_SHELL_NAME, free);
        expect(snap).not.toBeNull(); // 反查不到 scope → 退纯全局（修复旧签名不兜底的不对称）
    });

    test("el 有 scope 走链：局部 x-define 同名遮蔽内置（就近覆盖）", () => {
        // scope 挂在编译产物的 x-scope 元素上（root 是挂载容器；产物剥指令属性，不能用属性选择器反查）
        const { root, engine } = spawn(
            `<div x-scope>
                <div x-define="${DIALOG_SHELL_NAME}" class="local-dialog"><b>本地</b></div>
             </div>`,
            {},
        );
        const scopeRoot = root.firstElementChild as HTMLElement;
        const snap = engine.getComponentDeclaration(DIALOG_SHELL_NAME, scopeRoot);
        expect(snap?.className).toBe("local-dialog"); // 局部声明遮蔽内置 dialog-shell
    });

    test("builtinComponents 覆盖：用户同名替换内置默认，builtin 翻 false", () => {
        const { engine } = spawn(
            `<div><span>x</span></div>`,
            {},
            {
                builtinComponents: {
                    [DIALOG_SHELL_NAME]: `<div class="my-base" x-define="${DIALOG_SHELL_NAME}"></div>`,
                },
            },
        );
        expect(engine.getComponentDeclaration(DIALOG_SHELL_NAME)).not.toBeNull(); // 触发懒预编译
        const def = engine.getGlobalComponentDef(DIALOG_SHELL_NAME);
        expect(def?.builtin).toBe(false); // 接管后非内置原版
        expect(def?.snapshot.className).toBe("my-base");
        // 未覆盖的内置键不受影响
        expect(engine.getComponentDeclaration(POPOVER_SHELL_NAME)).not.toBeNull();
        expect(engine.getGlobalComponentDef(POPOVER_SHELL_NAME)?.builtin).toBe(true);
    });

    test("双注册位优先级：components 同名压过 builtinComponents", () => {
        const { engine } = spawn(
            `<div><span>x</span></div>`,
            {},
            {
                components: {
                    // 不带 x-define → 自动包装打本键名（一般定制通道）
                    [DIALOG_SHELL_NAME]: `<div class="via-components"></div>`,
                },
                builtinComponents: {
                    [DIALOG_SHELL_NAME]: `<div class="via-builtin" x-define="${DIALOG_SHELL_NAME}"></div>`,
                },
            },
        );
        expect(engine.getComponentDeclaration(DIALOG_SHELL_NAME)).not.toBeNull(); // 触发懒预编译
        const def = engine.getGlobalComponentDef(DIALOG_SHELL_NAME);
        expect(def?.snapshot.className).toBe("via-components"); // components 优先级更高
        expect(def?.builtin).toBe(false);
    });

    test("种子表键面：全部统一 autospark. 点前缀", () => {
        const keys = Object.keys(BUILTIN_COMPONENTS);
        // 每键均以引擎保留命名空间开头（与用户业务组件零冲突）。原 block-popover 点自由名
        // 载体别名已退役（ADR-0098）；x-foldable 面板外壳默认走本种子表 autospark.popover
        //（内置边框/箭头/出口——克隆壳机制已随修订记录 10 移除）
        for (const k of keys) {
            expect(k.startsWith("autospark.")).toBe(true);
        }
        // overlay 家族 shell + overlay 结构骨架 + error（通知族已随 @autospark/plugins
        // ADR-0001 迁出）
        for (const k of [
            DIALOG_SHELL_NAME,
            POPOVER_SHELL_NAME,
            DRAWER_SHELL_NAME,
            OVERLAY_COMPONENT_NAME,
            ERROR_COMPONENT_NAME,
        ]) {
            expect(keys.includes(k)).toBe(true);
        }
        expect(keys.length).toBe(5); // 3 overlay 家族 shell + autospark.overlay + error
    });
});
