/**
 * HTML 属性名 kebab-case 归一为 camelCase（DOM 属性名被全量小写化，
 * check-style → checkStyle；组件 props 键为 camelCase）。
 */
export function kebabToCamel(name: string): string {
    return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
