import type { AutoSpark } from "autospark";
import { injectStylesheet } from "@/utils/injectStylesheet";

/**
 * autospark.outlet 组件——路由视图出口（ADR-0002 / ADR-0003）
 *
 * engine 组件形态的渲染出口，替代退役的 autospark-outlet / autospark-slot 自定义元素：
 * - **视图清单**：数据域唯一状态——append-only 的 `{hash, url, title, html, ready}` 条目 +
 *   `active` hash + 临时视图槽。它是访问记录而非缓存簿记：缓存纯由 DOM 常驻 +
 *   x-show（display:none）承担，切回原样复用（运行态保留）。
 * - **临时视图**：非缓存视图（keepAlive 解析为 false）走单一临时容器，每次重编译。
 *   容器仅在确有临时视图时显示（ephemeral.hash 非空）——空转出口（所在路由层没有更深的
 *   子路由渲染进来，数据域从未被写入）不显示 loading。
 * - **props**：`keepAlive`（本出口未显式声明路由的缓存默认值，默认 false）与
 *   `mode`（'stack' | 'tabs'，默认 stack）——经 x-component 值 / x-outlet 简写值透传注入。
 * - **tabs 模式**：内建页签条（标题取路由 title 回退 hash），点击页签走 router 导航
 *   （URL 唯一真相源）；页签可关闭（关闭即销毁视图缓存；关闭 active 导航到相邻页签；
 *   唯一页签不显示关闭按钮）。tabs 模式下全视图常驻，临时通道不启用。
 * - **视图内容**：x-html.compile 编译激活（ADR-0017）——合并了 autospark/data script 的
 *   远程模板经子模板编译，其中的 x-* 指令全部生效；raw 视图（条目 raw 标志为 true，
 *   ADR-0008）改用普通 x-html 直接 innerHTML 挂载——不经编译（性能旁路），
 *   其内容中的 x-* 指令不激活、script 不执行、x-outlet 不生效。
 * - **加载态**：内容未就绪时显示内置 autospark-loading 元素。
 *
 * router 渲染层经 `engine.data(outletEl, …)` 直写数据域驱动（ADR-0003 决策 6，
 * methods 驱动面已废弃）。宿主元素带 data-autospark-outlet 标记（findOutlet 的查找锚点）。
 *
 * 样式：注册时经 injectStylesheet 全局注入（id `autospark-outlet-styles`），以
 * `--autospark-outlet-tab-*` CSS 自定义属性与 `.autospark-outlet-tab` 等类钩子提供重载；
 * 不引入 Shadow DOM 边界。
 */
export const OUTLET_COMPONENT_NAME = "autospark.outlet";

/** 内建样式表元素 id（应用可用同 id 提前注入以整体替换） */
export const OUTLET_STYLES_ID = "autospark-outlet-styles";

/**
 * 内建 tab 条样式（ADR-0003 决策 5：组件内建 + CSS 自定义属性/类钩子重载）
 */
export const OUTLET_COMPONENT_STYLES = `.autospark-outlet-tabs{display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--autospark-outlet-tab-gap,2px);padding:var(--autospark-outlet-tabs-padding,0 8px);border-bottom:1px solid var(--autospark-outlet-tab-border-color,#e5e6eb);background:var(--autospark-outlet-tabs-bg,transparent)}
.autospark-outlet-tab{display:inline-flex;align-items:center;gap:6px;padding:var(--autospark-outlet-tab-padding,6px 12px);font-size:var(--autospark-outlet-tab-font-size,13px);line-height:1.4;color:var(--autospark-outlet-tab-color,#4e5969);background:var(--autospark-outlet-tab-bg,transparent);border:1px solid transparent;border-bottom:none;border-radius:var(--autospark-outlet-tab-radius,6px 6px 0 0);cursor:pointer;user-select:none;position:relative;top:1px}
.autospark-outlet-tab:hover{color:var(--autospark-outlet-tab-hover-color,#1d2129);background:var(--autospark-outlet-tab-hover-bg,rgba(0,0,0,.04))}
.autospark-outlet-tab.is-active{color:var(--autospark-outlet-tab-active-color,#165dff);background:var(--autospark-outlet-tab-active-bg,#fff);border-color:var(--autospark-outlet-tab-border-color,#e5e6eb)}
.autospark-outlet-tab-close{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;font-size:12px;line-height:1;color:var(--autospark-outlet-tab-close-color,#86909c);cursor:pointer}
.autospark-outlet-tab-close:hover{color:var(--autospark-outlet-tab-close-hover-color,#1d2129);background:var(--autospark-outlet-tab-close-hover-bg,rgba(0,0,0,.08))}`;

/**
 * 组件模板（registerComponent 契约：严格单根 + x-define）。
 * 注意：`<script setup>` 经 new Function 求值，只能写纯 JS（不可 TS 语法）。
 *
 * 数据域默认值即 props 缺省值：x-component 值（props）注入覆盖同名键（ADR-0054 单向注入）。
 */
