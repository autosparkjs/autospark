# 路由渲染测试指南

## 概述

本目录包含 Kylin Router 路由渲染的完整测试套件，使用事件监听机制验证路由行为，避免直接访问私有 API。

## 核心测试工具

### RouteEventCollector

路由事件收集器，用于监听和收集路由生命周期事件。

```typescript
import { RouteEventCollector } from "./common";

// 创建事件收集器
const collector = new RouteEventCollector(router);

// 执行路由操作
router.push("/some-path");

// 等待异步操作完成
await new Promise((resolve) => setTimeout(resolve, 100));

// 访问收集的事件数据
console.log(collector.toRouteHash);        // 目标路由 hash
console.log(collector.fromRouteHash);     // 源路由 hash
console.log(collector.navigationMode);     // 导航模式 (push/replace/pop)
console.log(collector.hasRenderError);     // 是否有渲染错误

// 清理事件监听器
collector.dispose();
```

**核心属性：**

- `toRouteHash`: 从 `navigation:matched` 事件获取目标路由的 hash
- `fromRouteHash`: 从 `navigation:matched` 事件获取源路由的 hash
- `toRoutes`: 完整的目标路由数组
- `fromRoutes`: 完整的源路由数组
- `navigationMode`: 导航模式（push/replace/pop）
- `renderBeforeRoutes`: 渲染前的路由数据
- `renderAfterData`: 渲染后的数据（包含错误信息）
- `hasRenderError`: 是否发生渲染错误
- `renderError`: 渲染错误对象

**核心方法：**

- `clear()`: 清除收集的事件数据
- `dispose()`: 清理事件监听器，防止内存泄漏

### assertRenderInOutlet

验证渲染内容在 kylin-outlet 内且视图容器存在。

```typescript
import { assertRenderInOutlet } from "./common";

const collector = new RouteEventCollector(router);
router.push("/home");
await new Promise((resolve) => setTimeout(resolve, 100));

// 验证渲染结构
assertRenderInOutlet(host, collector, ".home", "Home Page");

collector.dispose();
```

**验证内容：**

1. ✅ kylin-outlet 元素存在
2. ✅ 指定的内容元素在 outlet 内
3. ✅ 文本内容匹配（可选）
4. ✅ 视图容器存在（基于 hash）
5. ✅ 视图容器有正确的 class

### 其他断言函数

#### assertNavigationMode

断言导航模式。

```typescript
import { assertNavigationMode } from "./common";

const collector = new RouteEventCollector(router);
router.push("/path");
await new Promise((resolve) => setTimeout(resolve, 50));

assertNavigationMode(collector, "push");
collector.dispose();
```

#### assertRouteTransition

断言路由切换的源和目标。

```typescript
import { assertRouteTransition } from "./common";

const collector = new RouteEventCollector(router);
router.push("/new-path");
await new Promise((resolve) => setTimeout(resolve, 50));

// 只验证目标路由
assertRouteTransition(collector, "target-hash");

// 同时验证源和目标路由
assertRouteTransition(collector, "target-hash", "source-hash");

collector.dispose();
```

#### assertNoRenderError

断言渲染没有错误。

```typescript
import { assertNoRenderError } from "./common";

const collector = new RouteEventCollector(router);
router.push("/path");
await new Promise((resolve) => setTimeout(resolve, 50));

assertNoRenderError(collector);
collector.dispose();
```

#### assertRenderError

断言渲染发生错误。

```typescript
import { assertRenderError } from "./common";

const collector = new RouteEventCollector(router);
router.push("/error-path");
await new Promise((resolve) => setTimeout(resolve, 50));

// 只验证有错误
assertRenderError(collector);

// 验证错误消息
assertRenderError(collector, "expected error message");

collector.dispose();
```

## 测试模式

### 基础测试模式

```typescript
it("应该正确渲染路由", async () => {
    router = await createRouter(host, win, {
        routes: {
            name: "home",
            path: "/",
            view: '<div class="home">Home</div>',
        },
    });

    // 1. 在 push 之前创建事件收集器
    const collector = new RouteEventCollector(router);
    
    // 2. 执行路由操作
    router.push("/");
    
    // 3. 等待异步操作完成
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // 4. 验证结果
    assertRenderInOutlet(host, collector, ".home", "Home");
    
    // 5. 清理事件监听器
    collector.dispose();
});
```

