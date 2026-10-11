/**
 * MurmurHash3 简化版
 * @param str
 * @param length
 * @returns
 */
export function quickHash(str: string, length: number = 12) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ char, 0x85ebca6b);
        h1 = (h1 << 13) | (h1 >>> 19);
        h2 = Math.imul(h2 ^ char, 0xc2b2ae35);
        h2 = (h2 << 7) | (h2 >>> 25);
    }

    let result = "";
    let seed = (h1 ^ h2) >>> 0;

    // 第一个字符特殊处理：确保是字母 a-z（36进制中10-35对应a-z）
    let firstCharValue = (seed % 26) + 10; // 映射到 10-35 (a-z)
    result += firstCharValue.toString(36);

    // 生成剩余字符（可以包含数字）
    while (result.length < length) {
        seed = Math.imul(seed, 0x9e3779b9);
        seed = (seed << 5) | (seed >>> 27);
        result += (seed >>> 0).toString(36);
    }

    return result.substring(0, length);
}
