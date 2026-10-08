/**
 * 内置图标注册数据（ADR-0093 决策 6）——**纯数据面**：只存数据不存机制
 * （注册机制住 `features/icons/registry.ts`），新增内置图标只需在本表添加一行。
 *
 * 内置默认图标（ADR-0046 决策 8 沿用）：`default` 为未命中（未声明或已删除）的
 * 替换渲染——「缺图不破相」；全部内置条目同纪律：可被用户同名覆盖、可 delete。
 */
/** 内置图标 SVG 片段模板：统一 stroke 型开标签（width/height/class 不写，symbol 归一化承载） */
export const SVG_BEGIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"  stroke-linecap="round" stroke-linejoin="round">`;
export const SVG_END = `</svg>`;

/** [图标名, SVG 内容片段] 对表——新增图标在此添加一行即可 */
export const icon_svgdatas = [
    ["default", `<rect x="5" y="5" width="14" height="14" rx="3"/>`],
    ["no", `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`],
    ["yes", `<path d="M20 6 9 17l-5-5"/>`],
    ["warn", `<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>`],
    ["error", `<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>`],
    ["arrow", `<path d="m9 18 6-6-6-6"/>`],
    ["info", `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`],
    ["file", `<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/>`],
    ["refresh", `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`],
    ["success", `<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>`],
    ["copy", `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`],
    ["external", `<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`],
    ["unchecked", `<rect width="18" height="18" x="3" y="3" rx="2"/>`],
    ["checked", `<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m16 9-5.5 5.5L8 12"/>`],
    ["semi-checked", `<rect width="18" height="18" x="3" y="3" rx="2" /><rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" stroke="none" />`],
    ["loading", `<g><animateTransform  attributeName="transform"  attributeType="XML"  type="rotate" from="0 12 12" to="360 12 12" dur="1.5s" repeatCount="indefinite"
        />
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
      </g>`],
    ["unknown", `<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M12 17h.01"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/>`],
    ["folder-open", `<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>`],
    ["folder", `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`],
    ["file-error", `<path d="M11 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m15 17 5 5"/><path d="m20 17-5 5"/>`],
] as const;
