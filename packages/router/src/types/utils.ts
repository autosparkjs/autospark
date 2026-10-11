export type ArrayItem<T extends any[]> = T extends (infer I)[] ? I : never;
