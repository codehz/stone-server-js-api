export declare function defer<T>(): Promise<T> & {
    resolve: (i?: T | PromiseLike<T>) => void;
    reject: (i: any) => void;
};
export declare type ReadOnlyAStream<T> = AsyncIterableIterator<T>;
export declare type WriteOnlyAStream<T> = {
    put: (...inp: Array<T | PromiseLike<T>>) => Promise<void>;
    fail: (i: any) => void;
};
export declare type AStream<T> = ReadOnlyAStream<T> & WriteOnlyAStream<T>;
export declare function makeAStream<T>(stop: () => void, pre?: boolean): AStream<T>;
export declare function handleAStream<T>(stream: ReadOnlyAStream<T>, handler: (inp: T) => void | PromiseLike<any>): Promise<void>;
