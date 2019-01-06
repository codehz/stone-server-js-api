/// <reference types="node" />
import { ChildProcess } from "child_process";
export declare function setBase(path: string): void;
export declare function setDirect(op?: boolean): void;
export declare type gen_callback<T> = (this: ChildProcess, data: T) => void;
export interface StandardError {
    code: number | null;
    signal: string | null;
    log: string;
}
export declare const TimeoutError: unique symbol;
export declare function readonly_api(name: string, { out, err, params, exit }: {
    out: gen_callback<Buffer>;
    err: gen_callback<Buffer>;
    params?: string[];
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
export declare function send_broadcast(message: string, timeout?: number): Promise<void>;
export declare function execute_command(sender: string, command: string, timeout?: number): Promise<string>;
export declare type blacklist_add = {
    type: "add-uuid" | "add-xuid" | "add-name";
    id: string;
    reason: string;
};
export declare type blacklist_kick = {
    type: "kick-uuid" | "kick-xuid" | "kick-name";
    id: string;
    reason: string;
};
export declare type blacklist_del = {
    type: "del-uuid" | "del-xuid";
    id: string;
};
export declare type blacklist_param = blacklist_add | blacklist_kick | blacklist_del;
export declare function manage_blacklist(param: blacklist_param, timeout?: number): Promise<void>;
export {};
