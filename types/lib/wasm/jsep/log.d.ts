import { env } from 'onnxruntime-common';
type LogLevel = NonNullable<typeof env.logLevel>;
type MessageString = string;
type MessageFunction = () => string;
type Message = MessageString | MessageFunction;
/**
 * A simple logging utility to log messages to the console.
 */
export declare const LOG: (logLevel: LogLevel, msg: Message) => void;
/**
 * A simple logging utility to log messages to the console. Only logs when debug is enabled.
 */
export declare const LOG_DEBUG: typeof LOG;
export {};
