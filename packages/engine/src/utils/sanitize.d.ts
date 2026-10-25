/**
 * 极简 HTML 消毒器（x-html 默认 sanitizer，见 ADR-0005 决策 4）。
 *
 * **定位：safe-by-default 的兜底**——覆盖主流 XSS 向量，非无懈可击。
 * 高安全场景（金融/UGC 富文本）应经 `engine.options.sanitizer` 注入 DOMPurify。
 *
 * 实现：`<template>.innerHTML` 惰性解析（不执行脚本/不加载资源）→ DOM 遍历归一为
 * 真实节点后剥除危险节点/属性 → 序列化回 HTML 字符串。DOM 遍历比 regex 字符串清洗
 * 更抗 mutation XSS（标签拆分/实体编码/命名空间切换在解析后均已归一）。
 *
 * 剥除范围：
 * - 脚本元素（`localName === "script"`，覆盖 HTML 与 SVG 命名空间）；
 * - 事件属性（所有 `on*`）；
 * - 危险协议 URL 属性（`href`/`src`/`formaction`/… 中 `javascript:`/`vbscript:`/`data:text/html` 等）。
 *
 * **不在覆盖范围**（已知边角，注入 DOMPurify 解决）：mutation XSS、foreign content
 * （svg/math 命名空间混淆）、`<iframe srcdoc>`、CSS `expression()` 等。
 */
/**
 * 消毒 HTML 字符串：惰性解析 → 剥除脚本/事件属性/危险协议 URL → 序列化返回。
 *
 * @param html 原始 HTML 字符串（null/undefined 返回空串）
 * @returns 已剥除主流 XSS 向量的安全 HTML 字符串
 */
export declare function sanitizeHtml(html: string): string;
