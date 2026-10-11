export function triggerEvent(el: HTMLElement, eventName: string, detail?: any) {
    el.dispatchEvent(
        new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            composed: true,
        }),
    );
}
