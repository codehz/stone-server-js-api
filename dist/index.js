"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const AStream_1 = require("./AStream");
let base = process.env.STONE_SERVER_BASE || ".";
let direct = !!process.env.STONE_SERVER_DIRECT;
function setBase(path) {
    base = path;
}
exports.setBase = setBase;
function setDirect(op = true) {
    direct = op;
}
exports.setDirect = setDirect;
function makeStandardError(code, signal, log) {
    return { code, signal, log };
}
exports.TimeoutError = Symbol("timeout");
function doSpawn(name, params, stdio) {
    return direct
        ? child_process_1.spawn(`./dbus-api-${name}`, params, {
            cwd: base,
            stdio
        })
        : child_process_1.spawn("./wrapper", [`./dbus-api-${name}`, ...params], {
            cwd: base,
            stdio
        });
}
function readonly_api(name, { out, err, params = [], exit }) {
    const proc = doSpawn(name, params, ["ignore", "pipe", "pipe"]);
    proc.stdout.on("data", out);
    proc.stderr.on("data", err);
    proc.once("exit", (code, signal) => {
        if (exit)
            exit.call(proc, { code, signal });
        proc.stdout.destroy();
        proc.stderr.destroy();
    });
    return proc;
}
exports.readonly_api = readonly_api;
function oneway_api(name, { params, err, exit }) {
    const proc = doSpawn(name, params, ["ignore", "ignore", "pipe"]);
    proc.stderr.on("data", err);
    proc.once("exit", (code, signal) => {
        if (exit)
            exit.call(proc, { code, signal });
        proc.stderr.destroy();
    });
    return proc;
}
exports.oneway_api = oneway_api;
function fetch_userlist(timeout = 1000) {
    return new Promise((resolve, reject) => {
        let log = "";
        let done = false;
        let timer;
        const proc = readonly_api("userlist", {
            out(data) {
                if (done)
                    return;
                resolve(JSON.parse(data.toString("utf-8")));
                done = true;
                proc.kill("SIGKILL");
                if (timer)
                    clearTimeout(timer);
            },
            err(errinfo) {
                log += errinfo.toString("utf-8");
            },
            exit({ code, signal }) {
                if (!done)
                    reject(makeStandardError(code, signal, log));
            }
        });
        timer = setTimeout(() => {
            if (!done)
                proc.kill("SIGKILL");
        }, timeout);
    });
}
exports.fetch_userlist = fetch_userlist;
function procList(data) {
    return data
        .toString("utf-8")
        .split("\n")
        .filter(x => x)
        .map(x => JSON.parse(x));
}
function makeStandardMonitorFn(name) {
    return () => {
        const stream = AStream_1.makeAStream(() => { });
        let log = "";
        readonly_api(name, {
            out(data) {
                try {
                    stream.put(...procList(data));
                }
                catch (e) {
                    stream.fail(e);
                    this.kill("SIGKILL");
                }
            },
            err(info) {
                log += info.toString("utf-8");
            },
            exit({ code, signal }) {
                if (signal !== "SIGKILL")
                    stream.fail(makeStandardError(code, signal, log));
            }
        });
        return stream;
    };
}
exports.monitor_userlist = makeStandardMonitorFn("userlist");
exports.monitor_chat = makeStandardMonitorFn("chat");
exports.monitor_log = makeStandardMonitorFn("logger");
function send_chat(sender, message, timeout = 1000) {
    return new Promise((resolve, reject) => {
        let proc;
        const timer = setTimeout(() => {
            reject(exports.TimeoutError);
            if (proc)
                proc.kill("SIGKILL");
        }, timeout);
        let log = "";
        proc = oneway_api("chat-send", {
            params: [sender, message],
            err(info) {
                log += info.toString("utf-8");
            },
            exit({ code, signal }) {
                if (signal !== "SIGKILL") {
                    if (code === 0) {
                        clearTimeout(timer);
                        resolve();
                    }
                    else
                        reject(makeStandardError(code, signal, log));
                }
            }
        });
    });
}
exports.send_chat = send_chat;
function send_broadcast(message, timeout = 1000) {
    return new Promise((resolve, reject) => {
        let proc;
        const timer = setTimeout(() => {
            reject(exports.TimeoutError);
            if (proc)
                proc.kill("SIGKILL");
        }, timeout);
        let log = "";
        proc = oneway_api("chat-broadcast", {
            params: [message],
            err(info) {
                log += info.toString("utf-8");
            },
            exit({ code, signal }) {
                if (signal !== "SIGKILL") {
                    if (code === 0) {
                        clearTimeout(timer);
                        resolve();
                    }
                    else
                        reject(makeStandardError(code, signal, log));
                }
            }
        });
    });
}
exports.send_broadcast = send_broadcast;
function execute_command(sender, command, timeout = 1000) {
    return new Promise((resolve, reject) => {
        let proc;
        const timer = setTimeout(() => {
            reject(exports.TimeoutError);
            if (proc)
                proc.kill("SIGKILL");
        }, timeout);
        let log = "";
        let output = "";
        proc = readonly_api("command", {
            params: [sender, command],
            out(data) {
                output += data.toString("utf-8");
            },
            err(info) {
                log += info.toString("utf-8");
            },
            exit({ code, signal }) {
                if (signal !== "SIGKILL") {
                    if (code === 0) {
                        clearTimeout(timer);
                        resolve(output.trim());
                    }
                    else
                        reject(makeStandardError(code, signal, log));
                }
            }
        });
    });
}
exports.execute_command = execute_command;
function is_blacklist_add(p) {
    return ["add-uuid", "add-xuid", "add-name"].includes(p.type);
}
function is_blacklist_kick(p) {
    return ["kick-uuid", "kick-xuid", "kick-name"].includes(p.type);
}
function is_blacklist_del(p) {
    return ["del-uuid", "del-xuid"].includes(p.type);
}
function manage_blacklist(param, timeout = 1000) {
    let arr;
    if (is_blacklist_add(param) || is_blacklist_kick(param))
        arr = [param.type, param.id, param.reason];
    else if (is_blacklist_del(param))
        arr = [param.type, param.id];
    else
        return Promise.reject(new TypeError("blacklist"));
    return new Promise((resolve, reject) => {
        let proc;
        const timer = setTimeout(() => {
            reject(exports.TimeoutError);
            if (proc)
                proc.kill("SIGKILL");
        }, timeout);
        let log = "";
        proc = oneway_api("blacklist", {
            params: arr,
            err(info) {
                log += info.toString("utf-8");
            },
            exit({ code, signal }) {
                if (signal !== "SIGKILL") {
                    if (code === 0) {
                        clearTimeout(timer);
                        resolve();
                    }
                    else
                        reject(makeStandardError(code, signal, log));
                }
            }
        });
    });
}
exports.manage_blacklist = manage_blacklist;
//# sourceMappingURL=index.js.map