/**
 * @autospark/components 组件资产注册面（镜像 engine/src/components/index.ts 的纪律）：
 * 全部组件模板 `?raw` 导入、注册名常量与聚合种子表收敛于此——包内单点引用。
 *
 * 注册名统一 `autospark.` 点前缀（ADR-0094 命名空间）：消费方将本表喂给
 * `new AutoSpark(el, state, { components: AUTOSPARK_COMPONENTS })` 业务注册位
 * ——优先级高于内置 `builtinComponents`，同名即覆盖内置组件。
 *
 * 本包运行时零依赖 `autospark`：产物是自包含模板字符串表，engine 仅为 devDependencies
 * （demo 开发用，见 demo/ 与 vite.config.ts）。
 */
import BUTTON_TEMPLATE from "./components/button.html?raw";

/** 按钮组件（button.html）：type/size 外观变体 + label 兜底的默认插槽 */
export const BUTTON_NAME = "autospark.button";

/** 组件种子表：喂给 AutoSpark 构造 options.components */
export const AUTOSPARK_COMPONENTS: Record<string, string> = {
  [BUTTON_NAME]: BUTTON_TEMPLATE,
};
