import { isObject, extend } from "@vue/shared";
import { reactive, readonly } from "./reactivity";

// 定义每个api用的代理配置，用于数据劫持具体操作（get()、set()方法）
// 四个代理配置也是都用到get()、set()操作，因此又可以用柯里化高阶函数处理

// 代理-获取get()配置
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // proxy一般和Reflect反射使用，用于拿到目标对象中的某个属性
    const res = Reflect.get(target, key, receiver); // 相当于target[key]，但Reflect.get() 方法可以处理更复杂的情况

    // 判断
    if (!isReadonly) {
      // 不是只读
      // TODO：收集依赖
    }
    if (shallow) {
      // 如果只是浅层处理，直接返回浅层代理处理即可
      return res;
    }

    // 如果是一个对象，递归处理。
    // 这里有一个优化处理，判断子对象是否只读，防止没必要的代理，即懒代理处理。————面试题之一
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}
const get = createGetter(); // 不是只读，是深度代理
const shallowGet = createGetter(false, true); // 不是只读，是浅代理
const readonlyGet = createGetter(true, true); // 只读，深度
const shallowReadonlyGet = createGetter(true, true); // 只读，浅层

// 代理-获取set()配置
function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver); // 获取最新的值，相当于target[key] = value

    // TODO：触发更新
    return res;
  };
}
const set = createSetter();
const shallowSet = createSetter(true);

// 代理-readonly只读情况下的set()配置
const readonlyObj = {
  set: (target, key, value) => {
    console.warn(`set ${target} on key ${key} is failed`);
  },
};

export const reactiveHandlers = {
  get,
  set,
};
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
};
export const readonlyHandlers = extend(
  {
    get: readonlyGet,
  },
  readonlyObj
);
export const shallowReadonlyHandlers = extend(
  {
    get: shallowReadonlyGet,
  },
  readonlyObj
);
