"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTransferableBuffers = exports.endProfiling = exports.run = exports.releaseSession = exports.createSession = exports.createSessionFinalize = exports.createSessionAllocate = exports.initOrt = void 0;
const run_options_1 = require("./run-options");
const session_options_1 = require("./session-options");
const string_utils_1 = require("./string-utils");
const wasm_common_1 = require("./wasm-common");
const wasm_factory_1 = require("./wasm-factory");
/**
 * initialize ORT environment.
 * @param numThreads SetGlobalIntraOpNumThreads(numThreads)
 * @param loggingLevel CreateEnv(static_cast<OrtLoggingLevel>(logging_level))
 */
const initOrt = (numThreads, loggingLevel) => {
    const errorCode = (0, wasm_factory_1.getInstance)()._OrtInit(numThreads, loggingLevel);
    if (errorCode !== 0) {
        throw new Error(`Can't initialize onnxruntime. error code = ${errorCode}`);
    }
};
exports.initOrt = initOrt;
const activeSessions = new Map();
/**
 * create an instance of InferenceSession.
 * @returns the metadata of InferenceSession. 0-value handle for failure.
 */
const createSessionAllocate = (model) => {
    const wasm = (0, wasm_factory_1.getInstance)();
    const modelDataOffset = wasm._malloc(model.byteLength);
    wasm.HEAPU8.set(model, modelDataOffset);
    return [modelDataOffset, model.byteLength];
};
exports.createSessionAllocate = createSessionAllocate;
const createSessionFinalize = (modelData, options) => {
    const wasm = (0, wasm_factory_1.getInstance)();
    let sessionHandle = 0;
    let sessionOptionsHandle = 0;
    let allocs = [];
    try {
        [sessionOptionsHandle, allocs] = (0, session_options_1.setSessionOptions)(options);
        sessionHandle = wasm._OrtCreateSession(modelData[0], modelData[1], sessionOptionsHandle);
        if (sessionHandle === 0) {
            throw new Error('Can\'t create a session');
        }
    }
    finally {
        wasm._free(modelData[0]);
        if (sessionOptionsHandle !== 0) {
            wasm._OrtReleaseSessionOptions(sessionOptionsHandle);
        }
        allocs.forEach(wasm._free);
    }
    const inputCount = wasm._OrtGetInputCount(sessionHandle);
    const outputCount = wasm._OrtGetOutputCount(sessionHandle);
    const inputNames = [];
    const inputNamesUTF8Encoded = [];
    const outputNames = [];
    const outputNamesUTF8Encoded = [];
    for (let i = 0; i < inputCount; i++) {
        const name = wasm._OrtGetInputName(sessionHandle, i);
        if (name === 0) {
            throw new Error('Can\'t get an input name');
        }
        inputNamesUTF8Encoded.push(name);
        inputNames.push(wasm.UTF8ToString(name));
    }
    for (let i = 0; i < outputCount; i++) {
        const name = wasm._OrtGetOutputName(sessionHandle, i);
        if (name === 0) {
            throw new Error('Can\'t get an output name');
        }
        outputNamesUTF8Encoded.push(name);
        outputNames.push(wasm.UTF8ToString(name));
    }
    activeSessions.set(sessionHandle, [sessionHandle, inputNamesUTF8Encoded, outputNamesUTF8Encoded]);
    return [sessionHandle, inputNames, outputNames];
};
exports.createSessionFinalize = createSessionFinalize;
/**
 * create an instance of InferenceSession.
 * @returns the metadata of InferenceSession. 0-value handle for failure.
 */
const createSession = (model, options) => {
    const modelData = (0, exports.createSessionAllocate)(model);
    return (0, exports.createSessionFinalize)(modelData, options);
};
exports.createSession = createSession;
const releaseSession = (sessionId) => {
    const wasm = (0, wasm_factory_1.getInstance)();
    const session = activeSessions.get(sessionId);
    if (!session) {
        throw new Error('invalid session id');
    }
    const sessionHandle = session[0];
    const inputNamesUTF8Encoded = session[1];
    const outputNamesUTF8Encoded = session[2];
    inputNamesUTF8Encoded.forEach(wasm._OrtFree);
    outputNamesUTF8Encoded.forEach(wasm._OrtFree);
    wasm._OrtReleaseSession(sessionHandle);
    activeSessions.delete(sessionId);
};
exports.releaseSession = releaseSession;
/**
 * perform inference run
 */
