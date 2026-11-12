import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
// 插件自举（ADR-0136）：注册 autospark/locales scriptType + x-locales 指令 + ready 覆写翻译槽
import "../../modules/i18n";

/**
 * i18n 插件集成（ADR-0136）：字典三源收集（script / x-locales / options.i18n.messages）、
 * 查表回退链（全等 → 主子标签 → fallback → 键本身）、复数（位置 / $count 命名通道）、
 * `$.language` 响应式切换（t 绑定自动重渲染）。
 *
 * 降级面：未装插件时 script 块被引擎 scriptType 派发 transformer warn + 剪枝丢弃
 * （engine 既有行为，见 engine 侧 ADR-0132 测试），此处不重复覆盖。
 */
describe("i18n 插件（ADR-0136）", () => {
    test("script 块收集（顶层游离自动全局）+ t 翻译 + 复数（位置形态 clamp）", () => {
        const { root } = mount(
            `<div>
    <script type="autospark/locales">
    {
        "你好": { "en": "Hello", "ja": "こんにちは" },
        "我有{}辆车": { "en": ["I have no car", "I have one car", "I have {} cars"] }
    }
    </script>
    <span x-text="t('你好')"></span>
    <b x-text="t('我有{}辆车', 1)"></b>
    <i x-text="t('我有{}辆车', 5)"></i>
    <u x-text="t('我有{}辆车', 0)"></u>
</div>`,
            {},
            { i18n: { language: "en", default: "zh-CN" } } as any,
        );
        expect(root.querySelector("span")!.textContent).toBe("Hello");
        expect(root.querySelector("b")!.textContent).toBe("I have one car"); // 1 → 下标 1
        expect(root.querySelector("i")!.textContent).toBe("I have 5 cars"); // 5 → clamp 末项
        expect(root.querySelector("u")!.textContent).toBe("I have no car"); // 0 → 下标 0
    });

    test("x-locales 指令收集（Compile 静态求值一次）", () => {
        const { root } = mount(
            `<div x-locales="{ '再见': { 'en': 'Bye now' } }">
                <span x-text="t('再见')"></span>
            </div>`,
            {},
            { i18n: { language: "en" } } as any,
        );
        expect(root.querySelector("span")!.textContent).toBe("Bye now");
    });

    test("复数命名通道：$count 变量兼作复数选择器与插值", () => {
        const { root } = mount(
            `<div x-locales="{ '{name}有{$count}辆车': { 'en': ['{name} has {$count} car', '{name} has {$count} cars'] } }">
                <span x-text="t('{name}有{$count}辆车', { name: '张三', $count: 3 })"></span>
            </div>`,
            {},
            { i18n: { language: "en" } } as any,
        );
        expect(root.querySelector("span")!.textContent).toBe("张三 has 3 cars");
    });

    test("写 $.language 切换语言：t 绑定自动重渲染（依赖收集）", async () => {
        const { root, engine } = mount(
            `<div><span x-text="t('你好')"></span></div>`,
            {},
            {
                i18n: { language: "en", messages: { "你好": { en: "Hello", ja: "こんにちは" } } },
            } as any,
        );
        expect(root.querySelector("span")!.textContent).toBe("Hello");
        (engine.state as any).$.language = "ja";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("こんにちは");
    });

    test("回退链：language 主子标签命中 → fallback → 键本身", () => {
        const { root } = mount(
            `<div>
                <span x-text="t('你好')"></span>
                <b x-text="t('再见')"></b>
            </div>`,
            {},
            {
                i18n: {
                    language: "zh-TW", // 字典无 zh-TW/zh 键 → 主子标签 zh 命中 zh-CN
                    fallback: "en", // 你好已在前链命中；再见 zh 链耗尽 → fallback en 也未命中 → 键本身
                    messages: {
                        "你好": { "zh-CN": "你好呀" },
                        "再见": { fr: "Salut" },
                    },
                } as any,
            } as any,
        );
        expect(root.querySelector("span")!.textContent).toBe("你好呀");
        expect(root.querySelector("b")!.textContent).toBe("再见");
    });

    test("零配置：t 退化为恒等 + 插值（查表链为空不告警）", () => {
        const { root } = mount(`<div><span x-text="t('plain {}', 7)"></span></div>`, {});
        expect(root.querySelector("span")!.textContent).toBe("plain 7");
    });

    test("组件只内置两语言包，使用处 x-locales 注入第三语言（分层语言链外扩）", async () => {
        // 结构同构组件场景：内层 scope = 组件内置字典层（真实组件的内置 script 收集
        // 到组件实例 scope，与本内层 x-data 同构）；外层 x-locales = 使用处注入层。
        // 分层语言链：近层（组件）已有语言优先；近层缺的语言（zh-CN）由远层（使用处）补——
        // 同 key 同语言仍近层胜（就近覆盖不变）。
        const { root, engine } = mount(
            `<div x-locales='{ "保存": { "zh-CN": "保存更改" } }'>
                <div x-data="{ }">
                    <script type="autospark/locales">
                    { "保存": { "en": "Save", "ja": "保存する" } }
                    </script>
                    <button x-text="t('保存')"></button>
                </div>
            </div>`,
            {},
            { i18n: { language: "en", default: "zh-CN" } } as any,
        );
        const button = root.querySelector("button")!;
        // en：组件近层命中（近层优先）
        expect(button.textContent).toBe("Save");
        // 切 zh-CN：组件层语言链耗尽 → 外扩注入层命中 zh-CN
        (engine.state as any).$.language = "zh-CN";
        await nextTick();
        expect(button.textContent).toBe("保存更改");
        // 切 ja：组件近层已有 ja——近层优先（注入层未声明 ja）
        (engine.state as any).$.language = "ja";
        await nextTick();
        expect(button.textContent).toBe("保存する");
    });

    test("首渲染换血：ready 覆写槽后同步 refresh（首渲染不再停留兜底输出）", () => {
        const { root } = mount(
            `<div><span x-text="t('你好')"></span></div>`,
            {},
            { i18n: { language: "en", messages: { "你好": { en: "Hello" } } } } as any,
        );
        // mount 返回时构造已完成（ready + refresh 同步跑完）——若未换血，首渲染停留兜底原样
        expect(root.querySelector("span")!.textContent).toBe("Hello");
    });
});
