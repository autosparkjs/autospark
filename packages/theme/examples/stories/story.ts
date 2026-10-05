import type { TemplateResult } from "lit";

/**
 * 故事模块统一约定：每个故事一个 ts 文件，default 导出本接口。
 *
 * 由汇总页（examples/main.ts）经 import.meta.glob 收集：
 * - title     导航树与标题显示名
 * - render    渲染故事内容（纯展示，不含主题控制——控制统一由右侧 <theme-controls> 承担）
 * - mounted   挂载后初始化（局部主题等需要行为的场景），返回清理函数供切换故事时调用
 */
export interface StoryModule {
    title: string;
    render(): TemplateResult;
    mounted?(host: HTMLElement): (() => void) | void;
}
