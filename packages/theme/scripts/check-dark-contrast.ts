/**
 * 暗色/亮色对比度校准脚本（纯计算，无浏览器依赖，bun 直跑）
 *
 * 计算与变量表构建复用 contrast-lib.ts（与 bun test 防回归断言共享，保「与实现同源」：
 * 变量改动后两侧自动跟随）。边框族的防回归断言见 src/__tests__/border-contrast.test.ts。
 *
 * 用法：bun scripts/check-dark-contrast.ts   （任一 FAIL 退出码 1，可挂 CI）
 */
import { buildVars, contrast, resolveVar, type Mode } from "./contrast-lib";

/* --------------------------------- 检查项 --------------------------------- */

type Verdict = { label: string; mode: string; ratio: number; require: string; pass: boolean };

const results: Verdict[] = [];
/** light 侧基准值（供 dark 侧 ±20% 感知对称对照） */
const benchmarks = new Map<string, number>();

function check(opts: {
    label: string;
    mode: string;
    table: Record<string, string>;
    fg: string;
    bg: string;
    min?: number;
    benchmarkOf?: string; // 与 light 基准 ±20% 对称
    recordAs?: string; // 记录为基准（不判定）
}) {
    const { label, mode, table, fg, bg } = opts;
    const ratio = contrast(resolveVar(fg, table), resolveVar(bg, table), resolveVar(bg, table));
    let require: string;
    let pass: boolean;
    if (opts.recordAs) {
        benchmarks.set(opts.recordAs, ratio);
        require = "基准记录";
        pass = true;
    } else if (opts.benchmarkOf) {
        const ref = benchmarks.get(opts.benchmarkOf)!;
        require = `基准 ${ref.toFixed(2)} ±20%`;
        pass = ratio >= ref * 0.8 && ratio <= ref * 1.2;
    } else {
        require = `≥ ${opts.min}`;
        pass = ratio >= opts.min!;
    }
    results.push({ label, mode, ratio, require, pass });
}

const light = buildVars("light" as Mode, false);
const dark = buildVars("dark" as Mode, false);
const darkColorized = buildVars("dark" as Mode, true);

/* --- light：达标验证 + 基准记录 --- */
check({ label: "正文 / 面板", mode: "light", table: light, fg: "--auto-color", bg: "--auto-bgcolor", min: 4.5 });
check({ label: "次要文字 / 面板", mode: "light", table: light, fg: "--auto-secondary-color", bg: "--auto-bgcolor", min: 4.5 });
check({ label: "主色(theme-5) / 面板", mode: "light", table: light, fg: "--auto-theme-color", bg: "--auto-bgcolor", recordAs: "light-theme" });
check({ label: "hover 底 / 面板（感知基准）", mode: "light", table: light, fg: "--auto-hover-bgcolor", bg: "--auto-bgcolor", recordAs: "hover-bg" });
check({ label: "selected 底 / 面板（感知基准）", mode: "light", table: light, fg: "--auto-selected-bgcolor", bg: "--auto-bgcolor", recordAs: "selected-bg" });
check({ label: "边框 / 面板（基准）", mode: "light", table: light, fg: "--auto-border-color", bg: "--auto-bgcolor", recordAs: "border" });

