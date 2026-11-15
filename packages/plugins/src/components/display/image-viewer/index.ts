/**
 * autospark.image-viewer 组件插件（组件库 P2，ADR-0018 清单权威表 display 行
 * 「image-viewer（P2）」——image 组件 P1 边界声明的预览承接件）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 全屏图片查看器：images（url 数组，状态引用注入）/ visible（受控显隐）/ index
 * （受控当前图）+ 缩放/旋转/重置工具栏 + 键盘（左右切换、ESC 关、±缩放）+
 * 前后翻页钮与计数器。形态裁定为**自建 fixed 全屏层**（不组合 x-dialog——取舍
 * 声明见模板文件头与 P2 批 ADR）：零跨插件产物依赖，ESC/遮罩点击自实现。
 *
 * 与 image 组件的联动以**配方文档**交付（ADR-0018 决策 3 同款边界）：image 点击
 * 原生冒泡，调用方 `@click` 外挂本查看器（文档配方示例）。
 *
 * IIFE 产物全局名 `AutoSparkImageViewer`（autospark.image-viewer.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import imageViewerTemplate from "./image-viewer.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const IMAGE_VIEWER_NAME = "autospark.image-viewer";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountImageViewerPlugin(autospark: typeof AutoSpark): void {
    autospark.components[IMAGE_VIEWER_NAME] = imageViewerTemplate;
}

bootstrapImageViewerPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapImageViewerPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountImageViewerPlugin(autospark);
    });
}

export { bootstrapImageViewerPlugin };
