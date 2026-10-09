import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount } from "../helpers";
import type { AutoSpark } from "../../engine/engine";
import {
    BUILTIN_COMPONENTS,
    DIALOG_SHELL_NAME,
    ERROR_COMPONENT_NAME,
    POPOVER_SHELL_NAME,
    DRAWER_SHELL_NAME,
    SHELL_PRESET_NAME,
    presetComponentName,
} from "../../components";

/**
 * 内置组件注册位与查找统一（ADR-0094）：
 * - 双注册位：`options.builtinComponents`（内置默认）< `options.components`（业务定制）；
 * - 点前缀注册名：全部内置组件统一 `autospark.` 命名空间（与用户业务组件零冲突）；
 * - `getComponentDeclaration(name, el?)`：el 省略或反查失败退纯全局，el 有 scope 走链就近；
 * - `def.builtin` 命中点级标记：模板与内置种子逐字相同才为 true，用户任一侧覆盖即 false。
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
        const snap = engine.getComponentDeclaration(SHELL_PRESET_NAME);
        expect(snap).not.toBeNull(); // 省略 el → 纯全局，内置种子兜底
        const def = engine.getGlobalComponentDef(SHELL_PRESET_NAME);
        expect(def?.builtin).toBe(true); // 内置原版标记
        expect(def?.name).toBe(SHELL_PRESET_NAME);
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
                    [SHELL_PRESET_NAME]: `<div class="my-base" x-define="${SHELL_PRESET_NAME}"></div>`,
                },
            },
        );
        expect(engine.getComponentDeclaration(SHELL_PRESET_NAME)).not.toBeNull(); // 触发懒预编译
        const def = engine.getGlobalComponentDef(SHELL_PRESET_NAME);
        expect(def?.builtin).toBe(false); // 接管后非内置原版
        expect(def?.snapshot.className).toBe("my-base");
        // 未覆盖的内置键不受影响
        expect(engine.getComponentDeclaration(DIALOG_SHELL_NAME)).not.toBeNull();
        expect(engine.getGlobalComponentDef(DIALOG_SHELL_NAME)?.builtin).toBe(true);
    });

    test("双注册位优先级：components 同名压过 builtinComponents", () => {
        const { engine } = spawn(
            `<div><span>x</span></div>`,
            {},
            {
                components: {
                    // 不带 x-define → 自动包装打本键名（一般定制通道）
                    [SHELL_PRESET_NAME]: `<div class="via-components"></div>`,
                },
                builtinComponents: {
                    [SHELL_PRESET_NAME]: `<div class="via-builtin" x-define="${SHELL_PRESET_NAME}"></div>`,
                },
            },
        );
        expect(engine.getComponentDeclaration(SHELL_PRESET_NAME)).not.toBeNull(); // 触发懒预编译
        const def = engine.getGlobalComponentDef(SHELL_PRESET_NAME);
        expect(def?.snapshot.className).toBe("via-components"); // components 优先级更高
        expect(def?.builtin).toBe(false);
    });

    test("种子表键面：全部统一 autospark. 点前缀", () => {
        const keys = Object.keys(BUILTIN_COMPONENTS);
        // 每键均以引擎保留命名空间开头（与用户业务组件零冲突）
        for (const k of keys) {
            expect(k.startsWith("autospark.")).toBe(true);
        }
        // overlay 家族 shell + error
        for (const k of [
            DIALOG_SHELL_NAME,
            POPOVER_SHELL_NAME,
            DRAWER_SHELL_NAME,
            ERROR_COMPONENT_NAME,
        ]) {
            expect(keys.includes(k)).toBe(true);
        }
        // 通知族（shell 族根 + 三 type；actions 子组件已随 ADR-0097 退役内联）
        for (const k of [
            SHELL_PRESET_NAME,
            presetComponentName("toast"),
            presetComponentName("task"),
            presetComponentName("confirm"),
        ]) {
            expect(keys.includes(k)).toBe(true);
        }
        expect(keys.length).toBe(8);
    });
});
