(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.empty`]=`<div
  class="asc-empty"
  x-define="autospark.empty"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            description: "",
            icon: "file",
        }),
    }
  <\/script>
  <style global id="autospark-components-empty">
    .asc-empty {
      display: flex;
      justify-content: center;
      padding: var(--auto-padding, var(--asc-empty-padding, 0.8rem));
      font-size: var(--auto-font-size, var(--asc-empty-font-size, 0.875rem));
    }
    .asc-empty-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 100%;
    }
    .asc-empty-image {
      color: var(--auto-third-color, var(--asc-empty-image-color, rgba(0, 0, 0, 0.35)));
      font-size: 2.6em;
      line-height: 1;
    }
    .asc-empty-desc {
      margin-top: 0.6em;
      color: var(--auto-secondary-color, var(--asc-empty-desc-color, rgba(0, 0, 0, 0.55)));
      font-size: 0.875em;
      line-height: 1.5;
    }
    .asc-empty-extra {
      margin-top: 1em;
    }
    .asc-empty-extra:empty {
      display: none;
    }

    [dark] .asc-empty-image,
    [data-dark] .asc-empty-image {
      color: var(--auto-third-color, var(--asc-empty-image-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-empty-desc,
    [data-dark] .asc-empty-desc {
      color: var(--auto-secondary-color, var(--asc-empty-desc-color, rgba(255, 255, 255, 0.65)));
    }
  </style>
  <div class="asc-empty-body">
    <div class="asc-empty-image" x-slot:image>
      <i
        class="asc-empty-icon"
        x-if="typeof icon === 'string' && icon"
        x-icon="icon"
      ></i>
      <i
        class="asc-empty-icon"
        x-if="typeof icon === 'object' && icon && icon.name"
        x-icon="icon.name"
      ></i>
    </div>
    <div class="asc-empty-desc">{{ description || (t('empty.description') === 'empty.description' ? '暂无数据' : t('empty.description')) }}</div>
    <div class="asc-empty-extra" x-slot></div>
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

//# sourceMappingURL=autospark.empty.js.map
