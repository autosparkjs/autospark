# 运行时创建组件

`engine.registerComponent(code, opts?)` 在**运行期**把一段组件模板字符串登记为组件——代码里按数据、按分支、按接口返回结果决定「注册什么、什么时候注册」时的正规入口。

组件有三条声明通道，各管一段时序：

| 通道 | 时机 | 模板来源 | 何时用 |
| --- | --- | --- | --- |
| 模板内 `x-define` | 编译期 | 写在模板里 | 组件固定不变、随页面一起发布 |
| `options.components` | 构造期 | 构造参数（字符串） | 组件集合已知，只是模板不在页面里 |
| **`registerComponent`** | **运行期** | **代码里的字符串** | **按数据/分支/接口结果动态决定** |
| [`x-import`](./remote.md) | 运行期（异步） | 远程 url | 模板在服务器上，不进前端产物 |

<demo html="component/runtime-create.html"/>

## 基本用法

```javascript
// 全局注册：此后任意 x-component:panel 都能取到
engine.registerComponent(`
    <div x-define="panel">
        <div class="panel"><slot /></div>
        <style>.panel { border: 1px solid }</style>
    </div>
`);
```

模板串要求与 `x-define` 一致：**恰好一个带 `x-define` 的顶级根元素**。返回已登记的组件定义 `ComponentDef`，校验或解析失败返回 `null`（失败原因已 `warn` 到控制台）。

```javascript
const def = engine.registerComponent(code);
if (def) {
    // 已就绪——后续 x-component:xxx 可实例化
}
```

::: tip 为什么不用 `options.components`
`options.components` 是**构造期配置**：它惰性预编译并缓存，运行时再改它不会失效已缓存的组件（与 `actions`、`sanitizer` 等 options 同纪律）。要动态增补，走 `registerComponent` 或 `x-import`。
:::

## 归属：`scope` / `el` / 全局

`opts.scope` 与 `opts.el` 同义，都是「**声明处**」——`x-define` 挂到最近的祖先 scope，运行时注册由调用方显式指明。三态：

| `opts` | 注册目标 |
| --- | --- |
| 都不传 | 全局组件定义表，全域 `x-component` 可查 |
| `{ scope }` | 挂该 scope 的 `components`，仅其 scope 链内可见（同时是 `dataContext` 的声明处基准，见[组件数据边界](./data.md)） |
| `{ el }` | 自该元素（含自身）向上取**最近的 scope 根**，与 `x-define` 的「最近祖先 scope」归属同构；查不到则 `warn` 并降级为全局 |
| `{ name }` | 仅校验：与内联 `x-define` 不一致时 `warn`，仍以内联名为准（注册名的事实源是 `x-define`） |

```javascript
// 作用域注册：传元素即可，引擎上溯到它所属的 scope
engine.registerComponent(`<div x-define="row"><span x-text="label"></span></div>`, {
    el: document.getElementById("table-body"),
});

// 或者直接从 scope 实例取（如覆盖物内部）
engine.registerComponent(code, { scope: engine.getOverlay(el, "dialog")?.scope });
```

`{ scope }` 与 `{ el }` 同时传入以 `scope` 为准并 `warn`。

::: warning 注意可见域
`{ el }` 向上**整条祖先链都查不到** scope 时（元素尚未编译、已脱离引擎树）会 `warn` 并**降级为全局注册**——组件仍可用，但可见域静默放大到全引擎。想确认注册到了哪，检查返回值非 `null` 并看控制台有无降级 warn。
:::

## 组件资源：`<script setup>` 与 `<style>`

运行时注册的组件支持与模板声明完全等价的 `<script setup>` / `<style>`，但**只收集根元素的直接子级**：

```javascript
engine.registerComponent(`
    <div x-define="counter">
        <button x-on:click="inc">+</button>
        <span x-text="count"></span>
        <script type="autospark/setup">{
            data: { count: 0 },
            methods: { inc() { this.data.count++; } },
        }<\/script>
        <style>.count { font-weight: 700 }</style>
    </div>
