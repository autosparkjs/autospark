import { LitElement } from "lit";
export declare class ThemeControls extends LitElement {
    static properties: {
        dark: {
            type: BooleanConstructor;
        };
        colorized: {
            type: BooleanConstructor;
        };
        currentColor: {
            type: StringConstructor;
        };
    };
    private sizeValues;
    constructor();
    static styles: import("lit").CSSResult;
    /** 待应用的主题色（rAF 合帧的挂起值） */
    private _pendingColor;
    private _colorRaf;
    /** 切换主题色：预设名或任意色值；@input 逐像素触发，rAF 合帧为每帧至多一次主题应用 */
    private _setThemeColor;
    private _setSize;
    protected render(): import("lit").TemplateResult<1>;
}
