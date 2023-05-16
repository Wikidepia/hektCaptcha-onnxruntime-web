"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConv2DMatMulProgramInfoLoader = void 0;
const types_1 = require("../types");
const conv2d_mm_webgpu_1 = require("./3rd-party/conv2d_mm_webgpu");
const createConv2DMatMulProgramMetadata = (hasBias, cacheHint) => ({
    name: 'Conv2DMatMul',
    inputTypes: hasBias ? [types_1.GpuDataType.default, types_1.GpuDataType.default, types_1.GpuDataType.default] :
        [types_1.GpuDataType.default, types_1.GpuDataType.default],
    cacheHint
});
const createConv2DMatMulProgramInfoLoader = (inputs, attributes, outputShape, dimAOuter, dimBOuter, dimInner, hasBias, sequentialAccessByThreads) => {
    const metadata = createConv2DMatMulProgramMetadata(hasBias, attributes.cacheKey);
    return {
        ...metadata,
        get: () => (0, conv2d_mm_webgpu_1.createConv2DMatMulProgramInfo)(inputs, metadata, attributes, outputShape, dimAOuter, dimBOuter, dimInner, hasBias, sequentialAccessByThreads)
    };
};
exports.createConv2DMatMulProgramInfoLoader = createConv2DMatMulProgramInfoLoader;
//# sourceMappingURL=conv2d-mm.js.map