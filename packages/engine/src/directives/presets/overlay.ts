import { AutoSparkDirectiveBase } from "../base";
import type { AutoSparkScope } from "../../scope";
import { relaxedToJson } from "../../utils/relaxedToJson";
import { buildComponentDef } from "../../compile/collect";
import type { OverlayDef } from "../../overlay/types";

/**
 * x-overlay 覆盖层定义（ADR-0052 决策 5）：编译期树变换标记，**非渲染指令**。
 *
 * 声明形态：`<div x-overlay:login="dialog">…</div>`——名称走冒号 attr（与 x-on:click 同构，
 * `.global` 等修饰符在句点段并存：`x-overlay:login.global="dialog"`）；值是类型认领标记
 * （dialog / drawer / popup / popover，无值 = 通用）。
 *
 * 收集发生在 compiler 前置 transformer（`_collectOverlay`，与 x-component 收集同构）：
 * 深克隆冻结快照挂最近祖先 scope 的 `overlays`（`.global` 升 engine 级全局表），返回 null 剪枝——
 * 不进结果 DOM、不建 scope、不被实例化（声明处无闪现）。本类仅为合法可发现名位（x-component
 * 同构），**永不被实例化**。
 *
 * 生命周期：局部定义随 owner scope 对象回收；`.global` 定义由 engine 监听 `scope/destroyed`
 * （owner 引用比对）从全局表注销。
 */
export class OverlayDirective extends AutoSparkDirectiveBase {}

/**
 * 解析元素上的 x-overlay 声明属性（`x-overlay[:名称][.修饰符…]`）。
 *
 * getDirectiveAttrValue 只匹配 `x-<name>` / `x-<name>.` 形态，覆盖不了带冒号 attr 的
 * `x-overlay:login`——故自行遍历属性名解析。
 *
 * @returns `{ name, type, global }`；元素未声明 x-overlay 返回 null；缺名称返回 `name: ""`
 * （调用方 warn + 剪枝——名称是查找键，必需）。
 */
export function parseOverlayAttr(el: HTMLElement): { name: string; type: string; global: boolean } | null {
    for (const attrName of el.getAttributeNames()) {
        if (attrName !== "x-overlay" && !attrName.startsWith("x-overlay:")) continue;
        const m = /^x-overlay(?::([\w$-]+))?((?:\.[\w-]+)*)$/.exec(attrName);
        if (!m) continue;
        const [, name = "", mods = ""] = m;
        return {
            name,
            type: (el.getAttribute(attrName) ?? "").trim(),
            global: mods.split(".").includes("global"),
        };
    }
    return null;
}

/**
 * 组装覆盖层定义（ADR-0052 决策 5）：复用 `buildComponentDef` 管道（`<script setup>`/`<style>`
 * 提取求值、深克隆冻结快照并剥离 script/style），叠加 overlay 专属字段（type/options/owner）。
 */
export function buildOverlayDef(
    el: HTMLElement,
    name: string,
    type: string,
    owner: AutoSparkScope,
    warn: (msg: string) => void,
): OverlayDef {
    const base = buildComponentDef(el, name, warn);
    return {
        ...base,
        type,
        options: parseOverlayOptions(el, warn),
        owner,
        singletonInstance: null,
    };
}

/** 提取声明处选项 `x-overlay-options`（relaxed-json 对象；缺失/非法返回 null） */
function parseOverlayOptions(el: HTMLElement, warn: (msg: string) => void): Record<string, any> | null {
    const raw = el.getAttribute("x-overlay-options");
    if (raw == null || raw.trim() === "") return null;
    try {
        const parsed: unknown = JSON.parse(relaxedToJson(raw));
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            warn(`x-overlay "${name(el)}": x-overlay-options 须解析为对象，声明被忽略`);
            return null;
        }
        return parsed as Record<string, any>;
    } catch (e: any) {
        warn(`x-overlay: x-overlay-options 解析失败: ${e?.message ?? e}`);
        return null;
    }
}

/** 取解析期名称（parseOverlayOptions 的 warn 消息用；此时 attr 已解析） */
function name(el: HTMLElement): string {
    return parseOverlayAttr(el)?.name ?? "";
}
