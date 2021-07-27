/// <reference types="node" />
export = ChromeDriver;
declare function ChromeDriver(host: any, port: any, nodePath: any, startTimeout: any, workingDirectory: any, chromeDriverLogPath: any): void;
declare class ChromeDriver {
    constructor(host: any, port: any, nodePath: any, startTimeout: any, workingDirectory: any, chromeDriverLogPath: any);
    host: any;
    port: any;
    nodePath: any;
    startTimeout: any;
    workingDirectory: any;
    chromeDriverLogPath: any;
    path: string;
    urlBase: string;
    statusUrl: string;
    logLines: any[];
    start(): Promise<void>;
    process: ChildProcess.ChildProcessWithoutNullStreams & ChildProcess.ChildProcessByStdio<import("stream").Writable, import("stream").Readable, import("stream").Readable> & ChildProcess.ChildProcessByStdio<import("stream").Writable, import("stream").Readable, null> & ChildProcess.ChildProcessByStdio<import("stream").Writable, null, import("stream").Readable> & ChildProcess.ChildProcessByStdio<null, import("stream").Readable, import("stream").Readable> & ChildProcess.ChildProcessByStdio<import("stream").Writable, null, null> & ChildProcess.ChildProcessByStdio<null, import("stream").Readable, null> & ChildProcess.ChildProcessByStdio<null, null, import("stream").Readable> & ChildProcess.ChildProcessByStdio<null, null, null> & ChildProcess.ChildProcess;
    exitHandler: () => void;
    waitUntilRunning(): Promise<void>;
    setupLogs(): void;
    getEnvironment(): {
        SPECTRON_NODE_PATH: string;
        SPECTRON_LAUNCHER_PATH: string;
    };
    stop(): void;
    isRunning(): Promise<any>;
    getLogs(): any[];
    clearLogs(): void;
}
import ChildProcess = require("child_process");
