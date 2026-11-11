# 无模板基组件（x-define.abstract）

> ADR-0134。`x-define.abstract` 声明一个**抽象组件**——不贡献模板骨架、不可直接实例化、只可被 [`x-define:inherit`](./inherit.md) 继承，为组件族提供统一的**行为基类**（data 默认值 / methods / 生命周期钩子 / 样式段）。

## 什么时候需要

同族组件需要共享**行为**而非**结构**时：普通继承（ADR-0081）是「父出骨架、子填肉」——子组件的根元素会被父模板根替换；而基类组件恰恰要求反向——**骨架由子定、父只贡献行为**。典型场景是内置的 `autospark.base`：为所有官方组件提供主题档位 props（`data-size` / `data-dark` 等）的物化行为，但绝不干预子组件的模板结构。

概念模型对标 OOP 抽象基类：

| OOP 抽象基类 | autospark 抽象组件 |
| --- | --- |
| `new Abstract()` 编译期拒绝 | `x-component:` 消费侧 warn + 拒渲染；元素名标签不安装 |
| 字段带默认值，子类继承 | `data` 声明经合并入子组件（子同名键胜） |
| 具体方法（子复用/覆写） | `methods` 同名子整体覆盖；`this.super.方法()` 可调父实现 |
| 子类构造先跑父构造 | hooks 父先子后串行 |
| 抽象方法（子必须实现） | **无**——基类只做「给子自动装上行为」，不做强制契约 |

## 声明与继承

```html
<!-- 抽象基类：修饰符 .abstract（≡ x-define-options="{abstract:true}"，显式布尔含 false 优先） -->
<div x-define="animal.base" x-define.abstract>
    <!-- 元素子节点无意义（快照弃权，warn）；仅 <script setup> / <style> 生效 -->
    <script setup>
        {
            data: { kind: "动物" },
            methods: { speak() { return this.data.kind + "！" } },
            mounted() { /* 父先子后：先于子组件 mounted 执行 */ },
        }
    </script>
</div>

<!-- 子组件继承：子模板根胜出（button 根保留，原生语义完整） -->
<button x-define="animal.dog" x-define:inherit="animal.base">
    <span class="label" x-slot>{{ kind }}：汪汪</span>
    <script setup>{ data: { kind: "小狗" } }</script>
</button>
```

解析规则（与普通继承的差异仅在**模板归属**，其余全复用 ADR-0081 管线）：

- **快照弃权**：解析后子快照 = 子自身模板（子模板根胜出），不深克隆父快照、不做出口替换、不做子根属性并入；
- **出口清单 = 子自身出口**（父无模板无出口）；消费方内容 > 子出口 fallback 的三层优先级不变；
- **setup / styles / defaults 合并语义与普通继承完全一致**：data 浅合并子胜、methods 同名子覆盖（`this.super` 可调父）、hooks 父先子后、styles 拼接子在后。

<demo html="component/abstract.html"/>

## 约束与失败策略

| 场景 | 行为 |
| --- | --- |
| 抽象组件被直接实例化（`x-component:` / 元素名标签） | warn + 拒渲染（宿主内容保持）；元素名形态标签**不安装** |
| 抽象组件又声明 `x-define:inherit` | warn + 拒绝注册（abstract 只可作继承链根——无模板语义与「继承父模板」自相矛盾） |
| 声明上的元素子节点 / `x-slot` 出口 | warn + 忽略（无骨架可贡献） |
| `<style>` 段 | 照常拼接继承（scoped/global 均可） |
| 链式混合 `abstract base ← card ← orderCard` | 合法：card 层子模板根胜出；card 以下回归普通继承语义（父出骨架） |

## 内置 autospark.base

engine 内置了抽象基组件 `autospark.base`（[组件总览 · 主题档位](/zh/components/#主题档位与-autosparkbase)）——所有官方组件均继承它，获得主题档位 props（`data-size` / `data-shadow` / `data-radius` / `data-spacing` / `data-dark` / `data-colorized`）的宿主属性物化行为，接通 [@autospark/theme](/zh/guide/theme/) 的手动通道 CSS 形成局部主题。自定义组件同样可以直接继承：

```html
<div x-define="my.panel" x-define:inherit="autospark.base">
    <!-- 模板自由；消费方传 data-size="small" 即获得局部小号档位 -->
</div>
```
