// 显式文件路径导入（规避 ./types.ts 与组件目录的模块解析歧义——文件恒胜目录，
// 但显式路径让意图无歧义）
import type { AutoSpark } from "../../engine/engine";
import TOAST_TEMPLATE from "../../components/toast.html?raw";
import TASK_TEMPLATE from "../../components/task.html?raw";
import CONFIRM_TEMPLATE from "../../components/confirm.html?raw";
import BASE_TEMPLATE from "../../components/base.html?raw";
import ACTIONS_TEMPLATE from "../../components/actions.html?raw";
import { ACTIONS_PRESET_NAME, BASE_PRESET_NAME, presetComponentName } from "./types";

/**
 * 消息预设组件族（ADR-0083 → ADR-0088 内容归属 → ADR-0089 type 组件化 → **ADR-0092 单文件化**）：
 * 每个 type 的实现 = 一个 autospark 组件，**单 .html 自包含**（结构 + `<script setup>` 的 defaults
 * 种子段 + `<style global>` 样式段，住 `src/components/`）——本文件只承载跨 type 的公共件引用与
 * 注册面：
 *
 * - **`autospark.messages.base`（族根，ADR-0089 决策二升格）**：所有 type 组件的公共基座——
 *   结构 + 行为（公共 methods 七件）+ 约定键默认值，经 `x-define:inherit` **结构+行为双继承**
 *   下渗全部 type；引擎对 type 组件自动补 inherit（未显式声明者）。用户同名覆盖 base = 全族换根。
 * - **`autospark.messages.actions`**（ADR-0088 唯一公共组合件）：按钮行——x-for + 委托契约，
 *   type 模板内 `x-component` 组合消费；点击闭环由 manager 卡片根委托收口。
 * - 公共骨架 shell（`autospark.messages.shell`）同为内置组件（engine 构造期并入
 *   `builtinComponents` 种子表），外观与内容正交（ADR-0088 沿用）。
 *
 * 约定键协议（ADR-0089 决策五——引擎联动、模板/methods 读）：
 * `holdOpen`（true = 不自动关，task 完成态联动置 false）/ `visible`（在屏态）/ `closed`
 * （记录关闭态）/ `remaining`（自动关闭剩余 ms；-1 = sticky/不计时）。
 *
 * 注册面：engine 构造期并入 `builtinComponents` 种子表（用户同名声明覆盖优先）；
 * `autospark.*` 点前缀为引擎保留命名空间。type 链查找协议（与 shell 链正交）：
 * `types[type].render` → 全局组件表 `autospark.messages.<type>` → base 兜底（ADR-0088 沿用）。
 */

/** 预设名约定自 types.ts 收敛引入（re-export 维持本文件「注册面」一站式可见） */
export { ACTIONS_PRESET_NAME, BASE_PRESET_NAME, presetComponentName };

/** 预设组件种子表：engine 构造期并入 builtinComponents（用户同名覆盖优先——展开序在后） */
export const MESSAGE_PRESET_COMPONENTS: Record<string, string> = {
    [ACTIONS_PRESET_NAME]: ACTIONS_TEMPLATE,
    [BASE_PRESET_NAME]: BASE_TEMPLATE,
    [presetComponentName("toast")]: TOAST_TEMPLATE,
    [presetComponentName("task")]: TASK_TEMPLATE,
    [presetComponentName("confirm")]: CONFIRM_TEMPLATE,
};

/** re-export base/actions 模板（消费面一站式可见；来源即组件文件本体） */
export { BASE_TEMPLATE, ACTIONS_TEMPLATE };

/**
 * 内置 type 种子默认（合并链 type 种子层的引擎侧来源，ADR-0089 决策九 + **ADR-0092 模板化**）：
 * 默认值不再住独立常量——**随组件声明**（各 type .html 的 `<script setup>` defaults 段），
 * 经组件表懒解析提取（`def.defaults`）。用户同名覆盖 type 组件时，覆盖组件自带的 defaults
 * 自然生效（覆盖彻底性语义，ADR-0092）；覆盖组件未声明 defaults 则该 type 无种子层。
 *
 * @param engine 引擎实例（组件查找链）
 * @param type   type 名（toast/task/confirm 或用户扩展 type）
 * @returns 该 type 的种子默认（未命中 / 组件未声明 defaults 为 undefined）
 */
export function resolveTypeDefaults(
    engine: AutoSpark,
    type: string,
): Record<string, any> | undefined {
    const name = presetComponentName(type);
    const snapshot = engine._resolveGlobalComponent(name);
    if (!snapshot) return undefined;
    const def = engine.getComponentDef(snapshot) ?? engine.getGlobalComponentDef(name) ?? null;
    return def?.defaults;
}
