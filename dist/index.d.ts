/// <reference types="node" />
import { ChildProcess } from "child_process";
export declare function setBase(path: string): void;
export declare type gen_callback<T> = (this: ChildProcess, data: T) => void;
export interface StandardError {
    code: number | null;
    signal: string | null;
    log: string;
}
export declare const TimeoutError: unique symbol;
export declare function readonly_api(name: string, { out, err, exit }: {
    out: gen_callback<Buffer>;
    err: gen_callback<Buffer>;
    exit?: gen_callback<{
        code: number | null;
        signal: string | null;
    }>;
}): ChildProcess;
export declare function oneway_api(name: string, { params, err, exit }: {
    params: string[];
    err: gen_callback<Buffer>;
    exit?: gen_callback<{
        code: number | null;
        signal: string | null;
    }>;
}): ChildProcess;
export interface User {
    name: string;
    uuid: string;
    xuid: string;
}
export interface Userlist {
    size: number;
    list: Array<User>;
}
export declare function fetch_userlist(timeout?: number): Promise<Userlist>;
export declare const monitor_userlist: () => AsyncIterableIterator<Userlist>;
interface ChatMessage {
    sender: string;
    content: string;
}
export declare const monitor_chat: () => AsyncIterableIterator<ChatMessage>;
export interface LogItem {
    level: number;
    tag: string;
    content: string;
}
export declare const monitor_log: () => AsyncIterableIterator<LogItem>;
export declare function send_chat(sender: string, message: string, timeout?: number): Promise<void>;
export {};
