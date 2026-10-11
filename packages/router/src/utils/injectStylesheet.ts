import { getId } from "./getId";

export interface InjectStylesheetOptions {
    location?: "head" | "body" | HTMLElement;
    id?: string;
    // 默认仅当指定id的样式不存在时注入
    mode?: "replace" | "append" | "default";
}

export function injectStylesheet(css: string, options?: InjectStylesheetOptions) {
    if (typeof document === "undefined") return;

    const { id, mode = "default", location = "head" } = options || {};
    const finalId = id || getId();

    let style = document.querySelector(`#${finalId}`) as HTMLStyleElement;

    if (!style || style.tagName !== "STYLE") {
        style = document.createElement("style");
        style.id = finalId;

        const target =
            location === "head"
                ? document.head
                : location === "body"
                  ? document.body
                  : location instanceof HTMLElement
                    ? location
                    : document.head;

        target.appendChild(style);
    }

    if (mode === "replace") {
        style.textContent = css;
    } else if (mode === "append") {
        style.textContent += css;
    }

    return style;
}
