"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBGPU_OP_RESOLVE_RULES = void 0;
const binaryOps = __importStar(require("./ops/binary-op"));
const conv_1 = require("./ops/conv");
const gemm_1 = require("./ops/gemm");
const matmul_1 = require("./ops/matmul");
const pool = __importStar(require("./ops/pool"));
const transpose_1 = require("./ops/transpose");
const unaryOps = __importStar(require("./ops/unary-op"));
exports.WEBGPU_OP_RESOLVE_RULES = new Map([
    ['Abs', [unaryOps.abs]],
    ['Acos', [unaryOps.acos]],
    ['Acosh', [unaryOps.acosh]],
    ['Add', [binaryOps.add]],
    ['Asin', [unaryOps.asin]],
    ['Asinh', [unaryOps.asinh]],
    ['Atan', [unaryOps.atan]],
    ['Atanh', [unaryOps.atanh]],
    // TODO: support new attributes for AveragePool-10
    ['AveragePool', [pool.averagePool, pool.parseAveragePoolAttributes]],
    ['Ceil', [unaryOps.ceil]],
    ['ClipV10', [unaryOps.clipV10]],
    ['Clip', [unaryOps.clip]],
    ['Conv', [conv_1.conv, conv_1.parseConvAttributes]],
    ['Cos', [unaryOps.cos]],
    ['Cosh', [unaryOps.cosh]],
    ['Div', [binaryOps.div]],
    ['Elu', [unaryOps.elu, unaryOps.parseAlphaAttributes]],
    ['Erf', [unaryOps.erf]],
    ['Exp', [unaryOps.exp]],
    ['Floor', [unaryOps.floor]],
    ['Gemm', [gemm_1.gemm, gemm_1.parseGemmAttributes]],
    ['GlobalAveragePool', [pool.globalAveragePool, pool.parseGlobalAveragePoolAttributes]],
    ['GlobalMaxPool', [pool.globalMaxPool, pool.parseGlobalMaxPoolAttributes]],
    ['LeakyRelu', [unaryOps.leakyRelu, unaryOps.parseAlphaAttributes]],
    ['MatMul', [matmul_1.matMul]],
    // TODO: support new attributes for MaxPool-8 and MaxPool-10
    ['MaxPool', [pool.maxPool, pool.parseMaxPoolAttributes]],
    ['Mul', [binaryOps.mul]],
    ['Neg', [unaryOps.neg]],
    ['Pow', [binaryOps.pow]],
    ['Reciprocal', [unaryOps.reciprocal]],
    ['Relu', [unaryOps.relu]],
    ['Sigmoid', [unaryOps.sigmoid]],
    ['Sin', [unaryOps.sin]],
    ['Sinh', [unaryOps.sinh]],
    ['Sqrt', [unaryOps.sqrt]],
    ['Sub', [binaryOps.sub]],
    ['Tan', [unaryOps.tan]],
    ['Tanh', [unaryOps.tanh]],
    ['ThresholdedRelu', [unaryOps.thresholdedRelu, unaryOps.parseAlphaAttributes]],
    ['Transpose', [transpose_1.transpose, transpose_1.parseTransposeAttributes]],
]);
//# sourceMappingURL=op-resolve-rules.js.map