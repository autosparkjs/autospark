import type { AutoSpark } from "autospark";

/**
 * autospark.outlet 组件——路由视图出口（ADR-0002）
 *
 * engine 组件形态的渲染出口，替代退役的 autospark-outlet / autospark-slot 自定义元素：
 * - **缓存视图**：x-for（`:key=hash`）管理的 append-only 列表——同 key 同 index 时 x-for
 *   复用 DOM/scope/订阅，切走仅 x-show 隐藏、切回原样复用（keepalive 语义：表单输入等
 *   运行态不丢）；列表只追加不删除，保证既有项 index 恒定（index 位移会触发子树重建）。
 * - **非缓存视图**（route.keepAlive=false）：单一临时容器，每次重编译，无态可丢。
 * - **视图内容**：x-html.compile 编译激活（ADR-0017）——合并了 autospark/data script 的
 *   远程模板经子模板编译，其中的 x-* 指令全部生效。
 * - **加载态**：内容未就绪时显示内置 autospark-loading 元素。
 *
 * router 渲染层经 `engine.getComponent(宿主).methods` 驱动（mountView / mountEphemeral /
 * activateView）。宿主元素带 data-autospark-outlet 标记（findOutlet 的查找锚点）。
 */
export const OUTLET_COMPONENT_NAME = "autospark.outlet";

/**
 * 组件模板（registerComponent 契约：严格单根 + x-define）。
 * 注意：`<script setup>` 经 new Function 求值，只能写纯 JS（不可 TS 语法）。
 */
export const OUTLET_COMPONENT_CODE = `<div x-define="${OUTLET_COMPONENT_NAME}" class="autospark-outlet" data-autospark-outlet>
    <script setup>
    {
        data: function () {
            return {
                views: [],
                ephemeral: { hash: "", html: "", ready: false },
                active: ""
            };
        },
        methods: {
            /* 仅激活（keepalive 复用命中：不触碰内容，保留运行态） */
            activateView: function (hash) {
                this.data.active = hash;
            },
            /* 挂载/更新缓存视图（ready=false 为加载中占位，内容到达后补全） */
            mountView: function (view) {
                var found = null;
                var views = this.data.views;
                for (var i = 0; i < views.length; i++) {
                    if (views[i].hash === view.hash) {
                        found = views[i];
                        break;
                    }
                }
                if (!found) {
                    views.push({ hash: view.hash, html: view.html || "", ready: !!view.ready });
                } else if (!found.ready) {
                    found.html = view.html || "";
                    found.ready = !!view.ready;
                }
                this.data.active = view.hash;
            },
            /* 挂载非缓存视图（单一临时容器，整体替换重编译） */
            mountEphemeral: function (view) {
                this.data.ephemeral = { hash: view.hash, html: view.html || "", ready: !!view.ready };
                this.data.active = view.hash;
            }
        }
    }
    <\/script>
    <template x-for="view in views" :key="view.hash">
        <div class="autospark-outlet-view" x-show="view.hash === active" :data-view-hash="view.hash">
            <autospark-loading x-show="!view.ready"></autospark-loading>
            <div class="autospark-outlet-view-content" x-html.compile="view.html"></div>
        </div>
    </template>
    <div class="autospark-outlet-ephemeral" x-show="active === ephemeral.hash">
        <autospark-loading x-show="!ephemeral.ready"></autospark-loading>
        <div class="autospark-outlet-view-content" x-html.compile="ephemeral.html"></div>
    </div>
</div>`;

/**
 * 向 engine 注册 outlet 组件（Q10：自动注册 + 探测跳过）。
 * 应用经构造 options.components 预注册同名组件时跳过——允许应用定制 outlet 而无需 fork。
 * 注册晚于组件声明（x-component 静态声明先于本调用编译）时，由 x-component 的
 * 「未注册占位 + components/<名>/registered retain 事件重试」机制兜底激活。
 */
export function registerOutletComponent(engine: AutoSpark): void {
    if (engine.getComponentDeclaration(OUTLET_COMPONENT_NAME)) return;
    engine.registerComponent(OUTLET_COMPONENT_CODE, { name: OUTLET_COMPONENT_NAME });
}
