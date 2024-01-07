/**
 * 定义一些公共的方法
 */

// 判断是否为对象
export const isObject = (target) =>
  typeof target === "object" && target !== null;

// 合并两个对象
export const extend = Object.assign;