const run = async (sessionId, inputIndices, inputs, outputIndices, options) => {
    const wasm = (0, wasm_factory_1.getInstance)();
    const session = activeSessions.get(sessionId);
    if (!session) {
        throw new Error('invalid session id');
    }
    const sessionHandle = session[0];
    const inputNamesUTF8Encoded = session[1];
    const outputNamesUTF8Encoded = session[2];
    const inputCount = inputIndices.length;
    const outputCount = outputIndices.length;
    let runOptionsHandle = 0;
    let runOptionsAllocs = [];
    const inputValues = [];
    const inputAllocs = [];
    try {
        [runOptionsHandle, runOptionsAllocs] = (0, run_options_1.setRunOptions)(options);
        // create input tensors
        for (let i = 0; i < inputCount; i++) {
            const dataType = inputs[i][0];
            const dims = inputs[i][1];
            const data = inputs[i][2];
            let dataOffset;
            let dataByteLength;
            if (Array.isArray(data)) {
                // string tensor
                dataByteLength = 4 * data.length;
                dataOffset = wasm._malloc(dataByteLength);
                inputAllocs.push(dataOffset);
                let dataIndex = dataOffset / 4;
                for (let i = 0; i < data.length; i++) {
                    if (typeof data[i] !== 'string') {
                        throw new TypeError(`tensor data at index ${i} is not a string`);
                    }
                    wasm.HEAPU32[dataIndex++] = (0, string_utils_1.allocWasmString)(data[i], inputAllocs);
                }
            }
            else {
                dataByteLength = data.byteLength;
                dataOffset = wasm._malloc(dataByteLength);
                inputAllocs.push(dataOffset);
                wasm.HEAPU8.set(new Uint8Array(data.buffer, data.byteOffset, dataByteLength), dataOffset);
            }
            const stack = wasm.stackSave();
            const dimsOffset = wasm.stackAlloc(4 * dims.length);
            try {
                let dimIndex = dimsOffset / 4;
                dims.forEach(d => wasm.HEAP32[dimIndex++] = d);
                const tensor = wasm._OrtCreateTensor((0, wasm_common_1.tensorDataTypeStringToEnum)(dataType), dataOffset, dataByteLength, dimsOffset, dims.length);
                if (tensor === 0) {
                    throw new Error('Can\'t create a tensor');
                }
                inputValues.push(tensor);
            }
            finally {
                wasm.stackRestore(stack);
            }
        }
        const beforeRunStack = wasm.stackSave();
        const inputValuesOffset = wasm.stackAlloc(inputCount * 4);
        const inputNamesOffset = wasm.stackAlloc(inputCount * 4);
        const outputValuesOffset = wasm.stackAlloc(outputCount * 4);
        const outputNamesOffset = wasm.stackAlloc(outputCount * 4);
        try {
            let inputValuesIndex = inputValuesOffset / 4;
            let inputNamesIndex = inputNamesOffset / 4;
            let outputValuesIndex = outputValuesOffset / 4;
            let outputNamesIndex = outputNamesOffset / 4;
            for (let i = 0; i < inputCount; i++) {
                wasm.HEAPU32[inputValuesIndex++] = inputValues[i];
                wasm.HEAPU32[inputNamesIndex++] = inputNamesUTF8Encoded[inputIndices[i]];
            }
            for (let i = 0; i < outputCount; i++) {
                wasm.HEAPU32[outputValuesIndex++] = 0;
                wasm.HEAPU32[outputNamesIndex++] = outputNamesUTF8Encoded[outputIndices[i]];
            }
            // support RunOptions
            let errorCode = wasm._OrtRun(sessionHandle, inputNamesOffset, inputValuesOffset, inputCount, outputNamesOffset, outputCount, outputValuesOffset, runOptionsHandle);
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const runPromise = wasm.jsepRunPromise;
            if (runPromise && typeof runPromise.then !== 'undefined') {
                errorCode = await runPromise;
            }
            const output = [];
            if (errorCode === 0) {
                for (let i = 0; i < outputCount; i++) {
                    const tensor = wasm.HEAPU32[outputValuesOffset / 4 + i];
                    const beforeGetTensorDataStack = wasm.stackSave();
                    // stack allocate 4 pointer value
                    const tensorDataOffset = wasm.stackAlloc(4 * 4);
                    let type, dataOffset = 0;
                    try {
                        errorCode = wasm._OrtGetTensorData(tensor, tensorDataOffset, tensorDataOffset + 4, tensorDataOffset + 8, tensorDataOffset + 12);
                        if (errorCode !== 0) {
                            throw new Error(`Can't access output tensor data. error code = ${errorCode}`);
                        }
                        let tensorDataIndex = tensorDataOffset / 4;
                        const dataType = wasm.HEAPU32[tensorDataIndex++];
                        dataOffset = wasm.HEAPU32[tensorDataIndex++];
                        const dimsOffset = wasm.HEAPU32[tensorDataIndex++];
                        const dimsLength = wasm.HEAPU32[tensorDataIndex++];
                        const dims = [];
                        for (let i = 0; i < dimsLength; i++) {
                            dims.push(wasm.HEAPU32[dimsOffset / 4 + i]);
                        }
                        wasm._OrtFree(dimsOffset);
                        const size = dims.length === 0 ? 1 : dims.reduce((a, b) => a * b);
                        type = (0, wasm_common_1.tensorDataTypeEnumToString)(dataType);
                        if (type === 'string') {
                            const stringData = [];
                            let dataIndex = dataOffset / 4;
                            for (let i = 0; i < size; i++) {
                                const offset = wasm.HEAPU32[dataIndex++];
                                const maxBytesToRead = i === size - 1 ? undefined : wasm.HEAPU32[dataIndex] - offset;
                                stringData.push(wasm.UTF8ToString(offset, maxBytesToRead));
                            }
                            output.push([type, dims, stringData]);
                        }
                        else {
                            const typedArrayConstructor = (0, wasm_common_1.tensorTypeToTypedArrayConstructor)(type);
                            const data = new typedArrayConstructor(size);
                            new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
                                .set(wasm.HEAPU8.subarray(dataOffset, dataOffset + data.byteLength));
                            output.push([type, dims, data]);
                        }
                    }
                    finally {
                        wasm.stackRestore(beforeGetTensorDataStack);
                        if (type === 'string' && dataOffset) {
                            wasm._free(dataOffset);
                        }
                        wasm._OrtReleaseTensor(tensor);
                    }
                }
            }
            if (errorCode === 0) {
                return output;
            }
            else {
                throw new Error(`failed to call OrtRun(). error code = ${errorCode}.`);
            }
        }
        finally {
            wasm.stackRestore(beforeRunStack);
        }
    }
    finally {
        inputValues.forEach(wasm._OrtReleaseTensor);
        inputAllocs.forEach(wasm._free);
        wasm._OrtReleaseRunOptions(runOptionsHandle);
        runOptionsAllocs.forEach(wasm._free);
    }
};
exports.run = run;
/**
 * end profiling
 */
const endProfiling = (sessionId) => {
    const wasm = (0, wasm_factory_1.getInstance)();
    const session = activeSessions.get(sessionId);
    if (!session) {
        throw new Error('invalid session id');
    }
    const sessionHandle = session[0];
    // profile file name is not used yet, but it must be freed.
    const profileFileName = wasm._OrtEndProfiling(sessionHandle);
    if (profileFileName === 0) {
        throw new Error('Can\'t get an profile file name');
    }
    wasm._OrtFree(profileFileName);
};
exports.endProfiling = endProfiling;
const extractTransferableBuffers = (tensors) => {
    const buffers = [];
    for (const tensor of tensors) {
        const data = tensor[2];
        if (!Array.isArray(data) && data.buffer) {
            buffers.push(data.buffer);
        }
    }
    return buffers;
};
exports.extractTransferableBuffers = extractTransferableBuffers;
//# sourceMappingURL=wasm-core-impl.js.map