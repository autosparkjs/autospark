import type { AutoSparkThemeScope } from './scope';
/**
 *
 * 监听DOM元素的指定属性变化，并在属性变化时重新生成主题
 *
 * const observer = new ThemeObserver(scope, el)
 *
 */
export declare class ThemeObserver {
    scope: AutoSparkThemeScope;
    el: HTMLElement;
    observer: MutationObserver | null;
    connected: boolean;
    constructor(scope: AutoSparkThemeScope, el: HTMLElement);
    private _onThemeAttrChange;
    connect(): void;
    disconnect(): void;
}
