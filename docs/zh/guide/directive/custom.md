# 自定义指令

所有内置指令都继承自 `AutoSparkDirectiveBase`。你可以编写自己的指令类，通过 `engine.directives.set(name, DirectiveClass)` 注册。自定义指令需声明静态元数据（`priority` / `kind` / `singleton`）并按通道实现生命周期钩子（`created` / `compile` / `destroy`，或运行时的 `mounted` / `unmounted`）。

::: info 进阶内容
自定义指令的开发细节（钩子契约、通道选择、选项消费）属于进阶主题，可在熟悉内置指令后参考源码 `src/directives/base.ts` 与内置指令实现。
:::

## 相关内容

- 指令名注册表、一条声明的组成、执行通道（编译时 / 运行时）见[指令](./index.md)
- 选项 / 修饰符 / 宿主选项的通用机制见[指令配置](./config.md)
- 内置指令参考见侧边栏「指令参考」，或从 [x-bind](../directives/x-bind.md) 开始
