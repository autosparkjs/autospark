/**
 * autospark.empty 组件插件（组件库 P0，ADR-0018 清单权威表 display 行 / ADR-0019）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 通用空状态组件：image 插槽（默认经 x-icon 内置图标）+ description（内置文案
 * 「暂无数据」走 modules/i18n 词典机制，键 empty.description——使用者可经
 * x-locales / 顶层 locales script / options.i18n.messages 任意语言覆译；未装 i18n
 * 插件或词典无此键时回退硬编码中文，ADR-0018 决策 6 约定 1）+ 默认插槽（描述下方
 * 附加内容，常放动作按钮）。
 *
 * 命名消歧：`x-empty` 作为**属性标记**是 x-for / x-tree 认的结构空态触发器（容器
 * 直接子元素上的无值属性）；本组件是 `autospark.empty` 通用空状态**展示组件**
 * （元素名形态 `<x-empty>` 与属性标记分属元素/属性两通道，互不相认）。
 *
 * 元素名快速写法 `<x-empty description="...">` 由 engine 元素名自动组件承载
 * （ADR-0117 缺省注册 x-empty 标签；ADR-0133 懒预编译时序缺口已由引擎编译期反查修复）。
 *
 * IIFE 产物全局名 `AutoSparkEmpty`（autospark.empty.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import emptyTemplate from "./empty.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const EMPTY_NAME = "autospark.empty";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountEmptyPlugin(autospark: typeof AutoSpark): void {
    autospark.components[EMPTY_NAME] = emptyTemplate;
}

bootstrapEmptyPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapEmptyPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountEmptyPlugin(autospark);
    });
}

export { bootstrapEmptyPlugin };
