import { spawn, ChildProcess } from "child_process";
import { AStream, makeAStream } from "./AStream";
import * as path from "path";

const base = process.env.STONE_SERVER_BASE || path.join(__dirname, "..");

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

export function readonly_api(
  name: string,
  {
    out,
    err,
    exit
  }: {
    out: gen_callback<Buffer>;
    err: gen_callback<Buffer>;
    exit?: gen_callback<{ code: number | null; signal: string | null }>;
  }
): ChildProcess {
  const proc = spawn("./wrapper", [`./dbus-api-${name}`], {
    cwd: base,
    stdio: ["ignore", "pipe", "pipe"]
  });
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
  const proc = spawn("./wrapper", [`./dbus-api-${name}`, ...params], {
    cwd: base,
    stdio: ["ignore", "ignore", "pipe"]
  });
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
  size: number;
  list: Array<User>;
}

export function fetch_userlist(timeout: number = 1000): Promise<Userlist> {
  return new Promise<Userlist>((resolve, reject) => {
    let log = "";
    let done = false;
    let timer: NodeJS.Timeout;
    const proc = readonly_api("userlist", {
      out(data) {
        if (done) return;
        resolve(JSON.parse(data.toString("utf-8")));
        done = true;
        proc.kill("SIGKILL");
        if (timer) clearTimeout(timer);
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

export const monitor_userlist = makeStandardMonitorFn<Userlist>("userlist");

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
          if (code === 0) clearTimeout(timer);
          else reject(makeStandardError(code, signal, log));
        }
      }
    });
  });
}
