import { isObject } from "@vue/shared";
export const shallowReadonlyHandlers = {};
import {
  reactiveHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
} from "./baseHandlers";

// 注意：四个api核心都是proxy（target,{})，因此采取柯里化高阶函数处理（柯里化指的是根据参数不同采取不同的处理，高阶函数指的是参数或者返回值为函数的函数）
// 四个api分为两种情况：（1）是不是只读；（2）是不是深层次处理。

// 定义一个数据结构用于存储已经代理的对象,// 用weakmap的好处：1、key必须是对象；2、自动的垃圾回收
const reactiveMap = new WeakMap();
const readonlyeMap = new WeakMap();

// 核心代理实现，baseHandlers用于每个api用的代理配置，用于数据劫持具体操作（get()、set()方法）
function createReactObj(target, isReadonly, baseHandlers) {
  // 1、首先要判断对象，这个是公共的方法，放到shared包中
  if (!isObject(target)) {
    return target;
  }
  // 2、核心--优化，已经被代理的对象不能重复代理，因此新建一个数据结构来存储
  const proxyMap = isReadonly ? readonlyeMap : reactiveMap;
  const proxyEs = proxyMap.get(target);
  if (proxyEs) {
    return proxyEs;
  }
  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}

export function reactive(target) {
  return createReactObj(target, false, reactiveHandlers);
}
export function shallowReactive(target) {
  return createReactObj(target, false, shallowReactiveHandlers);
}
export function readonly(target) {
  return createReactObj(target, true, readonlyHandlers);
}
export function shallowReadonly(target) {
  return createReactObj(target, true, shallowReadonlyHandlers);
}
