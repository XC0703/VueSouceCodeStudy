import { extend } from "@vue/shared";
// runtime-dom是用于操作dom（节点、属性）的模块
// 创建两个文件，分别用于处理节点nodeOps.ts与属性patchProp.ts
import { nodeOps } from "./nodeOps";
import { patchProps } from "./patchProp";

// Vue3的全部dom操作
const VueRuntimeDom = extend({ patchProps }, nodeOps);

export { VueRuntimeDom };
