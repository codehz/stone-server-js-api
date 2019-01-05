export function defer<T>(): Promise<T> & {
  resolve: (i?: T | PromiseLike<T>) => void;
  reject: (i: any) => void;
} {
  const properties: {
    resolve?: (i?: T | PromiseLike<T>) => void;
    reject?: (i: any) => void;
  } = {};
  const promise = new Promise<T>((resolve, reject) =>
    Object.assign(properties, { resolve, reject })
  );
  return Object.assign(promise, properties) as Promise<T> & {
    resolve: (i?: T | PromiseLike<T>) => void;
    reject: (i: any) => void;
  };
}

export type ReadOnlyAStream<T> = AsyncIterableIterator<T>;

export type WriteOnlyAStream<T> = {
  put: (...inp: Array<T | PromiseLike<T>>) => Promise<void>;
  fail: (i: any) => void;
};

export type AStream<T> = ReadOnlyAStream<T> & WriteOnlyAStream<T>;

export function makeAStream<T>(stop: () => void, pre?: boolean): AStream<T> {
  let xp = defer<T>();
  let cache: void | T[] = void 0;
  async function* stream(): AsyncIterableIterator<T> {
    try {
      for (;;) {
        const value = await xp;
        if (!xp) break;
        yield value;
        while (cache && cache.length > 0) yield cache.shift()!;
        cache = void 0;
      }
    } finally {
      stop();
    }
  }
  return Object.assign(stream(), {
    async put(...inp: Array<T | PromiseLike<T>>) {
      for (const sig of inp) {
        const value = await Promise.resolve(sig);
        if (cache) {
          cache.push(value);
          if (pre && cache.length > 1) cache.shift();
          console.groupEnd();
        } else {
          cache = [];
          const p = xp;
          xp = defer<T>();
          p.resolve(value);
        }
      }
    },
    fail(i: any) {
      xp.reject(i);
    }
  });
}

export async function handleAStream<T>(
  stream: ReadOnlyAStream<T>,
  handler: (inp: T) => void | PromiseLike<any>
) {
  for await (const it of stream) await handler(it);
}
