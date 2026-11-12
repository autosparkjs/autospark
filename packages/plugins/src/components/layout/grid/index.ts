/**
 * autospark.grid 组件插件（组件库 P0 轻件，ADR-0018 清单权威表 layout 行 /
 * ADR-0019）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——
 * 晚注册立即生效，同名后注册覆盖先注册。
 *
 * 栅格容器组件：通用等分栅格布局——列数（cols：number 固定 / "auto" 自适应 /
 * 响应式档位对象，档位名参照 viewport 六档 xs..xxl、min-width 断点自持经
 * matchMedia 探测，不依赖 x-viewport）、间隙（gap）、轨道水平分布（justify）、
 * 项块轴对齐（align）。与 engine layout 七指令（x-layout/x-pane 管页面骨架窗格
 * 分割）互补不重叠——彼是页面结构级窗格编排，此是通用内容栅格（卡片列表、
 * 表单行等）。
 *
 * 无内置文案、不接 i18n（ADR-0018 决策 1）；零色彩消费（暗色模式天然无感）。
 *
 * 模板自包含：`<script setup>`（cols/gap 的 JS 通道同步 + matchMedia 断点监听）+
 * `<style global>`（CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkGrid`（autospark.grid.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import gridTemplate from "./grid.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const GRID_NAME = "autospark.grid";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountGridPlugin(autospark: typeof AutoSpark): void {
    autospark.components[GRID_NAME] = gridTemplate;
}

bootstrapGridPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapGridPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountGridPlugin(autospark);
    });
}

export { bootstrapGridPlugin };
