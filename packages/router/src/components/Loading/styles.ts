// 原生 CSSStyleSheet（挂 Shadow DOM adoptedStyleSheets），替代 lit css 字面量
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
    :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px;
        font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
            "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    }
    .spinner {
        width: 32px;
        height: 32px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .message {
        margin-top: 12px;
        color: #666;
        font-size: 14px;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`);

export const styles: CSSStyleSheet = sheet;
