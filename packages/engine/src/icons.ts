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
  ["warn", ` <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`],
  ["error", `<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>`],
  ["arrow", `<path d="m9 18 6-6-6-6"/>`],
  ["info", `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`],
  ["file", `<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/>`],
  ["bell",`<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>`],
  ["refresh", `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`],
  ["success", `<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>`],
  ["copy", `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`],
  ["edit",`<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/> 
  <path d="M21.5 3.5a2.121 2.121 0 0 0-3 0L8 14l-.5 3 3-.5L21.5 6.5a2.121 2.121 0 0 0 0-3z"/>`],
  ["external", `<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`],
  ["unchecked", `<rect width="18" height="18" x="3" y="3" rx="2"/>`],
  ["checked", `<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m16 9-5.5 5.5L8 12"/>`],
  ["semi-checked", `<rect width="18" height="18" x="3" y="3" rx="2" /><rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" stroke="none" />`],
  ["loading", `<g><animateTransform  attributeName="transform"  attributeType="XML"  type="rotate" from="0 12 12" to="360 12 12" dur="1.5s" repeatCount="indefinite"
        />
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
      </g>`],
  // loading2 底圈走 currentColor + stroke-opacity（ADR-0130 颜色规约：全图唯一色值会被归一化为
  // currentColor——底圈语义本就该跟随主题色，数据侧直接对齐规约）
  ["loading2", `<g>
    <animateTransform attributeName="transform" attributeType="XML" type="rotate"
      from="0 12 12" to="360 12 12" dur="1.2s" repeatCount="indefinite"/>
    <path d="M12 3 A9 9 0 0 1 21 12" fill="none" stroke="currentColor"
          style="stroke-width:4" vector-effect="non-scaling-stroke"/>
  </g>
  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-opacity="0.2"
          style="stroke-width:4" vector-effect="non-scaling-stroke"/>
    `],
  ["unknown", `<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M12 17h.01"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/>`],
  ["folder-open", `<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>`],
  ["folder", `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`],
  ["file-error", `<path d="M11 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m15 17 5 5"/><path d="m20 17-5 5"/>`],
  ["more", `<circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"`],
  ["menu", `<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>`],
  ["star",`<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>`]
] as const;
 