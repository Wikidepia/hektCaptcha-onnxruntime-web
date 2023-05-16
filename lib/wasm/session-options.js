"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSessionOptions = void 0;
const options_utils_1 = require("./options-utils");
const string_utils_1 = require("./string-utils");
const wasm_factory_1 = require("./wasm-factory");
const getGraphOptimzationLevel = (graphOptimizationLevel) => {
    switch (graphOptimizationLevel) {
        case 'disabled':
            return 0;
        case 'basic':
            return 1;
        case 'extended':
            return 2;
        case 'all':
            return 99;
        default:
            throw new Error(`unsupported graph optimization level: ${graphOptimizationLevel}`);
    }
};
const getExecutionMode = (executionMode) => {
    switch (executionMode) {
        case 'sequential':
            return 0;
        case 'parallel':
            return 1;
        default:
            throw new Error(`unsupported execution mode: ${executionMode}`);
    }
};
const appendDefaultOptions = (options) => {
    if (!options.extra) {
        options.extra = {};
    }
    if (!options.extra.session) {
        options.extra.session = {};
    }
    const session = options.extra.session;
    if (!session.use_ort_model_bytes_directly) {
        // eslint-disable-next-line camelcase
        session.use_ort_model_bytes_directly = '1';
    }
    // if using JSEP with WebGPU, always disable memory pattern
    if (options.executionProviders &&
        options.executionProviders.some(ep => (typeof ep === 'string' ? ep : ep.name) === 'webgpu')) {
        options.enableMemPattern = false;
    }
};
const setExecutionProviders = (sessionOptionsHandle, executionProviders, allocs) => {
    for (const ep of executionProviders) {
        let epName = typeof ep === 'string' ? ep : ep.name;
        // check EP name
        switch (epName) {
            case 'xnnpack':
                epName = 'XNNPACK';
                break;
            case 'webgpu':
                epName = 'JS';
                break;
            case 'wasm':
            case 'cpu':
                continue;
            default:
                throw new Error(`not supported EP: ${epName}`);
        }
        const epNameDataOffset = (0, string_utils_1.allocWasmString)(epName, allocs);
        if ((0, wasm_factory_1.getInstance)()._OrtAppendExecutionProvider(sessionOptionsHandle, epNameDataOffset) !== 0) {
            throw new Error(`Can't append execution provider: ${epName}`);
        }
    }
};
const setSessionOptions = (options) => {
    const wasm = (0, wasm_factory_1.getInstance)();
    let sessionOptionsHandle = 0;
    const allocs = [];
    const sessionOptions = options || {};
    appendDefaultOptions(sessionOptions);
    try {
        const graphOptimizationLevel = getGraphOptimzationLevel(sessionOptions.graphOptimizationLevel ?? 'all');
        const executionMode = getExecutionMode(sessionOptions.executionMode ?? 'sequential');
        const logIdDataOffset = typeof sessionOptions.logId === 'string' ? (0, string_utils_1.allocWasmString)(sessionOptions.logId, allocs) : 0;
        const logSeverityLevel = sessionOptions.logSeverityLevel ?? 2; // Default to 2 - warning
        if (!Number.isInteger(logSeverityLevel) || logSeverityLevel < 0 || logSeverityLevel > 4) {
            throw new Error(`log serverity level is not valid: ${logSeverityLevel}`);
        }
        const logVerbosityLevel = sessionOptions.logVerbosityLevel ?? 0; // Default to 0 - verbose
        if (!Number.isInteger(logVerbosityLevel) || logVerbosityLevel < 0 || logVerbosityLevel > 4) {
            throw new Error(`log verbosity level is not valid: ${logVerbosityLevel}`);
        }
        const optimizedModelFilePathOffset = typeof sessionOptions.optimizedModelFilePath === 'string' ?
            (0, string_utils_1.allocWasmString)(sessionOptions.optimizedModelFilePath, allocs) :
            0;
        sessionOptionsHandle = wasm._OrtCreateSessionOptions(graphOptimizationLevel, !!sessionOptions.enableCpuMemArena, !!sessionOptions.enableMemPattern, executionMode, !!sessionOptions.enableProfiling, 0, logIdDataOffset, logSeverityLevel, logVerbosityLevel, optimizedModelFilePathOffset);
        if (sessionOptionsHandle === 0) {
            throw new Error('Can\'t create session options');
        }
        if (sessionOptions.executionProviders) {
            setExecutionProviders(sessionOptionsHandle, sessionOptions.executionProviders, allocs);
        }
        if (sessionOptions.extra !== undefined) {
            (0, options_utils_1.iterateExtraOptions)(sessionOptions.extra, '', new WeakSet(), (key, value) => {
                const keyDataOffset = (0, string_utils_1.allocWasmString)(key, allocs);
                const valueDataOffset = (0, string_utils_1.allocWasmString)(value, allocs);
                if (wasm._OrtAddSessionConfigEntry(sessionOptionsHandle, keyDataOffset, valueDataOffset) !== 0) {
                    throw new Error(`Can't set a session config entry: ${key} - ${value}`);
                }
            });
        }
        return [sessionOptionsHandle, allocs];
    }
    catch (e) {
        if (sessionOptionsHandle !== 0) {
            wasm._OrtReleaseSessionOptions(sessionOptionsHandle);
        }
        allocs.forEach(wasm._free);
        throw e;
    }
};
exports.setSessionOptions = setSessionOptions;
//# sourceMappingURL=session-options.js.map