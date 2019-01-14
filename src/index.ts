import { spawn, ChildProcess, StdioOptions } from "child_process";
import { AStream, makeAStream } from "./AStream";

let base = process.env.STONE_SERVER_BASE || ".";
let direct = !!process.env.STONE_SERVER_DIRECT;

export function setBase(path: string) {
  base = path;
}

export function setDirect(op: boolean = true) {
  direct = op;
}

export type gen_callback<T> = (this: ChildProcess, data: T) => void;
export interface StandardError {
  code: number | null;
  signal: string | null;
  log: string;
}
function makeStandardError(
  code: number | null,
  signal: string | null,
  log: string
): StandardError {
  return { code, signal, log };
}
export const TimeoutError = Symbol("timeout");

function doSpawn(
  name: string,
  params: string[],
  stdio: StdioOptions
): ChildProcess {
  return direct
    ? spawn(`./dbus-api-${name}`, params, {
        cwd: base,
        stdio
      })
    : spawn("./wrapper", [`./dbus-api-${name}`, ...params], {
        cwd: base,
        stdio
      });
}

export function readonly_api(
  name: string,
  {
    out,
    err,
    params = [],
    exit
  }: {
    out: gen_callback<Buffer>;
    err: gen_callback<Buffer>;
    params?: string[];
    exit?: gen_callback<{ code: number | null; signal: string | null }>;
  }
): ChildProcess {
  const proc = doSpawn(name, params, ["ignore", "pipe", "pipe"]);
  proc.stdout.on("data", out);
  proc.stderr.on("data", err);
  proc.once("exit", (code, signal) => {
    if (exit) exit.call(proc, { code, signal });
    proc.stdout.destroy();
    proc.stderr.destroy();
  });
  return proc;
}

export function oneway_api(
  name: string,
  {
    params,
    err,
    exit
  }: {
    params: string[];
    err: gen_callback<Buffer>;
    exit?: gen_callback<{ code: number | null; signal: string | null }>;
  }
): ChildProcess {
  const proc = doSpawn(name, params, ["ignore", "ignore", "pipe"]);
  proc.stderr.on("data", err);
  proc.once("exit", (code, signal) => {
    if (exit) exit.call(proc, { code, signal });
    proc.stderr.destroy();
  });
  return proc;
}

export interface User {
  name: string;
  uuid: string;
  xuid: string;
}

export interface Userlist {
  type: "list";
  size: number;
  list: Array<User>;
}

export interface UserEvent {
  type: "joined" | "left";
  target: User;
}

export function fetch_userlist(timeout: number = 1000): Promise<Userlist> {
  return new Promise<Userlist>((resolve, reject) => {
    let log = "";
    let done = false;
    let timer: NodeJS.Timeout;
    const proc = readonly_api("userlist", {
      out(data) {
        if (done) return;
        const parsed = JSON.parse(data.toString("utf-8"));
        if (parsed.type === "list") {
          resolve(parsed);
          done = true;
          proc.kill("SIGKILL");
          if (timer) clearTimeout(timer);
        }
      },
      err(errinfo) {
        log += errinfo.toString("utf-8");
      },
      exit({ code, signal }) {
        if (!done) reject(makeStandardError(code, signal, log));
      }
    });
    timer = setTimeout(() => {
      if (!done) proc.kill("SIGKILL");
    }, timeout);
  });
}

function procList<T>(data: Buffer): Array<T> {
  return data
    .toString("utf-8")
    .split("\n")
    .filter(x => x)
    .map(x => JSON.parse(x));
}

function makeStandardMonitorFn<T>(
  name: string
): () => AsyncIterableIterator<T> {
  return () => {
    const stream = makeAStream<T>(() => {});
    let log = "";
    readonly_api(name, {
      out(data) {
        try {
          stream.put(...procList<T>(data));
        } catch (e) {
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

export const monitor_userlist = makeStandardMonitorFn<Userlist | UserEvent>(
  "userlist"
);

interface ChatMessage {
  sender: string;
  content: string;
}

export const monitor_chat = makeStandardMonitorFn<ChatMessage>("chat");

export interface LogItem {
  level: number;
  tag: string;
  content: string;
}

export const monitor_log = makeStandardMonitorFn<LogItem>("logger");

export function send_chat(
  sender: string,
  message: string,
  timeout: number = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    let proc: ChildProcess;
    const timer = setTimeout(() => {
      reject(TimeoutError);
      if (proc) proc.kill("SIGKILL");
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
          } else reject(makeStandardError(code, signal, log));
        }
      }
    });
  });
}

export function send_broadcast(
  message: string,
  timeout: number = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    let proc: ChildProcess;
    const timer = setTimeout(() => {
      reject(TimeoutError);
      if (proc) proc.kill("SIGKILL");
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
          } else reject(makeStandardError(code, signal, log));
        }
      }
    });
  });
}

export function execute_command(
  sender: string,
  command: string,
  timeout: number = 1000
): Promise<string> {
  return new Promise((resolve, reject) => {
    let proc: ChildProcess;
    const timer = setTimeout(() => {
      reject(TimeoutError);
      if (proc) proc.kill("SIGKILL");
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
          } else reject(makeStandardError(code, signal, log));
        }
      }
    });
  });
}

export type blacklist_add = {
  type: "add-uuid" | "add-xuid" | "add-name";
  id: string;
  reason: string;
};

export type blacklist_kick = {
  type: "kick-uuid" | "kick-xuid" | "kick-name";
  id: string;
  reason: string;
};

export type blacklist_del = { type: "del-uuid" | "del-xuid"; id: string };

export type blacklist_param = blacklist_add | blacklist_kick | blacklist_del;

function is_blacklist_add(p: blacklist_param): p is blacklist_add {
  return ["add-uuid", "add-xuid", "add-name"].includes(p.type);
}
function is_blacklist_kick(p: blacklist_param): p is blacklist_add {
  return ["kick-uuid", "kick-xuid", "kick-name"].includes(p.type);
}
function is_blacklist_del(p: blacklist_param): p is blacklist_add {
  return ["del-uuid", "del-xuid"].includes(p.type);
}

export function manage_blacklist(
  param: blacklist_param,
  timeout: number = 1000
): Promise<void> {
  let arr: string[];
  if (is_blacklist_add(param) || is_blacklist_kick(param))
    arr = [param.type, param.id, param.reason];
  else if (is_blacklist_del(param)) arr = [param.type, param.id];
  else return Promise.reject(new TypeError("blacklist"));
  return new Promise((resolve, reject) => {
    let proc: ChildProcess;
    const timer = setTimeout(() => {
      reject(TimeoutError);
      if (proc) proc.kill("SIGKILL");
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
          } else reject(makeStandardError(code, signal, log));
        }
      }
    });
  });
}
