(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.countdown`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——本组件无宿主级变体外观，数值文本经 JS 通道直写内层元素（statistic
    同款纪律：绑定表达式不含组件 methods）。

    与 statistic 的边界（ADR-0024 statistic 边界声明的承接）：statistic 是静态数值
    展示（Intl 语言环境格式化，值由调用方给）；countdown 是时间衰减动态组件（内部
    驱动、随时间自走）——正交。样式复用 statistic 的数值排版语言：tabular-nums
    等宽数字 + 1.5em 大字重 + em 基准随 data-size 档位全跟随。

    计时引擎（ADR-0031 定夺）：真值恒为 deadline - Date.now()（mounted 时
    deadline = Date.now() + time）——tick 只触发重渲染不累积误差；递归 setTimeout
    每跳对齐 deadline 整秒边界（remain % 1000）：走秒无相位漂移、finish 在截止时刻
    精确触发。页面隐藏无须显式暂停：后台定时器被浏览器节流只影响刷新频率不影响
    正确性（真值是绝对时间，回页即正确）；visibilitychange 回页监听仅做一次即时
    重算 + finish 补触发（节流下 finish 至多迟到 1min，回页即时补发）。unmounted
    清理定时器与 document 监听（image-viewer 监听卫生同款纪律）。

    引擎边界实证（真浏览器发现）：methods this 上下文的 expando（this.timer =
    ...）在同类多实例间共享——deadline 被后挂载实例覆盖，全组件同值衰减（本件
    三实例同页全部跟随 60s 实例）。规避：per-instance 状态挂 this.el expando
    （化身宿主元素实例唯一，image-viewer 清理器同款纪律）；单测 happy-dom 下
    各用例独立 mount 未暴露此缺陷（多实例同挂才触发）。

    语域定夺（time 毫秒时长，非绝对时间戳）：time 变化即重启新一轮（验证码重发/
    秒杀补货一行接线）；绝对时刻场景调用方表达式 :time="deadline - Date.now()"。

    format token 模板：{d} 天（不补零）/ {h} 时 / {m} 分 / {s} 秒（补零两位）；模板
    含 {d} 时 {h} 为日内余时（0-23），不含时为总小时（可超 24）——antd 同款语义。
    token 替换走 split/join（零正则字面量——指令值正则规避纪律的延伸，机制通道
    script setup 内同守）。显示取整 Math.ceil（剩 59.95s 显示 60 秒——倒计时直觉）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——数值区字号以 em 标定（1.5em）随 data-size 档位全跟随；
     本件不在 data() 声明主题六键，内部变体属性亦禁用六个通道名 -->
<div class="asc-countdown" x-define="autospark.countdown" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            time: 0,   // 倒计时总时长（毫秒）：变化即重启新一轮（deadline 重算）；0 即刻归零 + finish
            format: "", // 格式模板：{d}{h}{m}{s} token（空 = "{h}:{m}:{s}" 时:分:秒）
        }),
        methods: {
            // 实例状态存取：挂宿主 el expando（this 上下文的 expando 在同类多实例间共享，
            // deadline/timer/finished 串台即全组件同值衰减——el 是化身宿主元素，实例唯一）
            deadline() { return this.el["_ascCdDeadline"] || 0; },
            setDeadline(v) { this.el["_ascCdDeadline"] = v; },
            timer() { return this.el["_ascCdTimer"] || 0; },
            setTimer(v) { this.el["_ascCdTimer"] = v; },
            finished() { return !!this.el["_ascCdFinished"]; },
            setFinished(v) { this.el["_ascCdFinished"] = v; },
            // 格式化：绝对 deadline 真值 → token 替换（split/join 零正则；补零两位 padStart）
            formatText() {
                const fmt = this.data.format || "{h}:{m}:{s}";
                const remain = Math.max(0, this.deadline() - Date.now());
                const totalSec = Math.ceil(remain / 1000); // ceil：剩 59.95s 显示 60 秒（倒计时直觉）
                const hasDay = fmt.indexOf("{d}") >= 0;
                const d = Math.floor(totalSec / 86400);
                // {h}：含 {d} 时为日内余时（0-23）；不含时为总小时（可超 24）——antd 同款语义
                const h = hasDay ? Math.floor((totalSec % 86400) / 3600) : Math.floor(totalSec / 3600);
                const m = Math.floor((totalSec % 3600) / 60);
                const s = totalSec % 60;
                const pad2 = (n) => String(n).padStart(2, "0");
                return fmt
                    .split("{d}").join(String(d))
                    .split("{h}").join(pad2(h))
                    .split("{m}").join(pad2(m))
                    .split("{s}").join(pad2(s));
            },
            // 数值文本直写（幂等：重算 + 覆写，watcher 同值重跑安全）
            syncValue() {
                const el = this.el.querySelector(".asc-countdown-value");
                if (el) el.textContent = this.formatText();
            },
            // 停表（清定时器，幂等）
            stop() {
                if (this.timer()) { clearTimeout(this.timer()); this.setTimer(0); }
            },
            // 归零事件：防重发标志守卫（tick 与 visibilitychange 补触发双通道只发一次）
            fireFinish() {
                if (this.finished()) return;
                this.setFinished(true);
                this.stop();
                this.syncValue(); // 归零渲染（全零形态）
                this.el.dispatchEvent(new CustomEvent("finish", { bubbles: true }));
            },
            // 递归走秒：每跳对齐 deadline 整秒边界（remain % 1000——相位无漂移、finish 精确）
            tickOn() {
                const remain = this.deadline() - Date.now();
                const delay = Math.min(1000, Math.max(16, remain % 1000 || 1000));
                this.setTimer(setTimeout(() => {
                    this.syncValue();
                    if (Date.now() >= this.deadline()) { this.fireFinish(); return; }
                    this.tickOn();
                }, delay));
            },
            // 启动新一轮：deadline 重算 + 立即渲染 + time<=0 即刻归零（合法边界非错误）
            start() {
                this.stop();
                this.setFinished(false);
                const ms = Number(this.data.time) || 0;
                this.setDeadline(Date.now() + ms);
                this.syncValue();
                if (ms <= 0) { this.fireFinish(); return; }
                this.tickOn();
            },
        },
        mounted() {
            this.start();
            // time 变化 = 重启新一轮（验证码重发/秒杀补货一行接线）；format 变化即时重排
            this.watch("time", () => this.start());
            this.watch("format", () => this.syncValue());

            // 回页补触发（节流免疫协议的收尾一环）：visibility visible 时即时重算，
            // 已过期则立即补 finish（后台节流下 finish 至多迟到 1min，回页即时补发）
            const onVis = () => {
                if (document.visibilityState === "visible" && !this.finished()) {
                    this.syncValue();
                    if (Date.now() >= this.deadline()) this.fireFinish();
                }
            };
            document.addEventListener("visibilitychange", onVis);

            // 监听卫生（document 级长命对象，防泄漏——image-viewer 同款纪律）：
            // 清理器落宿主 expando，unmounted 摘除
            this.el["_ascCountdownCleanup"] = () => {
                this.stop();
                document.removeEventListener("visibilitychange", onVis);
            };
        },
        unmounted() {
            // 宿主可能已拆——可选链静默通过
            this.el?.["_ascCountdownCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-countdown">
    .asc-countdown {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-countdown-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    /* 数值区：statistic 数值排版语言复用（ADR-0031 边界声明）——tabular-nums 等宽数字
       （走秒不跳宽）+ 1.5em 大字重 + em 基准随 data-size 档位全跟随 */
    .asc-countdown-value {
      display: inline-block;
      font-size: 1.5em;
      font-weight: var(--x-font-weight-large, 600); /* 语义层无大号字重变量，直取基础标尺 */
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
      color: var(--auto-color, var(--asc-countdown-value-color, #303030));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-countdown-value,
    [data-dark] .asc-countdown-value {
      color: var(--auto-color, var(--asc-countdown-value-color, #fafafa));
    }
  </style>
  <!-- 数值文本由 mounted + watch JS 直写（绑定表达式不含 methods 的引擎边界规避） -->
  <div class="asc-countdown-body">
    <span class="asc-countdown-value"></span>
  </div>
</div>
`}n();function n(){e(e=>{t(e)})}};
    if (AutoSpark === undefined) {
        // 插件先于引擎加载（engine ADR-0114）：入预加载队列，engine 构造 drain 时以命名空间回放
        var queue = (globalThis.__AUTOSPARK_PLUGINS__ ??= []);
        if (Object.isFrozen(queue)) {
            console.error("插件闭包: 预加载队列已消费且全局 AutoSpark 不可达，插件未注册");
            return;
        }
        queue.push(function (engine, ns) { run(ns); });
    } else {
        run(AutoSpark);
    }
})(globalThis.AutoSpark);

//# sourceMappingURL=autospark.countdown.js.map