### 验证导航事件

```typescript
it("应该触发正确的导航事件", async () => {
    router = await createRouter(host, win, { /* ... */ });

    const collector = new RouteEventCollector(router);
    router.push("/target");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证导航模式
    assertNavigationMode(collector, "push");

    // 验证路由切换
    assertRouteTransition(collector, "target-hash", "source-hash");

    collector.dispose();
});
```

### 验证错误处理

```typescript
it("应该正确处理渲染错误", async () => {
    router = await createRouter(host, win, {
        routes: {
            name: "error",
            path: "/error",
            view: { from: async () => { throw new Error("Test error"); } },
        },
    });

    const collector = new RouteEventCollector(router);
    router.push("/error");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证有错误发生
    assertRenderError(collector, "Test error");

    collector.dispose();
});
```

## 重要注意事项

### ⚠️ 事件收集器生命周期

1. **在 router.push() 之前创建收集器**
   ```typescript
   // ✅ 正确
   const collector = new RouteEventCollector(router);
   router.push("/path");
   
   // ❌ 错误 - 可能错过事件
   router.push("/path");
   const collector = new RouteEventCollector(router);
   ```

2. **始终调用 dispose()**
   ```typescript
   const collector = new RouteEventCollector(router);
   try {
       router.push("/path");
       await new Promise((resolve) => setTimeout(resolve, 100));
       // 测试断言...
   } finally {
       collector.dispose(); // 确保清理
   }
   ```

### ⚠️ 避免私有 API

不要使用已弃用的函数访问私有成员：

```typescript
// ❌ 已弃用 - 使用私有 API
import { getRouteHash } from "./common";
const hash = getRouteHash(router); // 访问 router._matchRoute()

// ✅ 推荐 - 使用事件监听
const collector = new RouteEventCollector(router);
const hash = collector.toRouteHash;
```

## 测试文件组织

- `common.ts` - 公共测试工具和辅助函数
- `basic.test.ts` - 基础路由匹配和通配符测试
- `nested.test.ts` - 嵌套路由渲染测试
- `navigation.test.ts` - 导航操作测试
- `keepalive.test.ts` - 缓存功能测试
- `async.test.ts` - 异步视图加载测试
- `guards.test.ts` - 路由守卫测试
- `error.test.ts` - 错误处理测试
- `redirect.test.ts` - 重定向测试
- `advanced.test.ts` - 高级特性测试

## 路由事件生命周期

Kylin Router 在导航过程中触发以下事件：

```
1. navigation:start    - 导航开始
   ↓
2. navigation:matched   - 路由匹配完成
   ↓
3. render:before       - 渲染前
   ↓
4. render:after        - 渲染后（包含错误信息）
```

RouteEventCollector 监听这些事件并提供便捷的访问方法。

## 最佳实践总结

1. ✅ 始终在路由操作前创建事件收集器
2. ✅ 使用事件数据验证路由行为
3. ✅ 测试完成后调用 collector.dispose()
4. ✅ 使用便捷断言函数简化测试代码
5. ❌ 避免直接访问路由器的私有成员
6. ❌ 不要在路由操作后创建事件收集器

## 运行测试

```bash
# 运行所有渲染测试
bun test src/__tests__/render/

# 运行单个测试文件
bun test src/__tests__/render/basic.test.ts

# 运行特定测试
bun test -t "应该正确渲染静态路由"
```

## 调试技巧

### 查看收集的事件

```typescript
const collector = new RouteEventCollector(router);
router.push("/path");
await new Promise((resolve) => setTimeout(resolve, 100));

// 调试：打印收集的事件信息
console.log("toRouteHash:", collector.toRouteHash);
console.log("fromRouteHash:", collector.fromRouteHash);
console.log("navigationMode:", collector.navigationMode);
console.log("toRoutes:", collector.toRoutes);
console.log("hasRenderError:", collector.hasRenderError);

collector.dispose();
```

### 验证 DOM 结构

```typescript
// 手动检查 DOM 结构
const outlet = host.querySelector("kylin-outlet");
console.log("Outlet exists:", !!outlet);

const viewContainer = host.querySelector(".kylin-view");
console.log("View container:", viewContainer);

const content = host.querySelector(".my-content");
console.log("Content in outlet:", outlet?.contains(content));
```
