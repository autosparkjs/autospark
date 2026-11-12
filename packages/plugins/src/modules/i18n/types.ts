/**
 * i18n 插件配置类型（ADR-0136）。
 *
 * `AutoSparkOptions.i18n` 的声明形态——engine 运行时零解释本字段（类型面经
 * types/augment.ts 声明合并挂入）；router 经 `engine.options.i18n.languages`
 * 消费语言清单子集（未显式传 router options.languages 时自动取）。
 */

/** 语言清单项（code 与 `$.language` / 字典语言码键对齐；name/nativeName 供切换器 UI 透出） */
export interface I18nLanguageItem {
    /** 语言码（BCP 47 风格，如 `en` / `zh-CN`；归一匹配大小写与 `-`/`_` 等价） */
    code: string;
    /** 语言名（英文名，如 "English"） */
    name?: string;
    /** 自称名（如 "简体中文"） */
    nativeName?: string;
}

/**
 * i18n 配置（ADR-0136 决策二）：
 * - `default`：字典键的书写语言——**仅元数据**（与 languages[0].code 不一致 dev warn）；
 * - `language`：当前语言初值（`$.language` 未设置时注入）；
 * - `fallback`：二级回退语言（未配置则语言链耗尽后直接返回键）；
 * - `languages`：语言清单（只读透出，核心查表不依赖）；
 * - `messages`：全局字典层（最低优先级）——**以默认语言原文为键**、语言码为子键
 *   （值 = 译文串或复数数组）。注意与 vue-i18n 按 locale 分组的嵌套形态
 *   （`{en:{key:val}}`）不同，本项目是 `{原文:{lang:val}}`。
 */
export interface I18nOptions {
    /** 字典键的书写语言（仅元数据） */
    default?: string;
    /** 当前语言初值（`$.language` 未设置时注入） */
    language?: string;
    /** 二级回退语言 */
    fallback?: string;
    /** 语言清单（只读透出） */
    languages?: I18nLanguageItem[];
    /** 全局字典：原文 → { 语言码: 译文串 | 复数数组 } */
    messages?: Record<string, Record<string, string | string[]>>;
}
