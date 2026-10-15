/**
 * 临时冒烟脚本（校验后删除）：把 docs/demos/theme 下的 demo 页逐个在 happy-dom 里跑一遍
 *
 * 校验点：
 * 1. 页面引用的 /autospark/* 静态资源真实存在于 docs/public；
 * 2. 运行时（autospark-theme.js）能启动：注入 -vars / -colors 样式标签并暴露 ThemePro；
 * 3. 切换主题色后 -colors 产物确实变化（算法真的在跑）；
 * 4. 页内每个 <theme-controls> 都完成升级并渲染出面板内容（groups 过滤生效）；
 * 5. 每个 [data-strip] 梯度条生成 10 个色块。
 */
import { Window } from "happy-dom";
import fs from "node:fs";
import path from "node:path";

const docsRoot = path.resolve(import.meta.dir, "../../docs");
const publicDir = path.join(docsRoot, "public");
const demoRoot = path.join(docsRoot, "demos/theme");

const assets = {
    "/autospark/autospark-theme.js": fs.readFileSync(
        path.join(publicDir, "autospark-theme.js"),
        "utf8",
    ),
    "/autospark/theme-controls.js": fs.readFileSync(
        path.join(publicDir, "theme-controls.js"),
        "utf8",
    ),
    "/autospark/theme-demo.js": fs.readFileSync(path.join(publicDir, "theme-demo.js"), "utf8"),
};

function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return entry.name.endsWith(".html") ? [full] : [];
    });
}

const failures: string[] = [];
const check = (file: string, ok: boolean, message: string) => {
    if (!ok) failures.push(`${path.relative(demoRoot, file)}: ${message}`);
};

const files = fs.existsSync(demoRoot) ? walk(demoRoot) : [];
if (files.length === 0) {
    console.error("未找到任何 demo 文件");
    process.exit(1);
}

for (const file of files) {
    const html = fs.readFileSync(file, "utf8");

    // 1) 静态资源引用必须存在
    for (const m of html.matchAll(/(?:src|href)="(\/autospark\/[^"]+)"/g)) {
        const url = m[1];
        if (url.startsWith("/autospark/api/")) continue;
        const rel = url.slice("/autospark/".length);
        check(file, fs.existsSync(path.join(publicDir, rel)), `引用的资源不存在：${url}`);
    }

    const window = new Window({ url: "https://example.com/demo" });
    const { document } = window;
    // happy-dom 不抓取外链脚本：剥掉外链标签后按顺序手动执行
    document.write(html.replace(/<script src="[^"]*"><\/script>/g, ""));

    try {
        for (const [url, code] of Object.entries(assets)) {
            if (!html.includes(url)) continue;
            window.eval(code);
        }
        // happy-dom 不执行文档内联脚本：按文档顺序手动执行（页面里的 addScope / 动态卡片都靠它们）
        for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
            window.eval(m[1]);
        }
        // 内联脚本可能在 enhance 之后新建了节点：再增强一次（enhance 自身幂等）
        (window as any).ThemeDemo?.enhance(document);
    } catch (error) {
        check(file, false, `脚本执行抛错：${(error as Error).message}`);
        continue;
    }

    const ThemePro = (window as any).ThemePro;
    check(file, !!ThemePro, "ThemePro 未挂载（themeRuntime 未启动）");

    const varsStyle = document.getElementById("autospark-root-vars");
    check(file, !!varsStyle, "缺少注入的 autospark-root-vars 样式标签");
    const varsCss = varsStyle?.innerHTML ?? "";
    check(file, varsCss.includes("--auto-border-radius"), "-vars 未包含派生层 --auto-border-radius");
    check(file, varsCss.includes("--x-plain-color-0"), "-vars 未包含灰方向别名 --x-plain-color-0");

    if (ThemePro) {
        const colorsBefore = document.getElementById("autospark-root-colors")?.innerHTML ?? "";
        check(file, colorsBefore.includes("--x-color-theme-9"), "-colors 未包含主题标尺");
        ThemePro.themeColor = "purple";
        const colorsAfter = document.getElementById("autospark-root-colors")?.innerHTML ?? "";
        check(file, colorsAfter !== colorsBefore, "切换主题色后 -colors 产物未变化");
        check(
            file,
            document.documentElement.getAttribute("data-theme") !== null,
            "切换主题色后 data-theme 属性未写入 root",
        );
    }

    for (const el of Array.from(
        document.querySelectorAll("theme-controls"),
    ) as unknown as HTMLElement[]) {
        const shadow = el.shadowRoot;
        check(file, !!shadow, "<theme-controls> 未升级出 shadowRoot");
        if (!shadow) continue;
        const inner = shadow.innerHTML;
        const groups = (el.getAttribute("groups") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const on = (g: string) => groups.length === 0 || groups.includes(g);
        check(file, on("color") === inner.includes('data-color="'), "面板主题色分组与 groups 不一致");
        check(file, on("mode") === inner.includes("data-switch"), "面板模式分组与 groups 不一致");
        check(
            file,
            on("radius") === inner.includes('data-size-key="radius"'),
            "面板圆角档位与 groups 不一致",
        );
    }

    const strips = Array.from(
        document.querySelectorAll("[data-strip]"),
    ) as unknown as HTMLElement[];
    for (const strip of strips) {
        const want = Number(strip.getAttribute("data-strip-count") || 10);
        check(
            file,
            strip.children.length === want,
            `梯度条未生成 ${want} 个色块（${strip.children.length}）`,
        );
    }
    // 只统计标记里的声明（内联脚本里也会出现 data-strip 字面量）
    const markup = html.replace(/<script>[\s\S]*?<\/script>/g, "");
    const declaredStrips = (markup.match(/data-strip="/g) || []).length;
    check(
        file,
        strips.length >= declaredStrips && (declaredStrips === 0 || strips.length > 0),
        `梯度条未全部生成（标记声明 ${declaredStrips} 个，实际生成 ${strips.length} 个）`,
    );

    window.close?.();
}

if (failures.length) {
    console.error(`✗ ${failures.length} 项校验失败：`);
    for (const f of failures) console.error("  - " + f);
    process.exit(1);
}
console.log(`✓ ${files.length} 个 demo 页全部通过（运行时 / 面板 / 梯度条 / 资源引用）`);
