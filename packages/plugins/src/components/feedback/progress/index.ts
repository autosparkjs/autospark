/**
 * autospark.progress 组件插件（组件库 P1 轻件，ADR-0018 清单权威表 feedback 行「progress（P1）」）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 进度条：line 形态（轨道 + 填充，width 百分比过渡）/ circle 形态（SVG 圆环
 * stroke-dashoffset 过渡）双形态；percent（0-100 钳制）、showText（百分比文本 /
 * status 态语义图标）、status（success/error/warning 联动语义色，percent>=100 且
 * status 缺省自动升 success——antd 同款）、strokeWidth（line 轨道高 / circle 环粗，
 * px）。纯展示组件，无事件；语义色组织与 alert 同款（--asc-tone 中转 + :has()
 * 反驱宿主，ADR-0012 基线）。
 *
 * 无内置文案、不接 i18n（百分比数字自表述）；字号档位经主题通道 data-size 全跟随。
 *
 * 模板自包含：`<script setup>`（props 与 aria 同步）+ `<style global>`（CSS 变量
 * 主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkProgress`（autospark.progress.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import progressTemplate from "./progress.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const PROGRESS_NAME = "autospark.progress";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountProgressPlugin(autospark: typeof AutoSpark): void {
    autospark.components[PROGRESS_NAME] = progressTemplate;
}

bootstrapProgressPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapProgressPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountProgressPlugin(autospark);
    });
}

export { bootstrapProgressPlugin };
