export interface InjectStylesheetOptions {
    id?: string;
    location?: "head" | "body" | HTMLElement;
    mode?: "replace" | "append";
}
export declare function injectStylesheet(css: string, options?: InjectStylesheetOptions): string | undefined;
