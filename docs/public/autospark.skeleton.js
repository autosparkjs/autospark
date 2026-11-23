(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.skeleton`]=`<div
  class="asc-skeleton"
  x-define="autospark.skeleton"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            variant: "text",
            rows: 0,
            loading: true,
            animated: true,
            rowList: (s) => Array.from({ length: (s.variant === "text" ? Math.max(1, Math.floor(Number(s.rows) || 1)) : 1) }, (_, k) => k + 1),
        }),
    }
  <\/script>
  <style global id="autospark-components-skeleton">
    .asc-skeleton {
      --asc-skel-base: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #606060)) 10%, transparent);
      --asc-skel-hi: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #606060)) 5%, transparent);
      display: flex;
      box-sizing: border-box;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-skeleton-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-skeleton-line-height, 1.5));
    }
    .asc-skeleton-items,
    .asc-skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 0.6em;
      width: 100%;
      min-width: 0;
    }

    .asc-skeleton-item {
      display: block;
      width: 100%;
      height: 1em;
      border-radius: var(--auto-border-radius, var(--asc-skeleton-radius, 0.25rem));
      background: var(--asc-skel-base);
      flex-shrink: 0;
    }
    .asc-skeleton-item[data-last] {
      width: 60%;
    }
    .asc-skeleton-body[data-variant="circle"] .asc-skeleton-item {
      width: 2.5em;
      height: 2.5em;
      border-radius: 50%;
    }
    .asc-skeleton-body[data-variant="rect"] .asc-skeleton-item {
      height: 5em;
      border-radius: var(--auto-border-radius, var(--asc-skeleton-radius, 0.5rem));
    }

    .asc-skeleton-items[data-animated="true"] .asc-skeleton-item {
      background: linear-gradient(
        90deg,
        var(--asc-skel-base) 25%,
        var(--asc-skel-hi) 37%,
        var(--asc-skel-base) 63%
      );
      background-size: 400% 100%;
      animation: asc-skeleton-wave 1.4s ease infinite;
    }
    @keyframes asc-skeleton-wave {
      0% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0 50%;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .asc-skeleton-items[data-animated="true"] .asc-skeleton-item {
        animation: none;
      }
    }

    [dark] .asc-skeleton,
    [data-dark] .asc-skeleton {
      --asc-skel-base: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #fafafa)) 12%, transparent);
      --asc-skel-hi: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #fafafa)) 6%, transparent);
    }
  </style>
  <div class="asc-skeleton-body" :data-variant="variant">
    <span class="asc-skeleton-content" x-show="!loading" x-slot></span>
    <span class="asc-skeleton-items" x-show="loading" aria-hidden="true" :data-animated="animated">
      <span class="asc-skeleton-row" x-for="i of rowList" :key="i">
        <i class="asc-skeleton-item" :data-last="(i === rowList.length)"></i>
      </span>
    </span>
  </div>
</div>
`}n();function n(){e(e=>{t(e)})}};
    if (AutoSpark === undefined) {
        // 插件先于引擎加载（engine ADR-0114）：入预加载队列，engine 构造 drain 时以命名空间回放
        var queue = (globalThis.__AUTOSPARK_PLUGINS__ ??= []);
        if (Object.isFrozen(queue)) {
            console.error("插件闭包: 预加载队列已消费且全局 AutoSpark 不可达，插件未注册");
            return;
        }
        queue.push(function (engine, ns) { run(ns); });
    } else {
        run(AutoSpark);
    }
})(globalThis.AutoSpark);

//# sourceMappingURL=autospark.skeleton.js.map
