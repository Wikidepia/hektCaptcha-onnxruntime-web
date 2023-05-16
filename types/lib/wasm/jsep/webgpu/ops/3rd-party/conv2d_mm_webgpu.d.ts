/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { TensorView } from '../../../tensor';
import { ProgramInfo, ProgramMetadata } from '../../types';
import { ConvAttributes } from '../conv';
export declare const createConv2DMatMulProgramInfo: (inputs: readonly TensorView[], metadata: ProgramMetadata, attributes: ConvAttributes, outputShape: readonly number[], dimAOuter: number, dimBOuter: number, dimInner: number, hasBias: boolean, sequentialAccessByThreads: boolean) => ProgramInfo;