/* --- dark：达标验证 + 与 light 对称 --- */
check({ label: "正文 / 面板", mode: "dark", table: dark, fg: "--auto-color", bg: "--auto-bgcolor", min: 4.5 });
check({ label: "次要文字 / 面板", mode: "dark", table: dark, fg: "--auto-secondary-color", bg: "--auto-bgcolor", min: 4.5 });
check({ label: "主色(theme-6) / 面板", mode: "dark", table: dark, fg: "--auto-theme-color", bg: "--auto-bgcolor", min: 4.5 });
check({ label: "hover 文字 / 面板", mode: "dark", table: dark, fg: "--auto-hover-color", bg: "--auto-bgcolor", min: 4.5 });
check({ label: "hover 底 / 面板", mode: "dark", table: dark, fg: "--auto-hover-bgcolor", bg: "--auto-bgcolor", benchmarkOf: "hover-bg" });
check({ label: "selected 底 / 面板", mode: "dark", table: dark, fg: "--auto-selected-bgcolor", bg: "--auto-bgcolor", benchmarkOf: "selected-bg" });
check({ label: "禁用文字 / 面板", mode: "dark", table: dark, fg: "--auto-disable-color", bg: "--auto-bgcolor", min: 3 });
check({ label: "边框(提档后) / 面板", mode: "dark", table: dark, fg: "--auto-border-color", bg: "--auto-bgcolor", min: 1.7 });
check({ label: "输入底(凹陷) / 面板（记录）", mode: "dark", table: dark, fg: "--auto-input-bgcolor", bg: "--auto-bgcolor", recordAs: "input-recessed" });
check({ label: "正文 / 工作区底", mode: "dark", table: dark, fg: "--auto-color", bg: "--auto-workspace-bgcolor", min: 4.5 });

/* --- dark：边框派生 vs 全背景语义（融合底线；次级底为半透明，自合成系宽容近似） --- */
check({ label: "边框 / 次级底", mode: "dark", table: dark, fg: "--auto-border-color", bg: "--auto-secondary-bgcolor", min: 1.05 });
check({ label: "边框 / 工作区底", mode: "dark", table: dark, fg: "--auto-border-color", bg: "--auto-workspace-bgcolor", min: 1.05 });
check({ label: "边框 / 输入底", mode: "dark", table: dark, fg: "--auto-border-color", bg: "--auto-input-bgcolor", min: 1.05 });

/* --- dark + colorized：多彩暗底 --- */
check({ label: "正文 / 面板", mode: "dark+colorized", table: darkColorized, fg: "--auto-color", bg: "--auto-bgcolor", min: 4.5 });
check({ label: "次要文字 / 面板", mode: "dark+colorized", table: darkColorized, fg: "--auto-secondary-color", bg: "--auto-bgcolor", min: 4.5 });
check({ label: "正文 / 工作区（theme-0 混黑）", mode: "dark+colorized", table: darkColorized, fg: "--auto-color", bg: "--auto-workspace-bgcolor", min: 4.5 });
check({ label: "面板浮起 / 工作区", mode: "dark+colorized", table: darkColorized, fg: "--auto-bgcolor", bg: "--auto-workspace-bgcolor", min: 1.2 });
/* 边框派生对彩色暗底自适应：面板 theme-0 混白恒错开（固定档方案的相邻档融合风险由派生消除） */
check({ label: "边框(派生) / 面板", mode: "dark+colorized", table: darkColorized, fg: "--auto-border-color", bg: "--auto-bgcolor", min: 1.7 });

/* --- 语义色 --- */
/* light 直引种子（既有现状，黄绿系白底物理限制普遍 <4.5，范围约定 light 不调，仅记录基准） */
for (const name of ["success", "warning", "danger", "info"]) {
    check({ label: `${name} / 面板`, mode: "light", table: light, fg: `--x-color-${name}`, bg: "--auto-bgcolor", recordAs: `light-sem-${name}` });
}
/* dark 提亮第 3 档（ADR-0002）：语义色作正文场景须达 AA */
for (const name of ["success", "warning", "danger", "info"]) {
    check({ label: `${name} / 面板`, mode: "dark", table: dark, fg: `--x-color-${name}`, bg: "--auto-bgcolor", min: 4.5 });
}

/* --------------------------------- 报告输出 --------------------------------- */

console.log("\n=== 对比度校准报告（blue 主题）===\n");
for (const r of results) {
    const flag = r.pass ? "PASS" : "FAIL";
    console.log(`${flag}  [${r.mode.padEnd(15)}] ${r.label.padEnd(18, "　")} ${r.ratio.toFixed(2).padStart(6)} : 1    要求: ${r.require}`);
}
const failed = results.filter((r) => !r.pass);
console.log(`\n共 ${results.length} 项，${failed.length} 项 FAIL`);
if (failed.length > 0) process.exit(1);
