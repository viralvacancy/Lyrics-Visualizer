
/**
 * A simple concurrency limiter.
 * @param concurrency The maximum number of concurrent executions.
 * @returns A function that accepts a task (function returning a promise) and returns a promise that resolves when the task completes.
 */
export const limitConcurrency = (concurrency: number) => {
    const queue: { fn: () => Promise<any>; resolve: (value: any) => void; reject: (reason?: any) => void }[] = [];
    let activeCount = 0;

    const next = () => {
        activeCount--;
        if (queue.length > 0) {
            const { fn, resolve, reject } = queue.shift()!;
            run(fn, resolve, reject);
        }
    };

    const run = async (fn: () => Promise<any>, resolve: (value: any) => void, reject: (reason?: any) => void) => {
        activeCount++;
        try {
            const result = await fn();
            resolve(result);
        } catch (err) {
            reject(err);
        } finally {
            next();
        }
    };

    return <T>(fn: () => Promise<T>): Promise<T> => {
        return new Promise((resolve, reject) => {
            if (activeCount < concurrency) {
                run(fn, resolve, reject);
            } else {
                queue.push({ fn, resolve, reject });
            }
        });
    };
};
