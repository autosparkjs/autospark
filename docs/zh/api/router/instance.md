---
title: 实例
---

# 实例方法与属性

## 关于

router 实例经宿主元素访问（`host.router`），提供导航控制、模态管理、生命周期与状态查询。事件监听（`on`/`once`/`off`）与钩子管理（`hooks`）分别在[事件](./events.md)与[钩子](./hooks.md)页详述。

```js
const router = document.querySelector("#app").router;
```

## 导航方法

所有导航方法在 router 未 attach 时抛出错误。

### push(path, state?)

压入一条新的 history 记录并导航。

```js
router.push("/users/42");
router.push("/users/42", { from: "list" }); // state 存入 history state
```

**模态快捷方式**：路径以 `!` 前缀开头时直接打开模态路由，不进入 history：

```js
router.push("!/login"); // 以模态打开 /login
```

### replace(path, state?)

替换当前 history 记录（不产生新栈项）。

### home()

导航到主页（`base + options.home`，默认 `"/"`），内部使用 replace。

### back() / forward() / go(delta)

等价于 `history.back()` / `history.forward()` / `history.go(n)`。

::: warning back 的模态优先
当存在打开的模态时，`back()` **先关闭栈顶模态**，不产生真实的历史后退。
:::

### isStopNavigating()

```ts
async isStopNavigating(): Promise<void>
```

当正在导航时返回一个 Promise，在下一次 `navigation:end` 或 `navigation:cancel` 时 resolve；空闲时立即 resolve。用于排队等待当前导航完成。

## 生命周期

### attach() / detach()

```ts
attach(): void;
detach(): void;
```

- `attach()`：绑定 history、初始化路由表/钩子/加载器/链接委托/模态容器/engine 接管，随后按当前 URL 恢复路由状态。**构造函数内部已自动调用**——重复调用抛出 `Already attached` 错误。
- `detach()`：解除与宿主的绑定并清理全部副作用（head 还原、监听清理、加载器资源释放、事件解绑）。注入 engine 模式下不销毁 engine；自建模式下销毁。

## 状态属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `mode` | `"history" \| "hash"` | 当前路由模式 |
| `base` | `string` | 基础路径 |
| `debug` | `boolean` | 调试模式开关 |
| `location` | `history.Update` | 当前位置（history 库对象，含 `pathname`/`search`/`state`） |
| `options` | `AutoSparkRouterOptions` | 归一化后的配置 |
| `routes` | `AutoSparkRouteTable` | 路由表注册器，见[匹配结果](./matched-route.md#路由表) |
| `hooks` | `HookManager` | 钩子管理器，见[钩子](./hooks.md) |
| `renderers` | `ViewRendererBase[]` | 已注册的渲染器列表 |
| `engine` | `AutoSpark \| undefined` | 关联的 engine 实例 |
| `attached` | `boolean` | 是否已绑定 DOM |
| `isNavigating` | `boolean` | 是否正在导航 |
| `currentNavVersion` | `number` | 当前导航版本号 |
| `navSignal` | `AbortSignal` | 当前导航的 AbortSignal（供数据/视图/渲染消费） |
| `lastViewSlot` | `HTMLElement \| null` | 最后一次渲染的视图槽元素 |
| `lastMatched` | `AutoSparkMatchedRouteItem[] \| null` | 最后一次匹配的匹配数组 |

## 模态方法

```ts
async openModal(options: ModalOptions): Promise<void>;
async closeModal(route?: AutoSparkRouteItem | string): Promise<void>;
async closeAllModals(): Promise<void>;
async closeTopModal(): Promise<void>;
```

```js
await router.openModal({ route: "!/login" }); // 打开模态
await router.closeModal("/login");            // 按路径关闭
await router.closeAllModals();                // 关闭全部
```

### ModalOptions

```ts
interface ModalOptions {
    /** 路由路径（如 "/login"）或路由配置对象 */
    route?: string | AutoSparkRouteItem;
    /** 路由参数 */
    params?: Record<string, string>;
    /** 查询参数 */
    query?: Record<string, string>;
    /** 是否显示背景遮罩 */
    backdrop?: boolean;
}
```

### ModalConfig

路由项 `modal` 字段为对象时使用的配置：

```ts
interface ModalConfig {
    /** 模态类型：dialog（对话框）或 drawer（抽屉），默认 "dialog" */
    type?: "dialog" | "drawer";
    /**
     * 显示位置，默认 "center"
     * - dialog 支持：center, top, top-left, top-right, right, bottom-right, bottom, bottom-left, left
     * - drawer 支持：left, right, top, bottom
     */
    position?: "center" | "top" | "top-left" | "top-right" | "right"
        | "bottom-right" | "bottom" | "bottom-left" | "left";
    /** 在 position 基础上的额外偏移（像素），[20, 10] = 右移 20px、下移 10px */
    offset?: [number, number];
    /** 自动关闭倒计时（毫秒），如 3000 表示 3 秒后自动关闭 */
    autoClose?: number;
    /** 是否显示背景遮罩（默认 true） */
    backdrop?: boolean;
    /** 点击遮罩是否关闭（默认 true） */
    closeOnBackdropClick?: boolean;
    /** 按 ESC 键是否关闭（默认 true） */
    closeOnEsc?: boolean;
    /** 是否支持多层模态堆叠（默认 true） */
    stackable?: boolean;
}
```

模态内部约束：最大堆叠层数 10 层（防无限堆叠）；`modal:open` / `modal:close` 事件随开闭发出，见[事件](./events.md)。
