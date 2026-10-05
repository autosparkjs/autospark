// 静态样式层：styles/index.less 聚合 reset/animates/utils/colors/components(样式层)/icons，
// 但 styles/input.less 与组件层（src/components：card/button/alert/closeable/input）未被聚合入口包含，单独补引
import "../src/styles/index.less";
import "../src/styles/input.less";
import "../src/components/index.less";

import { render } from "lit";
// 主题控制面板（内含 themeManager 单例初始化）延迟到动态 import：
// 确保上方 less 的样式注入先完成，运行时注入的 kylinbits-* 变量样式位于静态默认值之后（层叠必胜）
await import("./theme-controls");
import type { StoryModule } from "./stories/story";

/** 导航分组：目录名 → 分组标题（对应原 storybook Meta.title） */
const GROUP_TITLES: Record<string, string> = {
    base: "基础主题变量",
    colors: "主题颜色",
    components: "组件",
};

const DEFAULT_STORY = "colors/theme-palette";

/** 收集全部故事：一个故事一个 ts，路径约定 ./stories/<分组>/<名>.ts（eager 加载以取故事中文标题） */
const modules = import.meta.glob("./stories/*/*.ts", { eager: true }) as Record<
    string,
    { default: StoryModule }
>;

interface StoryEntry {
    group: string;
    file: string;
    key: string;
    story: StoryModule;
}

const stories: StoryEntry[] = Object.entries(modules)
    .map(([path, mod]) => {
        const m = path.match(/\.\/stories\/([^/]+)\/([^/]+)\.ts$/);
        if (!m) return null;
        return { group: m[1], file: m[2], key: `${m[1]}/${m[2]}`, story: mod.default };
    })
    .filter(Boolean) as StoryEntry[];

let cleanup: (() => void) | void;

/** 展示指定故事：渲染 → 挂载钩子（记录清理函数） */
function show(key: string) {
    const entry = stories.find((s) => s.key === key) ?? stories.find((s) => s.key === DEFAULT_STORY);
    if (!entry) return;

    cleanup?.(); // 清理上一个故事（如移除局部主题作用域）
    const title = document.getElementById("story-title")!;
    const host = document.getElementById("story-host")!;
    title.textContent = entry.story.title;
    host.replaceChildren();
    // lit render 容器每次使用全新元素：复用被清空的原容器会抹掉 lit 的 marker 节点导致
    // "ChildPart has no parentNode" 异常，因此不复用、而是新建挂载节点承载本次渲染
    const mount = document.createElement("div");
    mount.style.cssText = "display:flex;flex-direction:column;gap:1rem;";
    host.appendChild(mount);
    render(entry.story.render(), mount);
    cleanup = entry.story.mounted?.(mount);

    document.querySelectorAll<HTMLAnchorElement>("#nav a").forEach((a) => {
        a.classList.toggle("active", a.dataset.story === entry.key);
    });
}

/** 构建左侧导航树（分组 → 故事链接） */
function buildNav() {
    const nav = document.getElementById("nav")!;
    for (const group of [...new Set(stories.map((s) => s.group))]) {
        const section = document.createElement("div");
        section.className = "nav-group";

        const title = document.createElement("div");
        title.className = "nav-title";
        title.textContent = GROUP_TITLES[group] ?? group;
        section.appendChild(title);

        for (const { key, story } of stories.filter((s) => s.group === group)) {
            const a = document.createElement("a");
            a.href = `#${key}`;
            a.dataset.story = key;
            a.textContent = story.title;
            section.appendChild(a);
        }
        nav.appendChild(section);
    }
}

/** hash 路由：#<分组>/<故事>，刷新与前进后退保持选中 */
function route() {
    const key = location.hash.slice(1);
    show(stories.some((s) => s.key === key) ? key : DEFAULT_STORY);
}

buildNav();
window.addEventListener("hashchange", route);
route();
