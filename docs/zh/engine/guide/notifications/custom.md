# 自定义

## 自定义卡片

渲染是**单层继承**（ADR-0095 单层化 → **ADR-0097 三出口化**）——每张卡片 = 一个继承**通知外壳**的 type 组件实例（type 实例即完整卡片，无独立 shell 实例化与投影）：

```
┌─ 卡片 = type 组件实例（继承 shell 族根）────────────────────┐
│  [level 图标] [title] [link]               [close × chrome] │
│  [description]                                              │
│  [默认出口：type 专属区（task 进度条 / 三控制钮等）]          │
│  [actions 按钮行——shell 内联渲染]                            │
└─────────────────────────────────────────────────────────────┘

type 链：types[type].render（用户 type 级）
          → 全局组件表按预设名 autospark.notifications.<type>
          → shell 族根兜底（自定义 type 零配置得标准内容卡）
```

四件预设组件经 `options.components` 全局表种子注入（`autospark.*` 为引擎保留命名空间，同名声明覆盖优先）：

| 组件 | 形态 |
| --- | --- |
| `autospark.notifications.shell` | **通知外壳族根**（原 `base`，ADR-0097 正名）——卡片 chrome（边框 / 背景 / 阴影）+ 公共 methods 七件 + **纵列三出口**：`x-slot:header`（fallback = icon + title/link + description）、裸 `x-slot`（type 专属区）、`x-slot:actions`（内联按钮行）；关闭钮 = 根直接子节点（chrome——出口重载不伤 ×，`closeable` 默认 true 常显，默认与 title 首行文字垂直居中对齐） |
| `autospark.notifications.toast` / `confirm` | 继承 shell（同名覆盖的 per-type 定制点；confirm 自带默认双钮与 sticky 种子） |
| `autospark.notifications.task` | 继承 shell + 默认出口覆盖段（进度条 + 三控制钮）+ 状态机 methods |

自定义 type 组件**强制继承 shell**（引擎自动补 `x-define:inherit`，显式写不重复），按**出口覆盖段**做差异化——`<template x-slot:header>` / `<template x-slot:actions>` 为命名段、裸子节点为默认段，亦可全自绘：

```ts
const app = new AutoSpark(el, state, {
    components: {
        // 全局组件继承（ADR-0081）：裸子节点 = 继承覆盖段，替换 shell 默认出口 fallback；
        // 命名段整段替换对应出口的 fallback（三层优先级：消费方内容 > 继承覆盖 > 父 fallback）
        "my-notice": `
            <div x-define="my-notice" x-define:inherit="autospark.notifications.shell">
                <i class="fa fa-bell"></i><b x-text="title"></b>
            </div>`,
    },
    notifications: { types: { notice: { render: "my-notice" } } },
});
```

组件拿到**整包数据域 props**（剥函数后全量注入，ADR-0088——自定义 type 的自有键天然可绑），行为走 **methods 直达**（`$session` 派生变量已随 ADR-0089 退役）：

```ts
const app = new AutoSpark(el, state, {
    components: {
        // type='notice' 的完整内容卡（继承 shell 得 chrome 与 methods；header 出口整段重载）
        "notice-extra": `
            <div x-define="notice-extra" x-define:inherit="autospark.notifications.shell">
                <template x-slot:header>
                    <div class="my-notice-extra">
                        <b x-text="title"></b>
                        <i x-icon="'star'" x-show="!read"></i>
                        <button @click="remove()">不再显示</button>
                    </div>
                </template>
            </div>`,
    },
    notifications: { types: { notice: { render: "notice-extra" } } },
});
```

- props **整包注入**：全部通知键（含 `id / type / level / title / description / icon / link / actions / read / status / result / delayClose / closeable / closeWhenDone` 与自定义自有键）+ 运行态投影（`progress / state`——task 控制钮显隐与文案的数据域驱动源，ADR-0104）；
- **methods 直达**（ADR-0089）：模板内 `@click="hide()"` / `@click="remove()"` / `@click="yes()"`（shell 公共 methods 七件 + type 自有 methods）；**数据绑定走 data 域**（`x-text="title"` 响应式）；⚠️ `@click` 必须是**裸标识符或标识符调用**形态——三元等复合表达式（如 `state === 'paused' ? resume() : pause()`）走表达式兜底路径（数据视图求值），methods 不在数据视图内会解析失败；需要条件分支时在组件里封装一个 method（如内置 task 的 `togglePause()`）再裸调用；
- **三出口重载**（ADR-0097）：`<template x-slot:header>` 整段换头部（局部保留走 `x-super` 拼装）、`<template x-slot:actions>` 整段换按钮行（或经 `x-super` 叠加扩展默认按钮行）、裸子节点落默认出口（type 专属区）；具名出口走**属性参数形态** `x-slot:名`（值形态是作用域插槽形参，勿混）；关闭钮是 chrome（根直接子节点），出口重载不影响；
- 接管 `type='task'`（render 指向自定义组件）时继承链与出口同规——内置 task 模板不是特权通道；按钮点击闭环契约不变（`.autospark-notification-action` 契约类 + `data-notification-action` 索引 + 卡片根委托——自绘按钮保留类名与索引属性即得闭环）。

<demo html="notifications/render.html"/>

## 外壳定制（全族换根）

**同名覆盖 `autospark.notifications.shell` = 全族换根**（ADR-0095「模板即契约」——外观 + 内容结构 + 公共 methods 一体接管，所有 type 卡片随之换装）：

```ts
const app = new AutoSpark(el, state, {
    components: {
        // 覆盖通知外壳（只影响通知；dialog/popover/drawer 不动）
        "autospark.notifications.shell": `
            <div class="my-msg-shell" x-define="autospark.notifications.shell">
                <script setup>
                { methods: { hide() { this.engine.notifications.hide(this.props.id); } } }
                </script>
                <div class="body"><div x-slot></div></div>   <!-- 默认出口（type 专属区落点） -->
                <button class="x" @click="hide()">×</button>
            </div>`,
    },
});
```

- 值为 HTML 模板字符串（懒预编译）；要引擎契约就沿用内置模板写法（引擎类名 / `:data-notification-type` 自绑 / 公共 methods），不要则完全自定；
- 明确接管框架内建件可用 `options.builtinComponents` 写同名（优先级低于 `components`，防业务配置流误伤内置默认，ADR-0094）。

## 外观定制

三层通道沿 ADR-0068，命名 notification 化：

```css
:root {
    --autospark-notification-error-color: #d93025; /* 语义色换肤 */
    --autospark-notification-max-w: 360px;
    --autospark-notification-inset: 16px;          /* 分区列与屏幕边缘间距 */
    --autospark-notification-z: 1100;              /* 层高（高于 overlay 的 1000） */
}
```

```ts
// 1. className / styles 追加主题定制（className 类名；styles 内联 cssText——覆盖内置规则时选择器带 .autospark-notification 提升 specificity）
// 2. 语义色 CSS 变量（见上）
// 3. types[type].render / shell 裸键同名覆盖（components/builtinComponents——见自定义卡片）
```

<demo html="notifications/customize.html"/>
