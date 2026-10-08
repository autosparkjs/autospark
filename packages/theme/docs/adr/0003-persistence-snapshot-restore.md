# localStorage 样式快照持久化与回访零闪恢复

主题 CSS 全部依赖运行时注入，回访用户首帧必然闪一次默认主题（首访 FOUC 本轮明确接受，静态层方案已在方案评估中否决）。引入持久化：**样式快照**（全部 scope 生成 CSS 的单字符串，存 `{storageKey}-styles`）+ **每 scope 参数持久化**（存 `{storageKey}-scope-{id}`，仅 themeColor/dark/colorized/size/radius/spacing/shadow 七个用户可感参数）。恢复由宿主粘贴的阻塞内联片段完成（读快照插入 `<style id="autospark-theme-restore">`）；运行时 `connect()` 先水合参数再注入，并在 root 接管后移除恢复标签。自愈策略：运行时每次注入变化都全量重写快照、不设版本号——过期快照的最坏结果是「JS 就绪前闪旧主题」，与无持久化现状等价，不值得为它引入版本机制。

## Considered Options

- **构建期预生成静态主题层**（首访也零闪）：本轮范围收敛为持久化，且静态层需要构建脚本与真值源分层约束改造（`styles/colors.less` 的「语义色不进静态层」约束要推翻），成本高一个量级；它也无法覆盖自定义主题色的恢复（快照可以）。
- **快照内嵌版本号 / 版本化 key**：运行时无条件重写已保证最终一致，版本机制只优化「升级后 JS 就绪前」的几秒窗口，复杂度不值。
- **运行时读 localStorage 恢复参数**（恢复片段只插样式）：localStorage 成为与 DOM 属性并列的第二事实源，需定优先级。改为片段插样式 + 运行时水合 DOM 语义，localStorage 只「片段读、运行时写」，DOM 属性保持运行时单一事实源。
- **JSON 信封 `{v, css, params}` 单 key**：样式与参数读写频率不同（样式每次注入变化全量重写，参数仅值变时写），分 key 更直白；原子性由「参数驱动样式」的写入顺序保证（参数先水合，样式重算必然一致）。

## Consequences

- `{storageKey}-styles` 与 `{storageKey}-scope-{id}` 的 key schema 成为发布后的公共接口（宿主恢复片段硬编码默认前缀 `autospark-theme`），改名即破坏性变更。
- 库升级若改变生成输出，回访用户会闪一次旧主题直到模块执行完成——自愈窗口，可接受。
- localStorage 只能被同源脚本改写，快照回插等同 SSR 快照的自我注入面，风险接受。
- iOS 隔离模式等 localStorage 不可写环境全部 try-catch 静默降级为无持久化。
- `persistence: false` 的 scope 照常注入渲染，仅不读写 localStorage、不参与快照合成。
- 注入内容去重（`_cssMap`）与快照写出去重（`_lastStylesSnapshot` / `_lastParamsJson`）把取色器拖动风暴与 MutationObserver 回环收敛为「值真变才写一次」；`disconnect()` 清空 `_cssMap` 是去重的失效补偿（标签已删，重连必须重注入）。