`);
```

把 `<style>` 或 `<script setup>` 多包一层塞进子元素是**静默失效**的（节点留在快照里、不参与组件语义），因此 `registerComponent` 路径会额外 `warn` 提示你——收集行为本身不变。

## 覆盖：同名后注册覆盖，但不热替换

同名组件再次注册会**覆盖**并 `warn` 一次（去重按名进行）。已实例化的组件**不会被热替换**——每个实例持有自己克隆的 DOM，引擎没有实例缓存层：

```javascript
engine.registerComponent(v1);            // 首次
engine.registerComponent(v2);            // 覆盖 + warn 一次
// 此前已挂载的实例仍是 v1；此后新建的实例取 v2
```

需要「换个定义重来一遍」时，让宿主重建即可（如 `x-if` 摘除再挂载）。

## 继承：与模板声明同一管线

`x-define:inherit` 在注册层解析，复用编译期与 `x-import` 完全相同的继承管线（父查找 = scope 链就近 + 全局兜底）。**父未就绪时本次挂起并返回 `null`**，待 `components/<父名>/registered` 到达后自动重试排水：

```javascript
// 父 chip-base 还没注册 → warn「父组件暂未就绪，已挂起」+ 返回 null
engine.registerComponent(`<div x-define="badge" x-define:inherit="chip-base">…</div>`);

// 父到位后自动解锁，无需重试注册
engine.registerComponent(`<div x-define="chip-base">…</div>`);
```

返回 `null` 在这里**不代表注册失败**，而是「尚未完成」——调用方若需区分，看控制台 warn 文案或等 `components/<名>/registered` 事件。详见[继承与覆盖](./inherit.md)。

## 就绪信号

每次成功注册（含覆盖、继承排水后的解锁）都会广播 `components/<名>/registered`：

```javascript
engine.on("components/*/registered", (m) => {
    console.log(`${m.payload.name} 已就绪（global=${m.payload.global}）`);
});
```

该事件是 **retain** 的——晚于注册时刻订阅也能收到补发，适合做「注册完就刷新 UI」这类收尾。详见[关于组件 → 组件注册事件](./index.md#组件注册事件)。

## 只注册不注销

没有 `unregisterComponent`：

- **作用域注册**挂在 scope 的 `components` 上，随所属 scope 对象一并失去引用而回收；
- **全局注册**随 `engine.destroy()` 丢弃。

生命周期与「声明了就不再管」一致——组件定义的唯一事实源是模板或注册表，没有「撤回某次注册」的必要场景（同名覆盖已足够表达「换新版」）。

## 健壮性

| 场景 | 行为 |
| --- | --- |
| 多根 / 元素与文本混排 / 纯文本 | `warn` + 返回 `null`（不自动包装；根外的空白与注释忽略） |
| 根元素缺 `x-define` | `warn` + 返回 `null` |
| 缺 `x-define` 之外的结构正常 | 与模板声明等能力：props、`<slot>`、`data` / `methods` / 生命周期、作用域样式 |
| `opts.name` 与内联 `x-define` 不一致 | `warn`，以内联名为准 |
| `{ el }` 查不到所属 scope | `warn` + 降级为全局注册 |
| 同名重复注册 | 覆盖 + `warn`；已实例化实例不热替换 |
| 继承的父未就绪 | 挂起 + `warn`，返回 `null`；父注册后自动解锁 |
| 模板解析失败 | `warn` + 返回 `null`（不抛错，不影响已注册组件） |

::: tip 相关文档
- 声明与消费基础：[关于组件](./index.md)、[实例化组件](./instantiate.md)
- 查找与遮蔽规则、注册事件的完整说明：[查找与取用](./lookup.md)
- 继承链与方法覆盖：[继承与覆盖](./inherit.md)
- 远程加载同款通道：[远程组件](./remote.md)
:::
