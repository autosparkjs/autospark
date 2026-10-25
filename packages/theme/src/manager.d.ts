import { AutoSparkThemeScope } from './scope';
import type { DynamicThemeOptions, ThemeOptions, ThemeSize } from './types';
import { ThemeObserver } from './observer';
export type AutoSparkThemeManagerOptions = {
    storageKey?: string;
};
export declare class AutoSparkThemeManager {
    vars: Record<string, string>;
    scopes?: Record<string, AutoSparkThemeScope>;
    root: AutoSparkThemeScope;
    options: Required<AutoSparkThemeManagerOptions>;
    observer: ThemeObserver;
    /** 上次写入的样式快照内容：合成结果未变时跳过写 IO */
    private _lastStylesSnapshot;
    constructor(options?: AutoSparkThemeManagerOptions);
    get id(): string;
    get size(): ThemeSize;
    set size(value: ThemeSize);
    get dark(): boolean;
    set dark(value: boolean);
    get spacing(): ThemeSize;
    set spacing(value: ThemeSize);
    get shadow(): ThemeSize;
    set shadow(value: ThemeSize);
    get colorized(): boolean;
    set colorized(value: boolean);
    get radius(): ThemeSize;
    set radius(value: ThemeSize);
    get themeColor(): string;
    set themeColor(value: string);
    get presets(): Record<string, import("./presets").PresetTheme>;
    /**
     * 更新主题
     */
    update(options: Partial<DynamicThemeOptions>): void;
    download(): void;
    /**
     * 合成样式快照并写入 localStorage（ADR-0003）：root 与全部未退出持久化的
     * scope 的 CSS 按注册序 concat（数据源为各 scope 的注入缓存，不查 DOM）；
     * 合成结果未变则跳过写 IO。运行时每次注入变化都会重写全量快照——这就是
     * 自愈：库升级改变输出后，下一次启动即覆盖旧快照。
     */
    persistStyles(scope: AutoSparkThemeScope): void;
    /**
     * 清空样式快照（ADR-0004）：root scope 静态主题包指纹命中时回调。
     * 同时复位去重基线，使随后运行时换色产生的动态块仍能正常重写快照（自愈）。
     */
    clearStylesSnapshot(scope: AutoSparkThemeScope): void;
    private _createRootScope;
    hasScope(id: string): boolean;
    /**
     * 创建主题作用域
     * addScope("#sidebar",{
     *     id:'sidebar',
     * })
     * @param elementSelector
     * @param options
     * @returns
     */
    addScope(options: ThemeOptions): AutoSparkThemeScope | undefined;
    removeScope(id: string): void;
}
