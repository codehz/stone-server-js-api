"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function defer() {
    const properties = {};
    const promise = new Promise((resolve, reject) => Object.assign(properties, { resolve, reject }));
    return Object.assign(promise, properties);
}
exports.defer = defer;
function makeAStream(stop, pre) {
    let xp = defer();
    let cache = void 0;
    async function* stream() {
        try {
            for (;;) {
                const value = await xp;
                if (!xp)
                    break;
                yield value;
                while (cache && cache.length > 0)
                    yield cache.shift();
                cache = void 0;
            }
        }
        finally {
            stop();
        }
    }
    return Object.assign(stream(), {
        async put(...inp) {
            for (const sig of inp) {
                const value = await Promise.resolve(sig);
                if (cache) {
                    cache.push(value);
                    if (pre && cache.length > 1)
                        cache.shift();
                    console.groupEnd();
                }
                else {
                    cache = [];
                    const p = xp;
                    xp = defer();
                    p.resolve(value);
                }
            }
        },
        fail(i) {
            xp.reject(i);
        }
    });
}
exports.makeAStream = makeAStream;
async function handleAStream(stream, handler) {
    for await (const it of stream)
        await handler(it);
}
exports.handleAStream = handleAStream;
//# sourceMappingURL=AStream.js.map