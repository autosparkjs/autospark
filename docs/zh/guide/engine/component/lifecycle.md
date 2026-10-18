# 生命周期

## 钩子一览

组件实例有**四阶段**生命周期钩子，挂在 `scope.hooks`：

| 钩子 | 触发时机 | 典型用途 |
| --- | --- | --- |
| `created` | 组件 scope 创建 + data 注入后、编译前 | 初始化（建订阅、读初始 props、拼接首帧数据） |
| `mounted` | DOM 子树编译完成 | DOM 就绪后操作（绑第三方库、读尺寸） |
| `beforeUnmount` | 卸载前（watcher 仍活） | 带状态的精确清理（注销监听/定时器） |
| `unmounted` | 卸载后 | 无状态收尾 |

::: warning 为何没有 activated/deactivated、beforeUpdate/updated？
本引擎是**细粒度响应式 + DOM 模板**，没有 Vue 那样的「组件实例缓存层」（`<keep-alive>`），scope 销毁即销毁——故 `activated`/`deactivated` 无自然触发点。同理，每个绑定各自更新，没有「组件整体重渲染」的节点，`beforeUpdate`/`updated` 也无对应。需要显隐控制用 `x-show` / `x-if`（配合 `mounted`/`unmounted`）。
:::

下面这个 demo 用 `x-if` 切换组件挂载/卸载，把每次钩子触发实时记录到日志面板（`mounted` 启动定时器、`beforeUnmount` 清理）：

<demo html="component/lifecycle.html"/>

```html
<div x-define="timed">
    <div class="timer">组件存活中 · <span x-text="tick"></span></div>
    <script setup>
        {
            data: { tick: 0 },
            timer: null, // 顶层私有变量：定时器句柄不驱动更新
            created() { log('created', 'scope 已建、data 已注入') },
            mounted() {
                log('mounted', 'DOM 编译完成');
                this.data.timer = setInterval(() => this.data.tick++, 1000);
            },
            beforeUnmount() {
                log('beforeUnmount', '清理定时器');
                clearInterval(this.data.timer);   // watcher 仍活，可读最终状态
            },
            unmounted() { log('unmounted', '卸载收尾') },
        }
    </script>
</div>

<div x-if="show"><div x-component:timed></div></div>
```

## `mounted` 语义澄清

本引擎「编译即挂载」——`scope.compile()` 完成时子 DOM 已构建在父 DOM 树里（整棵树未必已插入 `document`）。`mounted` 指「子 scope 编译完成、DOM 子树构建完成」，而非 Vue 的「插入 document」。

::: tip 钩子容错
单个钩子抛错**不阻断其余**——同名多个钩子串行调用，try-catch 隔离，一个失败不影响后续。多个 `<script setup>` 的同名 hook 会串行执行。
:::
