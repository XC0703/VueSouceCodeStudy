/**
 * 编译模块用到的一些工具函数
 */

import { NodeTypes } from "./ast";

// 判断传入节点是否是静态的简单表达式节
export const isStaticExp = (p) => {
  return p.type === NodeTypes.SIMPLE_EXPRESSION && p.isStatic;
};

// 判断传入节点是否是文本节点或插值节点
export const isText = (node) => {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
};
