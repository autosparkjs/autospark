import { ThemeScope } from './scope'
import type { DynamicThemeOptions, ThemeOptions, ThemeSize } from './types'
import { ThemeObserver } from './observer'
import { presetThemes } from './presets'
import {
    DEFAULT_STORAGE_KEY,
    removeScopeParams,
    writeStylesSnapshot,
} from './persistence'

export type ThemeManagerOptions = {
    storageKey?: string
}
export class ThemeManager {
    vars: Record<string, string> = {}
    scopes?: Record<string, ThemeScope>
    root: ThemeScope
    options: Required<ThemeManagerOptions>
    observer!: ThemeObserver
    /** 上次写入的样式快照内容：合成结果未变时跳过写 IO */
    private _lastStylesSnapshot: string | null = null
    constructor(options?: ThemeManagerOptions) {
        this.options = Object.assign(
            { storageKey: DEFAULT_STORAGE_KEY },
            options,
        ) as Required<ThemeManagerOptions>
        this.root = this._createRootScope()
        this.observer = new ThemeObserver(this.root, document.documentElement)
    }
    get id() {
        return this.root.id
    }
    get size() {
        return this.root.size
    }
    set size(value: ThemeSize) {
        this.root.size = value
    }
    get dark() {
        return this.root.dark
    }
    set dark(value: boolean) {
        this.root.dark = value
    }
    get spacing(): ThemeSize {
        return this.root.spacing
    }
    set spacing(value: ThemeSize) {
        this.root.spacing = value
    }
    get shadow() {
        return this.root.shadow
    }
    set shadow(value: ThemeSize) {
        this.root.shadow = value
    }
    get colorized() {
        return this.root.colorized
    }
    set colorized(value: boolean) {
        this.root.colorized = value
    }
    get radius(): ThemeSize {
        return this.root.radius
    }
    set radius(value: ThemeSize) {
        this.root.radius = value
    }
    get themeColor(): string {
        return this.root.themeColor
    }
    set themeColor(value: string) {
        this.root.themeColor = value
    }
    get presets() {
        return presetThemes
    }
    /**
     * 更新主题
     */
    update(options: Partial<DynamicThemeOptions>) {
        this.root.update(options)
    }
    /**
     * 合成样式快照并写入 localStorage（ADR-0003）：root 与全部未退出持久化的
     * scope 的 CSS 按注册序 concat（数据源为各 scope 的注入缓存，不查 DOM）；
     * 合成结果未变则跳过写 IO。运行时每次注入变化都会重写全量快照——这就是
     * 自愈：库升级改变输出后，下一次启动即覆盖旧快照。
     */
    persistStyles(scope: ThemeScope) {
        if (!scope.persistence) return
        // root 在构造期（this.root 赋值前）经由自身注入回调进入，此时以入参 scope 代位；
        // 不以 connected 为判据：disconnect 已清空注入缓存，cssChunks 为空自然不贡献
        const sources = [this.root ?? scope, ...Object.values(this.scopes ?? {})]
        const css = sources
            .filter((s) => s.persistence)
            .flatMap((s) => s.cssChunks)
            .join('\n')
        if (!css || css === this._lastStylesSnapshot) return
        this._lastStylesSnapshot = css
        writeStylesSnapshot(this.options.storageKey, css)
    }
    private _createRootScope() {
        const scope = new ThemeScope({
            id: 'root',
            cssSelector: [':host', ':root'],
            autoAttach: false,
            // 先 attach 再 connect：水合参数同步 DOM 属性时元素已就绪（ADR-0003）
            autoConnect: false,
            storageKey: this.options.storageKey,
        })
        scope.coordinator = this
        scope.attach(document.documentElement)
        scope.connect()
        return scope
    }
    hasScope(id: string) {
        return id in (this.scopes || {})
    }
    /**
     * 创建主题作用域
     * addScope("#sidebar",{
     *     id:'sidebar',
     * })
     * @param elementSelector
     * @param options
     * @returns
     */
    addScope(options: ThemeOptions) {
        const { id } = options
        if (this.hasScope(id)) return
        if (!this.scopes) this.scopes = {}
        const scope = new ThemeScope({ storageKey: this.options.storageKey, ...options })
        scope.coordinator = this
        this.scopes[id] = scope
        // autoConnect 在构造函数内先于 coordinator 注入执行，其注入结果未进快照，此处补写
        if (scope.connected) this.persistStyles(scope)
        return scope
    }
    removeScope(id: string) {
        const scope = this.scopes?.[id]
        if (scope) {
            scope.disconnect()
            delete this.scopes?.[id]
            // 参数 key 与样式快照同步清理：摘除该 scope 的 CSS 片段（disconnect 已清其缓存）
            removeScopeParams(this.options.storageKey, id)
            this.persistStyles(scope)
        }
    }
}

// 创建默认的主题应用
export const themeManager = new ThemeManager()

globalThis.ThemePro = themeManager

declare global {
    var ThemePro: typeof themeManager
}
