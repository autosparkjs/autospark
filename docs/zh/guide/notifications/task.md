# 任务

`task` 是**进度任务** type（内置语义 type）——返回 **Task 会话**（控制动词 + 进度方法的行为句柄）。**进度能力由 type='task' 提供（非通用通知功能）**——`progress` 是该 type 的专属键，其他 type 携带会被 warn + 忽略；推进也可走 `update(id, { progress: n })`。

## 用法

### 快捷方法

`task()` 返回 Task 会话——`progress(n)` 推进进度条、`complete()` 完成收场（自动模式创建即 running，无需显式 `start()`）：

```ts
const s = engine.notifications.task({ title: "下载 dataset.zip", closeWhenDone: 1200 });
for (const chunk of chunks) {
    await fetchChunk(chunk);      // 分块下载
    s.progress(pct);              // 实时推进
}
s.complete();                     // ≡ 进度 100 → 1.2s 后自动关
```

### factory 写法

全部逻辑在 factory 内：`return` 的初始 props **立即弹卡**，下载逻辑作为异步闭包继续驱动进度条；用户按下 停止 / 取消 / × 时 `session.abortSignal` 中断、`onStop` 等便捷订阅收到通知：

```ts
engine.notifications.task(async (session) => {
    void (async () => {                          // 下载闭包：不 await——让 return 先执行（卡先弹）
        for (const chunk of chunks) {
            await fetchChunk(chunk, session.abortSignal);  // 停止/取消/× 任一触发即中断
            session.progress(pct);               // 实时推进（session 激活后直接生效）
        }
        session.complete();                      // ≡ 进度 100 → closeWhenDone 后自动收
    })();
    return { title: "下载 dataset.zip", closeWhenDone: 1200, canStop: true, canCancel: true };
});
```

<demo html="notifications/quick-task.html"/>

## 进度任务

```ts
const upload = engine.notifications.show({
    title: "上传 report.pdf",
    type: "task",
    closeWhenDone: 2000, // 终态（完成/停止）后展示 2 秒再关（缺省 = 常驻；true = 即关）
});
upload.progress(30);    // 自动模式创建即 running——progress 直呼即推进
upload.pause();         // 闸门：pause 后 progress 调用被忽略
upload.resume();
upload.progress(100);   // 完成态——收口由 closeWhenDone 决定（见下）
// upload.stop();       // 停止：abort + 「已停止」终态留卡（进度定格）
// upload.cancel();     // 取消：abort + 立即关（不留结果）
```

