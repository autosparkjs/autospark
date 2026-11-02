/**
 * tooltip 特性插件自举（autospark.tooltip.js，ADR-0128 决策 4 薄壳化）：
 * ① 命名空间工厂（AutoSpark.tooltipFactory）——engine.tooltip 薄壳 getter 经此惰建
 * per-engine TooltipManager；
 * ② AutoSpark.ready 对每个 engine 构造完成即主动建 manager（构造期委托监听/样式
 * 就位的原语义保留——懒建会丢「hover 即响应」；options.tooltip: false 三态守卫
 * 在 manager 构造内，全关语义不变）；
 * ③ 编译期 title→data-tooltip 转换开启（enableTooltipConvert——选择性引入即开关：
 * 未加载本插件时 title 保持浏览器原生行为）。
 */
import { installPlugin } from "@autospark/utils";
import { nsMember } from "../../utils/namespace";
import type { AutoSpark } from "autospark";
import { TooltipManager } from "./manager";

export function bootstrapTooltipPlugin(): void {
    installPlugin((autospark) => {
        (autospark as unknown as Record<string, unknown>).tooltipFactory = (engine: AutoSpark) =>
            new TooltipManager(engine);
        nsMember<() => void>("enableTooltipConvert")();
        // 构造期就位通道：每个 engine 构造完成即建 manager（经薄壳 getter 走工厂，缓存同实例）
        (autospark as unknown as { ready: (fn: (engine: AutoSpark) => void) => void }).ready((engine) => {
            void engine.tooltip;
        });
    });
}

// 模块加载即自举（对称家族惯例：置于模块尾部）
bootstrapTooltipPlugin();
