# 全局轻提示（Toast）

## 概述

轻提示是**引擎级**的全局非阻塞通知（ADR-0068）：在屏幕角落或中央短暂浮现一条消息，几秒后自动消失，不打断用户操作。命令式（`engine.toast(...)`）与模板声明（内置全局 `toast` action）双通道发起：

```ts
// 命令式：任意 JS 代码处
const task = engine.toast({ message: "已保存", type: "success" });
```

```html
<!-- 声明式：模板任意可执行 action 处 -->
<button @click="toast('已保存')">保存</button>
<button @click="toast({ type: 'error', message: '加载失败' })">重试</button>
```

## 快速入门

<demo html="toast/basic.html"/>

## 指南

### 入参形态

`engine.toast(input)` 接受三种形态：

#### 字符串简写

属性值即消息内容，等价 `{ message }`——默认 3 秒自动关：

```ts
engine.toast("已保存");
```

#### 配置对象

承载全部保留键（见[配置选项](#配置选项)）：

```ts
engine.toast({ message: "删除失败", type: "error", delay: 5000 });
```

#### async factory（条件通知）

resolve `undefined` / `void` 则**静默不弹**（内容就绪才提示）；同步返回挂起句柄，**挂起期 `task.hide()` = 取消**（resolve 后不再显示）——「数据就绪才提示」的竞态安全形态：

```ts
engine.toast(async () => {
    const hasUpdate = await checkUpdate();
    return hasUpdate ? { message: "发现新版本", type: "info" } : undefined;
});
```

#### ToastTask 句柄

`engine.toast(...)` 返回最小任务句柄：

```ts
interface ToastTask {
    readonly id: string;          // 实例 id（缺省自动生成；factory 挂起期为空串）
    readonly el: HTMLElement | null; // 卡片根元素（排队未显示 / 已关闭为 null）
    hide(): void;                 // 关闭（走离场动画；幂等）
    readonly closed: boolean;     // 是否已关闭
}
```

### 全局默认与全关

`options.toast` 承载全局默认，合并链：`内置默认 < options.toast 全局默认 < 单次调用 props`（按保留键逐层覆盖、每键独立）：

```ts
const app = new AutoSpark(el, state, {
    toast: {
        pos: "bottom-right", // 全站右下角
        delay: 4000,         // 全局 4 秒
        showCount: 3,        // 每列同屏最多 3 条
        icons: { success: "check-circle" }, // 图标重映射
    },
});
```

`toast: false` **整体关闭**：不建容器、不注样式，`engine.toast()` 与全局 `toast` action 调用均 warn + no-op（不给半开状态）。

### 屏幕位置与分区队列

`pos` 七值枚举（命名对齐 `data-overlay-placement` 词汇）：`top-left` / `top-center` / `top-right`（默认）/ `bottom-left` / `bottom-center` / `bottom-right` / `center`（屏幕正中大提示）。

<demo html="toast/pos.html"/>

队列语义（ADR-0068 决策 8）：

- **按 pos 分区各计**：每列独立 FIFO 队列，上限 `showCount`（默认 5）——右上排满不阻塞右下入队；
- **append 列尾**：先来在上、后来在下（新卡不把已有卡往下顶，视觉稳定）；
- **满员排队、按序补位**：自动关闭腾出空坑后，等待队列按 FIFO 顺序挂载；
- **离场平滑收拢**：关闭中的卡片高度平滑收拢归零，兄弟卡片随布局流平滑上移、无跳动（收拢与离场动画同链进行）；
- **center 无单例特判**：「中央单例」语义用同 id 原地更新表达。

:::tip offset 只在列首次创建时生效
分区列是惰性创建的引擎结构——列已存在时后续调用的 `offset` 被忽略（不迁移已建列）。需要不同间距的位置请用不同 pos，或在启动早期先用目标 offset 触发一次调用占位。
:::

### 同 id 原地更新

同 id 重复调用 = **原地更新**而非销毁重建（上传进度类场景的标志性能力）：

<demo html="toast/update.html"/>

- **显示中**：换内容、换 type（响应式换色换图标）、**重置 delay 满额计时**（从满格重新倒计）；不重播进场动画、不重复挂卡；
- **排队中**：只换内容、位置不动，轮到显示时以新值渲染；
- 更新基准是**卡片当前生效配置**——未传的键保留原值（进度场景重复 `toast({ id, message })` 不会丢首次的 delay / pos）；
- `pos` / `offset` / `id` 更新时忽略（不迁移已建列）。

### 类型、图标与语义色

`type` 五值封闭枚举，驱动图标与卡片整体语义着色——「不点开就知道什么级别」：

<demo html="toast/type.html"/>

- `none`（默认）：无图标无着色，纯文本；
- `info` / `success` / `warn` / `error`：内置图标**同名词映射**（`success` 映射内置 `yes` 图标）+ 卡片语义着色（全边语义色 border、同色系超淡底——底色经 `color-mix` 混白随主色自动调和，换肤一处生效）；
- `options.toast.icons` 重映射：`icons: { success: "check-circle" }`——未注册图标名照传，x-icon 缺图不破相兜底（ADR-0058）。

语义色走双层 CSS 变量（单一消费点 `--autospark-toast-accent` + 用户换肤接口），覆盖一处即全类型换肤：

```css
:root {
    --autospark-toast-info-color: #409eff;
    --autospark-toast-success-color: #67c23a;
    --autospark-toast-warn-color: #e6a23c;
    --autospark-toast-error-color: #f56c6c;
}
```

### 按钮行与关闭钮

通知可带操作按钮——`actions` 双形态，`hide` 约定键对齐 x-loading（ADR-0038）：

<demo html="toast/actions.html"/>

```ts
// 对象 = 局部一次性按钮：不进全局 action 表，点击直调
engine.toast({
    message: "已删除 3 个文件",
    type: "warn",
    delay: 0,
    actions: [{ title: "撤销", handle: undo }],
});

// 字符串 = 全局 action 名：查 engine.actions 解析 title（ActionDesc.title ?? 名字）
engine.toast({ message: "配置已导出", actions: ["copy"] });
```

- `hide` 默认 `true`（点击后关 toast），显式 `false` 续显——「失败重试」按钮点完提示保留；
- 字符串形态**只查全局表**——toast API 无元素锚点无法定位 scope 链，局部 scope action 不支持（见[注意事项](#注意事项)）；
- **悬停自动暂停倒计时**：带按钮的 toast 用户需要时间移过去点，移出后按剩余时间继续；
- `closable: true` 出关闭钮（内置 `no` 图标），适合 sticky 提示手动收尾。

### 全局 toast action

内置执行型 action `toast`（ADR-0068 决策 15）：模板任意 `@click` 处直接发通知，payload 字符串或配置对象直通 `engine.toast`：

<demo html="toast/api.html"/>

- action 参数表达式经 `with(data)` 求值——payload 里可直接引用 x-data 字段与全局 state；
- 调用照常广播 `actions/toast/*` 生命周期信号（x-loading 等）；
- 用户同名声明覆盖内置（`options.actions.toast` 先扫先占）；
- `options.toast: false` 时 warn + no-op（全关语义）。

### 生命周期与 toastManager

- **delay 计时**：默认 3000ms；`delay: 0` = sticky 永不自动关（「立即关」等于不该弹）；hover 暂停 / 移出恢复按**剩余时间制**；
- **`engine.stop()` 不动 toast**：轻提示无锚、非树内，生命周期独立（stop 语义是摘树暂停模板响应）；
- **`engine.destroy()` 收口**：全部立即销毁（无动画）+ 容器整体移除；
- **多引擎独立**：每引擎独立 manager / 容器 / 队列，互不共享。

`engine.toastManager` 继承 `Map<string, ToastTask>`，键恒为 id：

```ts
engine.toastManager.get(id);      // 原生 Map.get
engine.toastManager.delete(id);   // 覆写：立即销毁（无动画）——与 task.hide() 的动画关闭区分
engine.toastManager.clear(false); // 清全部（含等待队列）；false = 立即清空，缺省带离场动画
engine.toastManager.size;         // 含排队中的全部实例数
```

### 事件

双通道广播（引擎总线 + 卡片元素 `dispatchEvent`——卡片挂在 body 容器下，树内物理收不到冒泡），payload `{ toast, el }`（[全局 toast action](#全局-toast-action) 的示例页含事件日志演示）：

<demo html="toast/api.html"/>

```ts
// 引擎总线：回调收 message 对象，payload 在 m.payload
engine.on("toast:show", (m) => console.log(m.payload.toast.id, m.payload.el));
// DOM 通道：卡片挂在 body 容器下，body 侧监听可收到
document.body.addEventListener("toast:hide", (e) => {
    console.log("关闭：", e.detail.toast.id);
});
```

一切移除路径均广播 `toast:hide`：自动关闭、`task.hide()`、`delete()`、`clear()`、`destroy()` 收口。

### 视觉定制与自定义 shell

<demo html="toast/customize.html"/>

三层定制通道，按侵入度递增：

```css
:root {
    /* 换肤层：语义色 / 形态变量（变量须定在 :root / body 层——容器挂 body 下，
       业务容器上的变量继承不到）。卡片背景 / 边框复用 overlay 变量——与对话框一处换肤 */
    --autospark-toast-error-color: #d93025;
    --autospark-toast-fg: #1f2329;
    --autospark-overlay-bg: #fff;
    --autospark-overlay-border: rgba(0, 0, 0, 0.1);
    --autospark-toast-max-w: 360px;
    --autospark-toast-inset: 16px; /* 分区列与屏幕边缘间距（offset 键的定制点） */
    --autospark-toast-z: 1100;     /* 层高（默认高于 overlay 的 1000——toast 浮于对话框之上） */
}
```

```ts
// 1. className 追加主题类（覆盖内置规则时选择器须带 .autospark-toast 提升 specificity——
//    引擎样式懒注入 head 尾部，同权重单类主题会被后声明者压过）
engine.toast({ message: "m", className: "my-toast-theme" });

// 2. 换肤层：语义色 CSS 变量（见上）
// 3. 结构层：toast.shell 指向全局组件表里的自定义结构（骨架全换，卡片根照打引擎契约标记）
const app = new AutoSpark(el, state, {
    components: {
        "my-toast": '<div class="my-toast" :data-toast-type="type"><span x-html="message"></span></div>',
    },
    toast: { shell: "my-toast" },
});
```

自定义 shell 拿到的 props 是**预解析后形态**：`type` / `message`（经消毒）/ `icon`（icons 映射已解析）/ `actions`（字符串名已查表合成）/ `closable`——直接消费即可，无需再解析。toast-shell **无出口协议**（没有 `x-slot`——message 是 props 键不是组件，与面板外壳的本质差异）；未命中组件名 warn + 回退内置。

## 配置选项

两级合并链：`内置默认 < options.toast（全局默认）`，单次调用 props 逐键覆盖全局。保留键**封闭清单**——未知键 warn + 忽略（拼写错误的排错面）；空 message warn + no-op（不给白板 toast）。

| 配置项      | 默认值     | 修饰符 | 说明                                                                                                                                                     |
| ----------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`   | —          | —      | 消息内容（HTML；经 `options.sanitizer` 消毒——与 x-html 同一安全通道）                                                                                     |
| `type`      | `"none"`   | —      | 提示类型 `none / info / success / warn / error`——驱动图标与语义色；非法值 warn + 回退；见[类型、图标与语义色](#类型-图标与语义色)                        |
| `delay`     | `3000`     | —      | 自动关闭延迟 ms；`0` = sticky 永不自动关；hover 暂停 / 移出恢复（剩余时间制）                                                                             |
| `pos`       | `"top-right"` | —   | 屏幕锚定位置（7 值枚举）；非法值 warn + 回退默认；见[屏幕位置与分区队列](#屏幕位置与分区队列)                                                              |
| `offset`    | —          | —      | 分区列与屏幕边缘的间距（数字 = px，字符串透传 CSS）；**仅该列首次创建时生效**，已建列不迁移                                                              |
| `id`        | 自动生成   | —      | 实例 id；**同 id = 原地更新**（见[同 id 原地更新](#同-id-原地更新)）。仅单次调用层生效——全局默认携带 id 会让所有 toast 同 id 互并成一条                   |
| `actions`   | —          | —      | 按钮行（字符串 = 全局 action 名 / 对象 = 局部按钮）；见[按钮行与关闭钮](#按钮行与关闭钮)                                                                  |
| `closable`  | `false`    | —      | 关闭按钮（自动消失的轻提示默认不设手关钮；开启出 ×，内置 `no` 图标）                                                                                       |
| `animate`   | `"slide"`  | —      | 进出场动画（ADR-0039 三形态；默认按 pos 方向自适应滑入，`false` 关闭）                                                                                     |
| `className` | —          | —      | 附加类名（追加在卡片根，主题定制通道；见[视觉定制与自定义 shell](#视觉定制与自定义-shell)）                                                                |

另有三个**管理器级键**只在 `options.toast` 全局层生效（不进单次合并链）：

| 键          | 默认值 | 说明                                                                                       |
| ----------- | ------ | ------------------------------------------------------------------------------------------ |
| `showCount` | `5`    | 同屏显示上限——**按 pos 分区各计**，满员 FIFO 排队、自动关闭后按序补位                      |
| `icons`     | —      | type → 图标名重映射（默认同名词映射，`success` → 内置 `yes` 图标）                          |
| `shell`     | —      | 自定义单项外壳组件名（查找协议：`options.components` 全局表 → 内置默认；未命中 warn 回退）  |

## 注意事项

- **sticky 永占坑位**：`delay: 0` 的提示永不自动关，极端场景下会占满分区队列——sticky 请搭配 `closable: true` 给用户退出通道。
- **actions 不支持 scope action**：字符串形态只查 `engine.actions` 全局表（无元素锚点定位不了 scope 链）。
- **无元素锚定**：v1 纯屏幕锚定，「元素旁短暂提示」场景用 tooltip（悬停）/ popover（点击）——`anchor` 锚定在 fast-follow 清单。
- **触摸设备**：hover 暂停无专属逻辑（无 hover 事件自然跳过）。
- **无障碍**：`role="status"` / `aria-live` 动态关联在 fast-follow 清单（当前版本不做补偿）。
- **SSR**：无 `document` 环境静默跳过显示（不建容器不报错）。

技术决策与被否决方案详见 [ADR-0068](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0068-toast.md)。
