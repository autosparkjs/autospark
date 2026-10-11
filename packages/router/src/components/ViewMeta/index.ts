/**
 * kylin-view-meta 组件（原生 Web Components 版本）
 *
 * 用于存储视图级别的元数据，支持任意自定义属性。
 * 这些元数据可以被父组件或其他系统读取，用于配置页面行为、SEO、权限控制等。
 *
 * @example
 * ```html
 * <kylin-view-meta
 *   title="页面标题"
 *   description="页面描述"
 *   keep-alive="true"
 *   roles="admin,user"
 *   custom-data='{"key": "value"}'
 * ></kylin-view-meta>
 * ```
 *
 * @example 在组件中读取元数据
 * ```ts
 * const meta = document.querySelector('kylin-view-meta');
 * const title = meta?.get('title');
 * const roles = meta?.get('roles')?.split(',');
 * ```
 */
export class KylinViewMeta extends HTMLElement {
    /**
     * 组件不占据任何空间，不参与排版
     */
    constructor() {
        super();
        // 设置样式使元素不可见
        this.style.display = "none";
    }

    /**
     * 获取指定名称的元数据值
     *
     * @param name - 属性名称
     * @returns 属性值，如果不存在则返回 null
     *
     * @example
     * ```ts
     * const meta = document.querySelector('kylin-view-meta');
     * const title = meta?.get('title'); // "页面标题"
     * ```
     */
    get(name: string): string | null {
        return this.getAttribute(name);
    }

    /**
     * 设置元数据值
     *
     * @param name - 属性名称
     * @param value - 属性值（设为 null 则删除该属性）
     *
     * @example
     * ```ts
     * meta.set('title', '新标题');
     * meta.set('description', null); // 删除
     * ```
     */
    set(name: string, value: string | null): void {
        if (value === null) {
            this.removeAttribute(name);
        } else {
            this.setAttribute(name, value);
        }
    }

    /**
     * 获取所有元数据（键值对对象）
     *
     * @returns 包含所有属性的对象
     *
     * @example
     * ```ts
     * const meta = document.querySelector('kylin-view-meta');
     * const all = meta?.getAll();
     * // { title: "页面标题", description: "页面描述", ... }
     * ```
     */
    getAll(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const attr of this.attributes) {
            result[attr.name] = attr.value;
        }
        return result;
    }

    /**
     * 检查是否包含指定的元数据
     *
     * @param name - 属性名称
     * @returns 是否存在该属性
     */
    has(name: string): boolean {
        return this.hasAttribute(name);
    }

    /**
     * 解析 JSON 格式的元数据
     *
     * @param name - 属性名称
     * @param defaultValue - 解析失败时的默认值
     * @returns 解析后的对象，失败返回默认值
     *
     * @example
     * ```html
     * <kylin-view-meta data='{"key": "value"}'></kylin-view-meta>
     * ```
     * ```ts
     * const data = meta?.getJSON('data', {});
     * ```
     */
    getJSON<T = unknown>(name: string, defaultValue: T): T {
        const value = this.get(name);
        if (!value) return defaultValue;
        try {
            return JSON.parse(value) as T;
        } catch {
            return defaultValue;
        }
    }

    /**
     * 获取布尔类型的元数据
     *
     * @param name - 属性名称
     * @returns 是否为 true（属性存在且值为 "true" 或空字符串）
     *
     * @example
     * ```html
     * <kylin-view-meta keep-alive></kylin-view-meta>
     * ```
     * ```ts
     * const keepAlive = meta?.getBoolean('keep-alive'); // true
     * ```
     */
    getBoolean(name: string): boolean {
        const value = this.get(name);
        return value === "true" || value === "";
    }

    /**
     * 获取数组类型的元数据（逗号分隔）
     *
     * @param name - 属性名称
     * @param separator - 分隔符，默认为逗号
     * @returns 解析后的数组
     *
     * @example
     * ```html
     * <kylin-view-meta roles="admin,user,guest"></kylin-view-meta>
     * ```
     * ```ts
     * const roles = meta?.getArray('roles'); // ["admin", "user", "guest"]
     * ```
     */
    getArray(name: string, separator: string = ","): string[] {
        const value = this.get(name);
        if (!value) return [];
        return value
            .split(separator)
            .map((s) => s.trim())
            .filter(Boolean);
    }

    /**
     * 转换为字符串表示（用于调试）
     */
    toString(): string {
        const data = this.getAll();
        return JSON.stringify(data, null, 2);
    }
}

// 注册自定义元素
if (!customElements.get("kylin-view-meta")) {
    customElements.define("kylin-view-meta", KylinViewMeta);
}

declare global {
    interface HTMLElementTagNameMap {
        "kylin-view-meta": KylinViewMeta;
    }
}
