import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * 组件注册事件测试（ADR-0085）：`components/<名>/registered` 按名动态键 + retain 补发。
 *
 * 覆盖共识 8 项：
 * - 本地普通 x-define 注册即发事件（原不发）+ 晚订阅补发（retain）；
 * - 本地继承即时解析注册即发事件（「凡注册必发」不变量）；
 * - 本地「父在子后」文档序排水修复回归（原普通路径不排水、子永悬）；
 * - 同名覆盖重发（retain 只存最新，晚订阅者见最后一次载荷）；
 * - 全局 options.components 懒预编译首解析发事件（global=true）；
 * - default（无值 x-define）照常发 `components/default/registered`；
 * - 旧单数全局事件 component/registered 已移除（订阅永不触发）。
 */

/** 订阅事件收集载荷（retain 补发在 on() 内同步执行，无须等待） */
function collect(engine: any, type: string): any[] {
    const got: any[] = [];
    engine.on(type, (m: any) => {
        got.push(m?.payload ?? m);
    });
    return got;
}

describe("components/<名>/registered 注册事件（ADR-0085）", () => {
    test("本地普通 x-define 注册即发事件（原不发）：晚订阅 retain 补发、载荷 {name,global}", async () => {
        const { engine } = mount(
            `<div x-scope>
                <div x-define="card"><span>卡片</span></div>
            </div>`,
            {},
        );
        await nextTick();
        // 注册发生在编译期（mount 返回前）——订阅晚于注册，retain 应立即补发
        const got = collect(engine, "components/card/registered");
        expect(got.length).toBe(1);
        expect(got[0].name).toBe("card");
        expect(got[0].global).toBe(false);
        // 非同名事件不受影响：未注册名的 retain 不存在，订阅后为空
        expect(collect(engine, "components/other/registered").length).toBe(0);
    });

    test("本地继承即时解析注册即发事件（凡注册必发不变量）", async () => {
        const { engine } = mount(
            `<div x-scope>
                <div x-define="card"><span>父</span></div>
                <div x-define="order-card" x-define:inherit="card"><span>子</span></div>
            </div>`,
            {},
        );
        await nextTick();
        expect(collect(engine, "components/card/registered").length).toBe(1);
        const got = collect(engine, "components/order-card/registered");
        expect(got.length).toBe(1);
        expect(got[0].name).toBe("order-card");
    });

    test("本地父在子后文档序：子挂起后父经普通路径注册排水解锁（原不排水永悬，ADR-0085 修复）", async () => {
        // 子（inherit）在前：收集时父未就绪 → 挂起 pending；父（普通路径）在后：注册即排水重试子
        const { root, engine } = mount(
            `<div x-scope>
                <div x-define="order-card" x-define:inherit="card"><span>子</span></div>
                <div x-define="card"><span>父</span></div>
            </div>`,
            {},
        );
        await nextTick();
        const scope = engine.findScopeByEl(root.firstElementChild as HTMLElement);
        // 修复前：order-card 永悬（不注册）；修复后：父注册排水解锁子
        expect(scope!.getComponentDeclaration("order-card")).toBeTruthy();
        expect(scope!.getComponentDeclaration("card")).toBeTruthy();
        expect(collect(engine, "components/card/registered").length).toBe(1);
        expect(collect(engine, "components/order-card/registered").length).toBe(1);
    });

    test("同名覆盖重发：retain 只存最新，重复注册后晚订阅收到最后一次", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const live: any[] = [];
        engine.on("components/dup/registered", (m: any) => {
            live.push(m?.payload ?? m);
        });
        // 模拟两次注册（白盒调 helper——真实覆盖路径见 x-import 覆盖测试）
        (engine as any)._afterComponentRegistered("dup", false);
        (engine as any)._afterComponentRegistered("dup", true);
        expect(live.length).toBe(2); // 已订阅者每次都收到
        const late = collect(engine, "components/dup/registered");
        expect(late.length).toBe(1); // 晚订阅者只补发最后一条
        expect(late[0].global).toBe(true); // 且是最新载荷
    });

    test("全局 options.components 懒预编译首解析发事件（global=true），重复查找不重发", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div x-component:greet></div>
            </div>`,
            {},
            { components: { greet: "<div>hi</div>" } },
        );
        await nextTick();
        const got = collect(engine, "components/greet/registered");
        expect(got.length).toBe(1);
        expect(got[0].name).toBe("greet");
        expect(got[0].global).toBe(true);
        // 再次查找走缓存命中：不重发（retain 数量不变）
        engine.getComponentDeclaration(root.firstElementChild as HTMLElement, "greet");
        expect(collect(engine, "components/greet/registered").length).toBe(1);
    });

    test("default（无值 x-define）照常发 components/default/registered（无特判）", async () => {
        const { engine } = mount(
            `<div x-scope>
                <div x-define><span>默认组件</span></div>
            </div>`,
            {},
        );
        await nextTick();
        const got = collect(engine, "components/default/registered");
        expect(got.length).toBe(1);
        expect(got[0].name).toBe("default");
    });

    test("旧单数全局事件 component/registered 已移除：订阅后注册组件不触发", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        await nextTick();
        const legacy: any[] = [];
        engine.on("component/registered" as any, (m: any) => {
            legacy.push(m?.payload ?? m);
        });
        (engine as any)._afterComponentRegistered("fresh", false);
        expect(legacy.length).toBe(0); // 硬切：旧名无发射路径
        expect(collect(engine, "components/fresh/registered").length).toBe(1); // 新名照常
    });
});
