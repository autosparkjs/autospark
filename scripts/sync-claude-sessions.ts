/**
 * Claude 会话转录双向同步（当前工程 .claude/sessions/ ↔ ~/.claude/projects/<slug>/）
 *
 * 用法：
 *   bun scripts/sync-claude-sessions.ts          # 默认仅同步今天有更新的会话
 *   bun scripts/sync-claude-sessions.ts --full   # 全量同步（新机器 clone 初始化等）
 *
 * 对参与文件的两侧比较（size + mtime）：
 *   - 仅一侧存在 → 复制到缺失侧（新会话归档 / 新机器 clone 后恢复）
 *   - 两侧一致   → 跳过
 *   - 两侧不同   → mtime 较新者胜（会话 jsonl 为 append-only，活跃侧必更新）；
 *                  毫秒级 mtime 相等时偏向 ~/.claude 侧（活跃真相源）
 *
 * 规则：
 *   - 默认仅处理今天（本地时区 0 点起）有任一侧更新的会话，其余计 filtered 略过；
 *     --full 取消日期过滤
 *   - 仅顶层 *.jsonl（会话转录本体）；UUID 子目录与 memory/ 不参与
 *   - 只增不删：任一侧多余的文件永不删除（源被清理后工程内副本永存）
 *   - 保留源文件时间戳（/resume 会话列表按 mtime 排序，往返幂等不扰动）
 *   - 目录缺失自动创建（首次运行 / 新机器 clone 后均零前置条件）
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, utimesSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const SESSIONS_DIR = path.join(ROOT, ".claude", "sessions");
// slug 以仓库根推导（而非调用时 cwd），在任意子目录执行均定位同一工程；
// 规则与 Claude Code 一致：路径中的 : \ / 一律替换为 -（E:\a\b → E--a-b）
const CLAUDE_DIR = path.join(
    os.homedir(),
    ".claude",
    "projects",
    ROOT.replace(/[:\\/]/g, "-"),
);

interface SideStat {
    size: number;
    atime: Date;
    mtime: Date;
}

/** 读取一侧文件的 size/mtime 快照；不存在或非普通文件返回 null */
function sideStat(p: string): SideStat | null {
    if (!existsSync(p)) return null;
    const st = statSync(p);
    if (!st.isFile()) return null;
    return { size: st.size, atime: st.atime, mtime: st.mtime };
}

const args = process.argv.slice(2);
const full = args.includes("--full");
if (args.some((a) => a !== "--full")) {
    console.error("用法: bun scripts/sync-claude-sessions.ts [--full]");
    process.exit(1);
}

mkdirSync(CLAUDE_DIR, { recursive: true });
mkdirSync(SESSIONS_DIR, { recursive: true });

// 「今天」= 本地时区 0 点起；默认模式据此过滤，--full 全量
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const counts = { copied: 0, overwritten: 0, skipped: 0, filtered: 0 };
const names = [...new Set([...readdirSync(CLAUDE_DIR), ...readdirSync(SESSIONS_DIR)])].sort();

for (const name of names) {
    if (!name.endsWith(".jsonl")) continue;
    const claudePath = path.join(CLAUDE_DIR, name);
    const sessPath = path.join(SESSIONS_DIR, name);
    const c = sideStat(claudePath);
    const s = sideStat(sessPath);
    if (!c && !s) continue;
    if (
        !full &&
        Math.max(c?.mtime.getTime() ?? 0, s?.mtime.getTime() ?? 0) < todayStart.getTime()
    ) {
        counts.filtered++;
        continue;
    }
    if (c && s && c.size === s.size && c.mtime.getTime() === s.mtime.getTime()) {
        console.log(`  IDENTICAL     ${name}`);
        counts.skipped++;
        continue;
    }
    // 冲突裁决：mtime 较新者胜；仅一侧存在时存在侧胜；毫秒级相等偏向 ~/.claude 侧
    const claudeWins = c != null && (s == null || c.mtime.getTime() >= s.mtime.getTime());
    const src = claudeWins ? claudePath : sessPath;
    const dst = claudeWins ? sessPath : claudePath;
    const dstExisted = claudeWins ? s != null : c != null;
    const st = statSync(src);
    copyFileSync(src, dst);
    // copyFileSync 不保留时间戳，显式回写以维持 /resume 列表顺序与判同稳定性
    utimesSync(dst, st.atime, st.mtime);
    const direction = claudeWins ? "claude → sessions" : "sessions → claude";
    console.log(`  ${(dstExisted ? "OVERWRITTEN" : "COPIED").padEnd(13)} ${name}  ${direction}`);
    counts[dstExisted ? "overwritten" : "copied"]++;
}

const total = counts.copied + counts.overwritten + counts.skipped;
console.log(
    `完成：共 ${total} 个会话文件（copied ${counts.copied} / overwritten ${counts.overwritten} / skipped ${counts.skipped}${full ? "" : ` / filtered ${counts.filtered}`}）`,
);
