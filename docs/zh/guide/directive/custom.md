# 自定义指令

所有内置指令都继承自 `AutoSparkDirectiveBase`。自定义指令同样继承它，声明静态元数据（`kind` / `priority`）并按通道实现生命周期钩子。创建与注册按场景分三条路径：

| 场景 | 创建 | 注册 | 特点 |
| --- | --- | --- | --- |
| script · 简单指令 | `AutoSpark.defineDirective(spec)` | 自动入全局安装队列 | 一步到位，任意时刻可调 |
| script · 完全控制 | `class extends AutoSparkSpaces.AutoSparkDirectiveBase` | 安装器 push 进全局队列 | 加载顺序无关 |
| ESM | `import { AutoSparkDirectiveBase } from "autospark"` | `engine.directives.set` / `.install` | 实例级精准注册 |

## 示例一 · 入门：高亮指令（Runtime 通道）

最简单的形态：不订阅状态，只在元素挂载 / 属性变化时施加副作用。`kind: 1`（Runtime）走 observer 通道——属性保留在结果 DOM 上，元素增删与属性变化由共享 MutationObserver 感知。

```js
// my-directives.js —— 在 autospark.js 之后加载即可，先于/后于 new AutoSpark 均可
AutoSpark.defineDirective({
  name: "highlight",
  kind: 1, // Runtime：observer 通道
  mounted() {
    this.el.style.backgroundColor = this.value || "yellow"; // this.value 为属性原值
  },
  attrChanged(newVal) {
    this.el.style.backgroundColor = newVal || "yellow"; // 属性变化原地更新，不重挂
  },
  unmounted() {},
});
```

```html
<script src="autospark.js"></script>
<script src="my-directives.js"></script>

<div id="app"><span x-highlight="pink">hello</span></div>
<script>
  new AutoSparkSpaces.AutoSpark(document.getElementById("app"), {});
</script>
```

`x-highlight` 的值是**属性原值**（不求值）；改写 `span` 的 `x-highlight` 属性会触发 `attrChanged`，背景色原地切换。

<demo html="custom/highlight.html"/>

## 示例二 · 进阶：反应式字数统计（Hybrid 通道）

订阅状态、随变化自动更新文本。`kind: 2`（Hybrid）同时具备 scope 通道（`created` / `binding.watch` 反应式）与 observer 通道（`mounted` / `unmounted` 生命周期）。

```js
AutoSpark.defineDirective({
  name: "charcount",
  kind: 2, // Hybrid：反应式 + 生命周期
  created() {
    const apply = (v) => (this.el.textContent = `${String(v ?? "").length} 字`);
    // watch(表达式, 回调) 返回初始值；退订由 scope 统一管理，无需手写清理
    apply(this.binding.watch(this.value, ({ value }) => apply(value)));
  },
});
```

```html
<div id="app" x-data="{ note: '你好' }">
  <input x-model="note" />
  <p x-charcount="note"></p>
</div>
```

输入时 `note` 变化 → watch 回调触发 → 字数自动刷新。`this.value` 此处是**表达式**（`"note"`），沿 scope 链求值——与内置指令（如 `x-show`）同一订阅惯例。

<demo html="custom/charcount.html"/>

## 示例三 · 高级：倒序结构指令（自动更改结构）

结构指令通过 `static ownsChildren()` 返回 `true` **接管子树**：编译器不再递归编译其子元素，结构的改写权完全交给指令——可以在编译期重排、过滤、包裹子元素，改写完成后交还编译器，子元素内部的指令照常生效。高级形态超出 `defineDirective` 的最小 spec，使用类形态 + 全局队列注册：

```js
// reverse.js —— 可放在 autospark.js 之前或之后，加载顺序无关
(window.__AUTOSPARK_DIRECTIVES__ = window.__AUTOSPARK_DIRECTIVES__ || []).push(
  (engine) => {
    const { AutoSparkDirectiveBase } = AutoSparkSpaces; // 安装器体执行时引擎必已加载
    engine.directives.install(
      "reverse",
      class extends AutoSparkDirectiveBase {
        static kind = 0; // Compile：scope 通道
        static ownsChildren() {
          return true; // 接管子树，结构由本指令作主
        }
        created() {
          const tpl = this.template; // 只读模板子树（含原始子元素与指令属性）
          // 倒序 = 逆序逐个搬到尾部（正序搬运是恒等变换）
          for (const child of [...tpl.children].reverse()) tpl.appendChild(child);
          // 改写完成后交还编译器，子元素照常走指令编译
          this.engine.compiler.compileSubtree(this.el, tpl, this.binding);
        }
      },
    );
  },
);
```

```html
<ul x-reverse>
  <li>1</li>
  <li>2</li>
  <li>3</li>
</ul>
<!-- 渲染：3 2 1 -->
```

<demo html="custom/reverse.html"/>

::: warning ownsChildren 是排他契约
同元素声明多个接管子树的指令（如 `x-reverse` 与 `x-for`）会冲突——引擎对此 warn 并裁决归属。结构指令只独占一层，需要组合时用嵌套包裹。
:::

## 注册入口：set 与 install 的语义分叉

| 入口 | 撞预设指令名 | 撞其他已注册名 | 适用场景 |
| --- | --- | --- | --- |
| `engine.directives.set(name, Cls)` | 静默覆盖 | 静默覆盖 | ESM 实例级注册；明确要接管内置指令 |
| `engine.directives.install(name, Cls)` | warn + **跳过** | warn + 覆盖 | 插件 / 生态分发；防意外顶掉内置能力 |

两者就绪衔接一致：engine 就绪前注册只入表（`initializeAll` 统一初始化），就绪后注册立即初始化——Runtime 指令晚注册经 observer 重扫**即时生效**于已编译 DOM，Compile / Hybrid 指令晚注册只影响**未来编译**（如 `engine.patch` 出的新区域；需要参与首次编译时用 `autostart: false` + 注册 + `engine.start()`）。

## 全局安装队列（script 场景）

`window.__AUTOSPARK_DIRECTIVES__` 是**指令安装器**（`(engine) => void`）的先到先存队列：

- 每个 engine 构造时全量消费队列（先于首次编译，参与首渲）；建立后再 push 的安装器**立即广播给全部存活 engine**——先装引擎还是先装插件均无序可忧；
- 安装器体内可安全取用 `AutoSparkSpaces` 上的任何导出（执行时引擎必已加载）；
- 两条约定：始终经 `window.__AUTOSPARK_DIRECTIVES__.push(...)` 触达（缓存原数组引用的 push 不经广播，只影响未来 engine）；队列 Proxy 化后禁止整体重赋值该属性。

## 注意事项

- `defineDirective` 的 spec 是**最小键集**：`name`（必填，缺失抛错）、`kind`（缺省 `0`）、`priority`（缺省 `0`）、六个实例钩子（`created` / `compile` / `destroy` / `mounted` / `unmounted` / `attrChanged`）。结构指令（`ownsChildren`）、元素名指令（`elementName`）、类级钩子（`static initialize` / `dispose`）、`singleton` 等高级形态请用类形态（示例三）。
- 同类静态元数据在类形态下用 `static` 字段声明：`static kind = 1`、`static override priority = 50`。
- 指令名由注册表键标识（`install("reverse", Cls)` 的 `"reverse"`），与类名无关。

## 相关内容

- 指令名注册表、一条声明的组成、执行通道见[指令](./index.md)
- 选项 / 修饰符 / 宿主选项的通用机制见[指令配置](./config.md)
- 内置指令参考见侧边栏「指令参考」，或从 [x-bind](../directives/x-bind.md) 开始