- `progress(n)` clamp 到 [0,100]，仅 **running 态**生效（pending / paused / 终态忽略）；
- **任务态状态机** `state ∈ pending / running / paused / stopped / completed`（`upload.data.state` 直读）——旧 `paused / completed` 布尔已并入（ADR-0104）；cancel / close 不入状态机（它们的终态是卡片不可见，不是任务态）；
- 通用按钮走 `actions` 声明（按钮行随 shell 的 actions 出口渲染，见 [自定义](./custom.md#自定义卡片)）；task 四控制键启用时**预设模板自带控制钮**（见下）；
- **进行中不计时**（sticky，holdOpen 持卡）；**终态后默认常驻**——`delayClose` 对 task **彻底无效**（收口语义全在 `closeWhenDone`，ADR-0102/0104）；`cancel()` 立即关；
- 自定义渲染见 [自定义](./custom.md#自定义卡片)（接管 `task` type 时进度条与控制按钮随接管者自带）。

### 六控制动词

六控制动词（ADR-0104）——每动词 = 会话方法 + `actions/<动词>` 事件 + `on<动词>` 订阅便捷面，**方法与事件同源**（按钮点击与程序直调不可区分——外部可模拟用户操作）：

| 动词 | 方法语义 | 事件名 |
| --- | --- | --- |
| `start` | 手动门控启动（`canStart`：pending → running）；自动模式首次显示补发一次（纯观测） | `actions/start` |
| `pause` / `resume` | running ⇄ paused（pause 后 progress 被忽略） | `actions/pause` / `actions/resume` |
| `stop` | **abort +「已停止」终态留卡**（进度定格，closeWhenDone 对 stopped 同生效） | `actions/stop` |
| `cancel` | **abort + 立即隐藏**（不留结果） | `actions/cancel` |
| `close` | × 关闭：非终态先 abort——独立动词，「用户主动取消」与「只是关卡」可区分 | `actions/close` |

### 完成收口 closeWhenDone

**完成收口 `closeWhenDone`**（task 专属，宽松入参 `boolean | number`，默认 `false`，ADR-0102；**对 stopped 终态同样生效**，ADR-0104）：

| 值 | 终态后行为 |
| --- | --- |
| `false` / 缺省 | **常驻**——终态卡片 sticky 展示，`×` / `hide()` / `delete()` 手动收口 |
| `true` | 终态即关（组件直呼 `hide()`） |
| `number`（ms） | 终态 n 毫秒后收口——走引擎计时管道，**hover 暂停 / remaining 倒计时保留** |

终态时刻读值——终态后再 `update({ closeWhenDone: true })` 不追溯收口。

**× 点击语义（ADR-0104，修订 ADR-0102）**：关闭钮按 `close() → cancel() → 直关` 逐级派发——task 覆写 `close()` 为「**非终态先中断 `abortSignal` 再关**」：运行中的 task 点 × = abort + 关闭 + `actions/close` 事件；终态（完成/停止）仅关卡（不发无用 abort）。shell 无 close（× 走 cancel ≡ hide，既有行为零变化）；自定义 type 覆写 `close()` 即可获得独立 × 语义。

### 四控制键

**四控制键**（`canStart` / `canPause` / `canStop` / `canCancel`，task 专属；`canStart` / `canPause` / `canStop` 默认 `false`、**`canCancel` 默认 `true`**——取消是任务卡的基本出口）——启用后 task 预设模板自带**分立控制按钮**（显隐与「暂停 ↔ 恢复」文案由数据域响应式驱动、点击直调会话方法；终态自动收起）：

```ts
const download = engine.notifications.show({
    title: "下载 dataset.zip",
    type: "task",
    closeWhenDone: 1500,
    canStart: true,    // 手动门控：pending 态 + 「开始」按钮——点击才发 actions/start（progress 被门控）
    canPause: true,    // 「暂停 / 恢复」按钮（文案切换，pause() 闸门生效）
    canStop: true,     // 「停止」按钮（abort + 已停止终态留卡）
    canCancel: false,  // 缺省 true——不需要「取消」按钮时显式压制
});

// abortSignal 恒可用（与按钮开关解耦——信号是底层能力）——停止/取消/× 任一触发即中断：
const resp = await fetch(url, { signal: download.abortSignal });
try {
    await pump(resp, (n) => download.progress(n));
} catch (e) {
    if (e.name === "AbortError") download.update({ description: "已中止" });
}

// 控制订阅便捷面：onStart / onPause / onResume / onStop / onCancel / onClose——
// 返回退订函数，卡销毁自动清残留。也可直接订阅事件（动词与用户自定义 actions 同族）：
download.onStop(({ payload }) => console.log("已停止，进度定格于", payload.notification.data.progress));
engine.on("notifications/task/<id>/actions/cancel", ({ payload }) => { /* 用户主动取消 */ });
```

- 按钮行为 ≡ 会话方法——编程驱动与点击**同一实现、同发事件**（事件详见 [事件](./events.md)）；
- 内置动词 `start/pause/resume/stop/cancel/close` 是该卡 actions 命名空间的**事实保留名**——用户自定义 action 撞名 = 同义触发（责任自负）；
- **开始双模式**：缺省自动开跑（创建即 running，**首次显示时补发一次** `actions/start`——factory 闭包内挂的 `onStart` 不丢事件；重显不重发）；声明 `canStart` 转手动门控（pending 态等「开始」，progress 被门控）；
- 控制钮与**用户自定义 actions 共存**（各行排布）；用户 actions 照常走标准 `actions/<名>` 闭环（置已读 → 事件 → handle → hide 判定）。

## 场景演示

### 完整生命周期（自动模式 + 外部控制）

创建即 running（首次显示自动补发 `actions/start`）→ `progress` 推进 → `completed` 自动收口；页面按钮外部干预 `pause` 闸门 / `resume` / `stop` 留卡 / `cancel` 即关——与卡片自带控制钮**同源**（同样触发状态机与 `actions/<动词>` 事件）：

<demo html="notifications/task-lifecycle.html"/>

### 手动开始（canStart 门控）

`canStart: true`：卡片以 pending 态等待（呼吸条 + 「待启动」），进度被门控；点「开始」发 `actions/start`，宿主在 `onStart` 里才开跑：

<demo html="notifications/task-manual-start.html"/>

### 闭包内控制（factory + abortSignal）

factory 写法：`return` 初始 props 立即弹卡，下载闭包里 `session.onStop / onCancel / onClose` 响应用户手势、每分块检查 `session.abortSignal.aborted` 协作取消——停止 / 取消 / × 任一触发即中断：

<demo html="notifications/task-closure.html"/>

### 自定义 actions 与内置控制钮共存

用户按钮走标准 `actions/<名>` 闭环（置已读 → 事件 → handle → hide 判定），与内置 暂停/停止/取消 各行排布；`hide: false` 的 action 点击不关卡：

<demo html="notifications/task-actions.html"/>

### 停止 vs 取消

同进度（60%）下分别 `stop` / `cancel` 的语义分野：**停止** = abort + 「已停止」终态**留卡**（进度定格可查）；**取消** = abort + **立即隐藏**（不留结果）：

<demo html="notifications/task-stop-vs-cancel.html"/>

### 事件观测

总线通配订阅 `notifications/task/**`——verb（add/update/show/hide/…）与 `actions/*`（控制动词 + 用户按钮）全收：

<demo html="notifications/task-events.html"/>
