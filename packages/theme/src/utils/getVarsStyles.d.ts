/**
 * 根据变量映射和选择器生成CSS变量样式
 * @example
 *
 * const vars = {
 *   '--x-color-primary': '#000',
 *   '--x-color-secondary': '#333',
 *   '--x-color-tertiary': '#666',
 * }
 *
 * const styles = getVarsStyles(vars, [':host', ':root'], 'data-theme')
 * console.log(styles)
 * 输出：
 * :host([data-theme='primary']),:root([data-theme='primary']) {
 *   --x-color-primary: #000;
 *   --x-color-secondary: #333;
 *   --x-color-tertiary: #666;
 * }
 *
 * @param {Record<string, Record<string, string>>} vars - 包含CSS变量键值对的对象
 * @param {string[]} selectors - 需要应用变量的CSS选择器数组
 * @param {string} attrName - 用于生成属性选择器的属性名
 * @param {boolean} [isRootScope=true] - 是否根作用域：根域裸追加 [attr=key]（其子树即
 * 文档，全域命中无害）；非根作用域收敛为后代式 S [attr=key]，把命中约束在本作用域
 * 子树内，跨作用域不裸命中（与 _dataAlt 的「自身+后代」两式对齐）
 * @returns {string} 生成的CSS变量样式字符串
 */
export declare function getVarsStyles(vars: Record<string, Record<string, string>>, selectors: string[], attrName: string, isRootScope?: boolean): string;
