"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_DEBUG = exports.LOG = void 0;
const onnxruntime_common_1 = require("onnxruntime-common");
const wasm_common_1 = require("../wasm-common");
const logLevelPrefix = ['V', 'I', 'W', 'E', 'F'];
const doLog = (level, message) => {
    // eslint-disable-next-line no-console
    console.log(`[${logLevelPrefix[level]},${new Date().toISOString()}]${message}`);
};
/**
 * A simple logging utility to log messages to the console.
 */
const LOG = (logLevel, msg) => {
    const messageLevel = (0, wasm_common_1.logLevelStringToEnum)(logLevel);
    const configLevel = (0, wasm_common_1.logLevelStringToEnum)(onnxruntime_common_1.env.logLevel);
    if (messageLevel >= configLevel) {
        doLog(messageLevel, typeof msg === 'function' ? msg() : msg);
    }
};
exports.LOG = LOG;
/**
 * A simple logging utility to log messages to the console. Only logs when debug is enabled.
 */
const LOG_DEBUG = (...args) => {
    if (onnxruntime_common_1.env.debug) {
        (0, exports.LOG)(...args);
    }
};
exports.LOG_DEBUG = LOG_DEBUG;
//# sourceMappingURL=log.js.map