export const OUTLET_COMPONENT_CODE = `<div x-define="${OUTLET_COMPONENT_NAME}" class="autospark-outlet" data-autospark-outlet :data-mode="mode">
    <script setup>
    {
        data: function () {
            return {
                views: [],
                ephemeral: { hash: "", html: "", ready: false, raw: false },
                active: "",
                mode: "stack",
                keepAlive: false
            };
        },
        methods: {
            /* 组件内查找 router 实例（DOM 向上遍历协议：data-autospark-router 宿主挂 .router） */
            _findRouter: function () {
                var el = this.scope.el;
                while (el) {
                    if (el.hasAttribute && el.hasAttribute("data-autospark-router")) {
                        return el.router || null;
                    }
                    el = el.parentElement;
                }
                return null;
            },
            /* 页签点击：走 router 导航（URL 唯一真相源，ADR-0003 决策 3） */
            tabGo: function (tab) {
                if (!tab || !tab.url || tab.hash === this.data.active) return;
                var router = this._findRouter();
                if (router) router.push(tab.url);
            },
            /* 页签关闭：关闭即销毁（x-for 移除对应视图 DOM）；关闭 active 导航到相邻页签（决策 4） */
            tabClose: function (tab, event) {
                if (event && event.stopPropagation) event.stopPropagation();
                var views = this.data.views;
                if (!views || views.length <= 1) return;
                var idx = -1;
                for (var i = 0; i < views.length; i++) {
                    if (views[i].hash === tab.hash) { idx = i; break; }
                }
                if (idx < 0) return;
                views.splice(idx, 1);
                if (this.data.active === tab.hash) {
                    var next = views[idx] || views[idx - 1];
                    if (next) {
                        var router = this._findRouter();
                        if (router) router.push(next.url);
                    }
                }
            }
        }
    }
    <\/script>
    <div class="autospark-outlet-tabs" x-show="mode === 'tabs'" role="tablist" x-for="tab of views" :key="tab.hash">
        <div class="autospark-outlet-tab" role="tab"
            :class="{ 'is-active': tab.hash === active }"
            :aria-selected="tab.hash === active"
            @click="tabGo(tab)">
            <span class="autospark-outlet-tab-title" x-text="tab.title"></span>
            <span class="autospark-outlet-tab-close" x-show="views.length > 1" aria-label="关闭页签" @click="tabClose(tab, $event)">×</span>
        </div>
    </div>
    <div class="autospark-outlet-views" x-for="view of views" :key="view.hash">
        <div class="autospark-outlet-view" x-show="view.hash === active" :data-view-hash="view.hash">
            <autospark-loading x-show="!view.ready"></autospark-loading>
            <!-- raw 视图走普通 x-html 直挂（不编译，ADR-0008）；两者 x-show 互斥 -->
            <div class="autospark-outlet-view-content" x-show="!view.raw" x-html.compile="view.html"></div>
            <div class="autospark-outlet-view-content" x-show="!!view.raw" x-html="view.html"></div>
        </div>
    </div>
    <div class="autospark-outlet-ephemeral" x-show="ephemeral.hash !== '' && active === ephemeral.hash" :data-view-hash="ephemeral.hash">
        <autospark-loading x-show="!ephemeral.ready"></autospark-loading>
        <div class="autospark-outlet-view-content" x-show="!ephemeral.raw" x-html.compile="ephemeral.html"></div>
        <div class="autospark-outlet-view-content" x-show="!!ephemeral.raw" x-html="ephemeral.html"></div>
    </div>
</div>`;

/**
 * 向 engine 注册 outlet 组件（Q10：自动注册 + 探测跳过）。应用经构造 options.components
 * 预注册同名组件时跳过——允许应用定制 outlet 而无需 fork。注册前注入内建 tab 条样式
 * （幂等：同 id 已存在则跳过——应用可提前注入同 id 样式表整体替换内建样式）。
 *
 * 时序说明：注入模式下应用 engine 已编译、本注册晚于 `x-component:autospark.outlet` 声明——
 * 由 x-component 的「未注册 loading 占位 + components/<候选名>/registered retain 重试」机制
 * 兜底激活（ADR-0088 点号候选全集订阅）；自建模式经构造 options.components 先于编译注册，
 * 无时序问题（见 engineHost.ts）。
 */
export function registerOutletComponent(engine: AutoSpark): void {
    injectStylesheet(OUTLET_COMPONENT_STYLES, { id: OUTLET_STYLES_ID });
    if (engine.getComponentDeclaration(OUTLET_COMPONENT_NAME)) return;
    engine.registerComponent(OUTLET_COMPONENT_CODE, { name: OUTLET_COMPONENT_NAME });
}
