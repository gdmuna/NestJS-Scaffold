/**
 * 将一个 Promise 的错误与结果包装为 [err, res] 的形式，方便 async/await 的错误处理
 * 返回值约定：当发生错误时返回 `[Error, null]`，否则返回 `[null, T]`。
 *
 * 使用示例：
 * const [err, res] = await to(someAsyncFunction());
 */
export async function to<T = any>(
    promiseOrFn: Promise<T> | (() => Promise<T>)
): Promise<[Error | null, T | null]> {
    try {
        const result =
            typeof promiseOrFn === 'function'
                ? await (promiseOrFn as () => Promise<T>)()
                : await promiseOrFn;
        return [null, result];
    } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        return [err, null];
    }
}

export default to;
