import { css } from "lit";

export const styles = css`
    :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 24px;
        font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
            "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
        box-sizing: border-box;
    }

    :host([inline]) {
        width: auto;
        height: auto;
        min-width: 200px;
    }

    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        max-width: 400px;
    }

    .icon {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    .icon svg {
        width: 32px;
        height: 32px;
    }

    .icon.info {
        color: #ffffff;
        background-color: #3b82f6;
    }

    .icon.warn {
        color: #ffffff;
        background-color: #f59e0b;
    }

    .icon.error {
        color: #ffffff;
        background-color: #ef4444;
    }

    .icon.success {
        color: #ffffff;
        background-color: #22c55e;
    }

    .message {
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
        word-break: break-word;
    }

    .description {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 24px;
        line-height: 1.5;
        word-break: break-word;
    }

    .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .action-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #ffffff;
        color: #374151;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }

    .action-button:hover {
        background: #f9fafb;
        border-color: #9ca3af;
    }

    .action-button:active {
        background: #f3f4f6;
        transform: translateY(1px);
    }

    .action-button.primary {
        background: #3b82f6;
        color: #ffffff;
        border-color: #3b82f6;
    }

    .action-button.primary:hover {
        background: #2563eb;
        border-color: #2563eb;
    }

    .action-button svg {
        width: 16px;
        height: 16px;
    }
`;
