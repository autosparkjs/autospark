export declare const shadowVars: {
    none: {
        '--auto-shadow': string;
    };
    'x-small': {
        '--auto-shadow': string;
    };
    small: {
        '--auto-shadow': string;
    };
    medium: {
        '--auto-shadow': string;
    };
    large: {
        '--auto-shadow': string;
    };
    'x-large': {
        '--auto-shadow': string;
    };
};
/**
 * 暗色专属阴影五档：深底上中灰阴影（baseVars 配方）不可见，换黑色系高不透明度。
 * 覆盖 --x-shadow-* 基变量，并自举派生键 --auto-shadow——非根 data-dark 元素不重新
 * 声明它就继承根域已替换的亮阴影值。data-shadow / data-size 档位块生成在本块之后
 * （同特异性后者胜出、data-shadow 带 !important），档位切换正常覆盖本键。
 */
export declare const darkShadowVars: {
    '--x-shadow-x-small': string;
    '--x-shadow-small': string;
    '--x-shadow-medium': string;
    '--x-shadow-large': string;
    '--x-shadow-x-large': string;
    '--auto-shadow': string;
};
