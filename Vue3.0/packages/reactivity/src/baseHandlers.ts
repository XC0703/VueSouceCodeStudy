import {
  isObject,
  isArray,
  isIntegerKey,
  extend,
  hasOwn,
  hasChange,
} from "@vue/shared";
import { reactive, readonly } from "./reactivity";
import { TrackOpType, TriggerOpType } from "./operations";
import { Track, trigger } from "./effect";

// 定义每个api用的代理配置，用于数据劫持具体操作（get()、set()方法）
// 四个代理配置也是都用到get()、set()操作，因此又可以用柯里化高阶函数处理

// 代理-获取get()配置
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // proxy一般和Reflect反射使用，用于拿到目标对象中的某个属性
    const res = Reflect.get(target, key, receiver); // 相当于target[key]，但Reflect.get() 方法可以处理更复杂的情况

    // 判断
    if (!isReadonly) {
      // 不是只读则收集依赖（三个参数为代理的变量/对象，对该变量做的操作（增删改等），操作对应的属性）
      Track(target, TrackOpType.GET, key);
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
    // （1）获取老值
    const oldValue = target[key];

    // (2)判断target是数组还是对象，此时target已经是被代理过的对象了，所以要另写方法判断
    // 如果是数组，key的位置小于target.length，说明是修改值；如果是对象，则直接用hasOwn方法判断
    let hasKey = ((isArray(target) && isIntegerKey(key)) as unknown as boolean)
      ? Number(key) < target.length
      : hasOwn(target, key);

    // （3）设置新值
    const res = Reflect.set(target, key, value, receiver); // 获取最新的值，相当于target[key] = value，返回的res是布尔值，设置新值成功之后返回true

    // （4）触发更新
    if (!hasKey) {
      // 此时说明是新增
      trigger(target, TriggerOpType.ADD, key, value);
    } else if (hasChange(value, oldValue)) {
      // 修改的时候，要去判断新值和旧值是否相同
      trigger(target, TriggerOpType.SET, key, value, oldValue);
    }

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
