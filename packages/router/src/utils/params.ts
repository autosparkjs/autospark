/**
 * 字符串插值工具（ADR-0136 自本包迁入 engine）：本体住 `autospark`
 * （engine `src/utils/params.ts`，含 `String.prototype.params` 副作用扩展与
 * `$` 前缀命名参数放宽），本文件保留转发——`utils/index.ts` 的转导出面不变。
 */
export { params } from "autospark";
