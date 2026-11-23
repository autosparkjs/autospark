import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";

/** 尺寸档位清单（无 none 档：尺寸不存在「关闭」态，medium 为默认） */
const SIZES = ["x-small", "small", "medium", "large", "x-large"];

/** 尺寸：复合规模维度——单档同时联动字体/间距/图标/输入高度等九组别名 */
export default {
  title: "尺寸",
  render: () => html`
    <div class="auto-card story-intro">
      <div class="story-intro-title">特性说明：尺寸（Size）</div>
      <p>
        尺寸是<strong>复合</strong>规模维度：单个 <code>data-size</code> 档位同时联动
        字号 / 字重 / 行高 / 字距 / 间距 / 内边距 / 图标 / 输入高度 / 阴影九组
        <code>--auto-*</code> 别名——一档换全局，无需逐项调。
      </p>
      <ul>
        <li>五档可调：<code>x-small / small / medium / large / x-large</code>（<code>medium</code> 为默认态），无 <code>none</code> 档——尺寸不存在「关闭」态</li>
        <li>与单维度旋钮的区别：<code>data-radius / data-spacing / data-shadow</code> 各只管一族梯度，<code>data-size</code> 是「全家桶」——组合 <code>data-size="small" data-radius="large"</code> 可整体缩小同时保留大圆角</li>
        <li>局部换档：任意容器加 <code>data-size="档位"</code> 即可让内部元素局部生效</li>
        <li><strong>独立样式域</strong>：<code>data-size</code> 与模式维度（<code>data-dark</code> / <code>data-light</code>）、色彩维度分属不同域、可同元素叠加——见底部「维度叠加」卡</li>
      </ul>
      <pre>AutoSparkThemeManager.size = 'large'  // 等价 document.documentElement.dataset.size = 'large'</pre>
    </div>
    <div class="auto-card">
      <div class="auto-card-header">五档全览：同一内容随档位整体缩放（none 无此档，五档全矩阵）</div>
      <div class="auto-card-body col" style="gap:1rem;">
        ${repeat(
          SIZES,
          (size) => html`
            <div
              data-size="${size}"
              style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;padding:0.6rem 0.8rem;border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);"
            >
              <code style="width:4.5rem;font-size:0.72rem;color:var(--auto-third-color);">${size}</code>
              <span style="font-size:var(--auto-font-size);font-weight:var(--auto-font-weight);">示例文本 Ag</span>
              <span class="auto-btn small">按钮</span>
              <span
                style="display:inline-flex;align-items:center;justify-content:center;width:var(--auto-icon-size);height:var(--auto-icon-size);background:var(--auto-selected-bgcolor);border-radius:var(--x-border-radius-circle);flex:none;"
              ></span>
              <span
                style="display:inline-flex;align-items:center;padding:var(--auto-padding);background:var(--auto-secondary-bgcolor);border-radius:var(--auto-border-radius);"
                >间距块</span
              >
            </div>
          `,
        )}
        <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
          每行仅 <code>data-size</code> 不同：字号 / 按钮 / 图标圆点（<code>--auto-icon-size</code>）/
          间距块内边距（<code>--auto-padding</code>）随档整体缩放——这是「一档换全局」与单维度旋钮的核心差异。
        </p>
      </div>
    </div>
    <div class="auto-card">
      <div class="auto-card-header">梯度单变量对照：font-size / spacing / icon-size</div>
      <div class="auto-card-body col" style="gap:0.7rem;">
        ${repeat(
          SIZES,
          (size) => html`
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
              <code style="width:4.5rem;font-size:0.72rem;color:var(--auto-third-color);">${size}</code>
              <span style="width:7rem;font-size:var(--x-font-size-${size});line-height:1;">Aa 字</span>
              <span
                style="width:var(--x-spacing-${size});height:0.9rem;background:var(--auto-theme-color);border-radius:var(--x-border-radius-x-small);flex:none;"
              ></span>
              <span
                style="width:calc(1.5 * var(--x-font-size-${size}));height:calc(1.5 * var(--x-font-size-${size}));background:var(--auto-theme-color);border-radius:var(--x-border-radius-circle);flex:none;"
              ></span>
              <code style="font-size:0.68rem;color:var(--auto-third-color);"
                >--x-font-size / --x-spacing / --auto-icon-size</code
              >
            </div>
          `,
        )}
        <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
          拆开看三族基础梯度在同一档位名下的取值：字号（0.75→1.25rem）梯度最陡，
          间距（0.4→1.2rem）次之，图标（字号 ×1.5）随字号联动——
          <code>--auto-icon-size</code> 的放大倍率由按钮等组件消费，此处按 1.5× 直示。
        </p>
      </div>
    </div>
    <div class="auto-card">
      <div class="auto-card-header">局部尺寸作用域：data-size 属性（无需改全局）</div>
      <div class="auto-card-body col">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          <div
            data-size="x-small"
            style="flex:1;min-width:14rem;display:flex;flex-direction:column;gap:0.6rem;padding:0.8rem;border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);"
          >
            <div style="font-size:0.75rem;color:var(--auto-third-color);">data-size="x-small"</div>
            <div class="auto-btn small">按钮</div>
            <div class="auto-input"><input type="text" placeholder="输入框" /></div>
          </div>
          <div
            data-size="x-large"
            style="flex:1;min-width:14rem;display:flex;flex-direction:column;gap:0.6rem;padding:0.8rem;border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);"
          >
            <div style="font-size:0.75rem;color:var(--auto-third-color);">data-size="x-large"</div>
            <div class="auto-btn small">按钮</div>
            <div class="auto-input"><input type="text" placeholder="输入框" /></div>
          </div>
        </div>
        <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
          同屏两栏对照：按钮 / 输入框（<code>--auto-input-height</code> /
          <code>--auto-input-padding</code>）在容器档位内独立缩放，不影响全局。
        </p>
      </div>
    </div>
    <div class="auto-card">
      <div class="auto-card-header">维度叠加：data-dark（模式域）× data-size（尺寸域）</div>
      <div class="auto-card-body col">
        <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
          <code>data-dark</code> 与 <code>data-size</code> 分属不同独立样式域：前者切模式维度（配色换暗），
          后者切规模维度（尺寸换档）。同元素叠加时两域同时生效、互不覆盖——
          中右两卡同为暗色，右卡尺寸独立放大到 <code>x-large</code>。
        </p>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          ${[
            { label: "无属性（跟随全局：亮色 · 全局尺寸档）", dark: false, size: undefined as string | undefined },
            { label: "data-dark（仅模式域：暗色，尺寸仍随全局）", dark: true, size: undefined as string | undefined },
            { label: 'data-dark + data-size="x-large"（两域叠加：暗色 + 最大尺寸）', dark: true, size: "x-large" },
          ].map(
            (c) => html`
              <div
                ?data-dark="${c.dark}"
                data-size="${c.size}"
                style="flex:1;min-width:13rem;display:flex;flex-direction:column;gap:0.6rem;padding:0.9rem;border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);color:var(--auto-color);"
              >
                <div style="font-size:0.72rem;color:var(--auto-third-color);">${c.label}</div>
                <div class="auto-btn small">按钮</div>
                <div class="auto-input"><input type="text" placeholder="输入框" /></div>
                <div
                  style="padding:var(--auto-padding);background:var(--auto-secondary-bgcolor);border-radius:var(--auto-border-radius);"
                >
                  间距块（--auto-padding）
                </div>
              </div>
            `,
          )}
        </div>
      </div>
    </div>
  `,
} satisfies StoryModule;
