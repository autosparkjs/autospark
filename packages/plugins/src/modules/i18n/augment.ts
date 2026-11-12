/**
 * i18n 插件对 engine 类型面的声明合并（ADR-0136；对称 notifications/resources augment 先例）。
 *
 * 仅 `AutoSparkOptions.i18n` 一个键——`engine.translate` 翻译实现槽由 engine 核心
 * 自己声明（核心拥有兜底实现），插件无 augmentation 负担。
 *
 * 纯类型文件：无运行时代码。经插件入口 index.ts 副作用导入进入编译图。
 */
import type { Dict } from "autospark";
import type { I18nOptions } from "./types";

declare module "autospark" {
    interface AutoSparkOptions<State extends Dict = any> {
        /**
         * 多语言配置（ADR-0136，仅装载 i18n 插件后生效）：default / language / fallback /
         * languages / messages 五键，形态见 {@link I18nOptions}。engine 运行时零解释本字段；
         * router 未显式传 options.languages 时自动取 `i18n.languages`。
         */
        i18n?: I18nOptions;
    }
}
