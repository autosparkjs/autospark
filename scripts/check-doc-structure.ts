/**
 * 指令文档结构校验（规范见 packages/engine/docs/specs/directive-doc-template.md）
 *
 * 校验 docs/zh/guide/directives/x-*.md 是否符合统一五段骨架：
 *
 *   # x-{name} {中文名}
 *   ## 概述
 *   ## 快速入门
 *   ## 指南
 *   ### 指令值            ← 指南首节固定为指令值（多形态用 #### 子标题）
 *   ### 特性…
 *   ## 配置选项           ← 可省略（无选项的指令）；存在时必须带统一四列表格
 *   ## 注意事项           ← 必有
 *
 * 用法：
 *   bun scripts/check-doc-structure.ts              # 校验全部（x-patch.md 除外）
 *   bun scripts/check-doc-structure.ts <文件...>     # 校验指定文件
 *
 * 错误（exit 1）：骨架不符。警告（不阻断）：待人工确认的 demo 缺口等。
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const DIR = path.join(ROOT, "docs", "zh", "guide", "directives");
/** 废弃迁移存根，不纳入统一骨架 */
const EXCLUDE = new Set(["x-patch.md"]);

const REQUIRED_H2 = ["概述", "快速入门", "指南", "注意事项"] as const;
const OPTIONAL_H2 = "配置选项";
const OPTION_TABLE_HEADER = ["配置项", "默认值", "修饰符", "说明"];
/** H1 标识允许点记号（x-for.paging / x-for.virtual 等修饰符形态） */
const H1_RE = /^# (x-[a-z]+(?:[-.][a-z]+)*) .+/;

interface FileReport {
    file: string;
    errors: string[];
    warnings: string[];
}

/** 去掉代码围栏内的行，避免把代码块里的 # / | 当标题与表格 */
function stripFences(lines: string[]): (string | null)[] {
    let inFence = false;
    return lines.map((line) => {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            return null;
        }
        return inFence ? null : line;
    });
}

function splitSections(
    lines: (string | null)[],
): { title: string; level: number; start: number; body: string[] }[] {
    const sections: { title: string; level: number; start: number; body: string[] }[] = [];
    let current: { title: string; level: number; start: number; body: string[] } | null = null;
    lines.forEach((line, i) => {
        const m = line !== null ? /^(#{1,6}) (.+?)\s*$/.exec(line) : null;
        if (m) {
            if (current) sections.push(current);
            current = { title: m[2], level: m[1].length, start: i, body: [] };
        } else if (current && line !== null) {
            current.body.push(line);
        }
    });
    if (current) sections.push(current);
    return sections;
}

function hasTableHeader(body: string[], cells: string[]): boolean {
    return body.some((line) => {
        const row = line
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim());
        return row.length === cells.length && row.every((c, i) => c === cells[i]);
    });
}

function hasDemoOrCode(body: string[]): boolean {
    return body.some((line) => line.includes("<demo") || /^\s*(```|~~~)/.test(line));
}

function checkFile(absPath: string): FileReport {
    const file = path.basename(absPath);
    const errors: string[] = [];
    const warnings: string[] = [];
    const raw = readFileSync(absPath, "utf8");
    const lines = raw.split(/\r?\n/);

    // 1. 不使用 frontmatter
    if (lines[0]?.trim() === "---") errors.push("存在 frontmatter（规范：不使用）");

    const stripped = stripFences(lines);
    const sections = splitSections(stripped);

    // 2. H1：唯一、置于文首、x-name + 中文名
    const h1s = sections.filter((s) => s.level === 1);
    if (h1s.length !== 1) errors.push(`H1 数量为 ${h1s.length}（应为 1）`);
    if (h1s[0] && !H1_RE.test(`# ${h1s[0].title}`))
        errors.push(`H1「${h1s[0].title}」不符合「x-{name} {中文名}」格式`);
    if (sections[0] && sections[0].level !== 1)
        errors.push(`文首不是 H1（实际为「${sections[0].title}」）`);

    // 3. H2 骨架：顺序固定，配置选项可省略
    const h2 = sections.filter((s) => s.level === 2).map((s) => s.title);
    const expected = [...REQUIRED_H2.slice(0, 3)];
    if (h2.includes(OPTIONAL_H2)) expected.push(OPTIONAL_H2);
    expected.push(REQUIRED_H2[3]);
    if (h2.join(" → ") !== expected.join(" → "))
        errors.push(`H2 骨架不符：实际[${h2.join(" → ")}]，期望[${expected.join(" → ")}]`);

    // 4. 指南首节固定为「指令值」
    const guide = sections.find((s) => s.level === 2 && s.title === "指南");
    if (guide) {
        const firstH3 = sections.find(
            (s) => s.level === 3 && s.start > (guide.start ?? 0),
        );
        // 指南之后的首个 H3 即指南首节（splitSections 扁平化，H3 不可能属于其他 H2）
        if (!firstH3 || firstH3.title !== "指令值")
            errors.push(`指南首节应为「指令值」（实际「${firstH3?.title ?? "无"}」）`);
    }

    // 5. 配置选项必须带统一四列表格
    const opt = sections.find((s) => s.level === 2 && s.title === OPTIONAL_H2);
    if (opt && !hasTableHeader(opt.body, OPTION_TABLE_HEADER))
        errors.push(`「配置选项」缺少表头 ${OPTION_TABLE_HEADER.join(" | ")}`);

    // 6. 警告：快速入门无 demo；特性节无 demo（纯论述型需人工确认例外）
    const quick = sections.find((s) => s.level === 2 && s.title === "快速入门");
    if (quick && !hasDemoOrCode(quick.body))
        warnings.push("快速入门缺少 <demo> 或代码示例");
    if (guide) {
        const guideIdx = sections.indexOf(guide);
        for (let i = guideIdx + 1; i < sections.length; i++) {
            const s = sections[i];
            if (s.level <= 2) break;
            if (s.level === 3 && s.title !== "指令值" && !hasDemoOrCode(s.body))
                warnings.push(`特性「${s.title}」无 <demo>（纯论述型请人工确认例外）`);
        }
    }

    return { file, errors, warnings };
}

function main() {
    const args = process.argv.slice(2);
    const files =
        args.length > 0
            ? args
            : readdirSync(DIR)
                  .filter((f) => f.startsWith("x-") && f.endsWith(".md") && !EXCLUDE.has(f))
                  .sort()
                  .map((f) => path.join(DIR, f));

    const reports = files.map((f) => checkFile(f));
    let errorCount = 0;
    let warningCount = 0;
    for (const r of reports) {
        if (r.errors.length === 0 && r.warnings.length === 0) {
            console.log(`PASS  ${r.file}`);
            continue;
        }
        for (const e of r.errors) {
            console.log(`ERROR ${r.file}: ${e}`);
            errorCount++;
        }
        for (const w of r.warnings) {
            console.log(`WARN  ${r.file}: ${w}`);
            warningCount++;
        }
    }
    console.log(
        `\n${reports.length} 个文件：${reports.length - reports.filter((r) => r.errors.length).length} 通过，${errorCount} 错误，${warningCount} 警告`,
    );
    if (errorCount > 0) process.exit(1);
}

main();
