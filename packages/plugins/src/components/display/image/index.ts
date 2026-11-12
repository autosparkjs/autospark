/**
 * autospark.image 组件插件（组件库 P1，ADR-0018 清单权威表 display 行「image（P1）」）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 图片组件：src / alt / lazy（原生 loading=lazy）/ fit（object-fit 五档）/ width·height
 * 透传（img 原生属性）+ fallback（加载失败占位：图标名或图片 URL 双形态）+ 加载态
 * 转圈（内置 loading 图标 SMIL 自转，零 CSS 动画依赖）。点击预览**不做**——P2 的
 * image-viewer 承接（ADR-0018 清单表 image-viewer 行；本件点击原生冒泡，使用者可
 * 自行挂 @click 接入未来的预览层，边界声明见组件 ADR）。
 *
 * 元素名快速写法 `<x-image src="...">` 由 engine 元素名自动组件承载（ADR-0117
 * 缺省注册 x-image 标签）；div 根无原生语义损失，不做 precompile 变换（ADR-0019
 * link 判据——真 img 语义由内层 img 元素承载，宿主仅容器）。
 *
 * IIFE 产物全局名 `AutoSparkImage`（autospark.image.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import imageTemplate from "./image.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const IMAGE_NAME = "autospark.image";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountImagePlugin(autospark: typeof AutoSpark): void {
    autospark.components[IMAGE_NAME] = imageTemplate;
}

bootstrapImagePlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapImagePlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountImagePlugin(autospark);
    });
}

export { bootstrapImagePlugin };
