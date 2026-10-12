---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "AutoSpark"
  text: "响应式前端应用框架"
  tagline: 原生 HTML 模板，状态驱动界面，从状态到路由全内置——构建全功能响应式 SPA
  actions:
    - theme: brand
      text: 开始
      link: /zh/intro/get-started
    - theme: alt
      text: 特征与优势
      link: /zh/intro/features
    - theme: alt
      text: Github
      link: https://github.com/autosparkjs/autospark/

features:
  - icon: 🧬
    title: 一切随状态变
    details: 不止文本——表达式依赖、条件与列表结构、覆盖物显隐、表单校验、动作生命周期全部响应式，把「什么该随状态变」从应用代码里彻底拿掉
  - icon: ⚡
    title: 更新只花在刀刃上
    details: 路径订阅 + 微任务合并，状态变哪只 patch 哪，不重建子树、无虚拟 DOM 开销；焦点、滚动位置、未提交输入天然保留
  - icon: 🏷️
    title: 会写 HTML 就能上手
    details: 30+ 条指令加 {{ }} 插值，结构、样式、状态、事件、动作写在同一份 HTML 里，单文件信息密度高，无命令式 DOM 操作
  - icon: 📦
    title: 零构建开箱即用
    details: 浏览器原生 API 运行时编译，不依赖打包器与模板编译，一个 script 标签即可点亮任意 DOM，也能无缝嵌进现有页面
  - icon: 🛠️
    title: 基础能力全内置
    details: 对话框、抽屉、通知、tooltip、图标、表单、动画、虚拟列表做进框架本身——省去选型、装包与胶水代码，综合成本最低
  - icon: 🤝
    title: 能力之间免费联动
    details: 异步 action 自动广播 pending / resolved / rejected，配一个 x-loading 即得全局加载态；覆盖物的 visible 即唯一真相源，关闭自动回写
  - icon: 🤖
    title: AI 友好的封闭语法
    details: 指令注册表显式映射、可整表枚举，无第三方生态的组合正确性陷阱，模型改码幻觉空间小、diff 局部可预测
  - icon: 🔌
    title: 架构开放可扩展
    details: 自定义指令与内置指令平权，按 Compile / Runtime / Hybrid 三通道分流；组件、配置绑定、事件总线扩展通道齐备，复杂交互框架内闭环
  - icon: 🚀
    title: 一个框架跑通 SPA
    details: 状态、组件、动作、表单之外还内置客户端路由与主题系统，从数据到多页面应用不必东拼西凑
---

# 一个框架，搭建全功能响应式 SPA

AutoSpark 是一个**响应式前端应用框架**：以原生 HTML 为模板，在元素上书写 `x-*` 指令，把响应式状态绑定到 DOM。状态一变，界面自动更新——事件处理、表单校验、条件与列表渲染、组件化、路由、主题、转场动画，构建现代前端应用所需的能力它都具备。

```html
<div id="app">
  <p>你好，<span x-text="user.name"></span>！</p>
  <p>合计：<span x-text="order.price * order.count"></span> 元</p>
  <input x-model="user.name" />
  <button @click="rename">改名</button>
  <ul x-for="item of cart" :key="item.id">
    <li>{{ item.title }} × {{ item.count }}</li>
  </ul>
</div>

<script type="module">
  import { AutoSpark } from "autospark";

  new AutoSpark(
    document.getElementById("app"),
    {
      user: { name: "张三" },
      order: { price: 18, count: 3 },
      cart: [{ id: 1, title: "AutoSpark 手册", count: 2 }],
    },
    {
      actions: {
        rename() {
          this.globalState.user.name = "李四"; // 只有订阅了该路径的节点被 patch
        },
      },
    },
  );
</script>
```

## 从这里开始

- 第一次接触？看[快速入门](/zh/intro/get-started)从零搭一个 TODO 应用
- 想知道强在哪？看[特征与优势](/zh/intro/features)与[对比评测](/zh/intro/comparison)
- 上手开发？进入[指南](/zh/guide/initial)
- 查具体用法？浏览[指令参考](/zh/guide/directives/x-bind)
