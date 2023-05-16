"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShaderHelper = exports.createIndicesHelper = exports.WORKGROUP_SIZE = void 0;
const util_1 = require("../../util");
/**
 * constant value for a workgroup size.
 *
 * We definitely can do further optimization in future, but for now we use 64.
 *
 * rule of thumb: Use [a workgroup size of] 64 unless you know what GPU you are targeting or that your workload
 *                needs something different.
 *
 * from: https://surma.dev/things/webgpu/
 **/
exports.WORKGROUP_SIZE = 64;
const createIndicesHelper = (name, shape) => {
    const iType = shape.length < 2 ? 'u32' : `array<u32, ${shape.length}>`;
    const strides = util_1.ShapeUtil.computeStrides(shape);
    let o2iSnippet = '';
    for (let i = 0; i < shape.length - 1; i++) {
        o2iSnippet += `
    let dim${i} = current / ${strides[i]}u;
    let rest${i} = current % ${strides[i]}u;
    (*indices)[${i}] = dim${i};
    current = rest${i};
    `;
    }
    o2iSnippet += `(*indices)[${shape.length - 1}] = current;`;
    const o2iImpl = shape.length < 2 ? '' : `
  fn ih_o2i_${name}(offset: u32, indices: ptr<function, ${iType}>) {
    var current = offset;
    ${o2iSnippet}
  }`;
    const o2iCall = (varOffset, varIndices) => shape.length < 2 ? `${varIndices}=${varOffset};` : `ih_o2i_${name}(${varOffset}, &${varIndices});`;
    const offsets = [];
    if (shape.length === 0) {
        offsets.push('0u');
    }
    else if (shape.length < 2) {
        offsets.push('(*indices)');
    }
    else {
        for (let i = shape.length - 1; i >= 0; i--) {
            offsets.push(`${strides[i]}u * ((*indices)[${i}])`);
        }
    }
    const i2oImpl = shape.length < 2 ? '' : `
  fn ih_i2o_${name}(indices: ptr<function, ${iType}>) -> u32 {
    return ${offsets.join('+')};
  }`;
    const i2oExpression = (varIndices, isPtr) => shape.length < 2 ? `(${isPtr ? '*' : ''}${varIndices})` : `ih_i2o_${name}(${isPtr ? '' : '&'}${varIndices})`;
    const indicesVariableDeclaration = (v, init) => `var ${v}:${iType}${init ? `=${iType}(${init.join(',')})` : ''};`;
    return { o2iImpl, o2iCall, i2oImpl, i2oExpression, indicesVariableDeclaration, iType };
};
exports.createIndicesHelper = createIndicesHelper;
class ShaderHelperImpl {
    constructor(normalizedDispatchGroup) {
        this.normalizedDispatchGroup = normalizedDispatchGroup;
    }
    guardAgainstOutOfBoundsWorkgroupSizes(size) {
        // Guard against out-of-bounds work group sizes
        const sizeInCode = typeof size === 'number' ? `${size}u` : size;
        return `if (global_idx >= ${sizeInCode}) { return; }`;
    }
    mainStart(workgroupSize = exports.WORKGROUP_SIZE) {
        const workgroupSizeX = typeof workgroupSize === 'number' ? workgroupSize : workgroupSize[0];
        const workgroupSizeY = typeof workgroupSize === 'number' ? 1 : workgroupSize[1];
        const workgroupSizeZ = typeof workgroupSize === 'number' ? 1 : workgroupSize[2];
        const is1DimensionDispatch = this.normalizedDispatchGroup[1] === 1 && this.normalizedDispatchGroup[2] === 1;
        const paramList = is1DimensionDispatch ? '@builtin(global_invocation_id) global_id : vec3<u32>' :
            `@builtin(local_invocation_index) local_index : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>`;
        const globalIdxDefinition = is1DimensionDispatch ?
            'let global_idx = global_id.x;' :
            `let global_idx = (workgroup_id.z * ${this.normalizedDispatchGroup[0] * this.normalizedDispatchGroup[1]}u +
          workgroup_id.y * ${this.normalizedDispatchGroup[0]}u + workgroup_id.x) * ${workgroupSizeX * workgroupSizeY * workgroupSizeZ}u + local_index;`;
        return `@compute @workgroup_size(${workgroupSizeX}, ${workgroupSizeY}, ${workgroupSizeZ})
  fn main(${paramList}) {
    ${globalIdxDefinition}
  `;
    }
}
const createShaderHelper = (dispatchGroup) => new ShaderHelperImpl(dispatchGroup);
exports.createShaderHelper = createShaderHelper;
//# sourceMappingURL=common.js.map