/**
 * 局部主题：转译自 src/stories/colors/theme.scope.story.ts 并扩展为多作用域演示。
 * 三个示例卡片各自挂独立 ThemeScope，可分别切换主题色 / 暗色 / 多彩，互不干扰、不影响全局。
 */
declare const _default: {
    title: string;
    render: () => import("lit").TemplateResult<1>;
    mounted(host: HTMLElement): () => void;
};
export default _default;
