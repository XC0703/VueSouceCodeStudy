import { isArray, isIntegerKey } from "@vue/shared";
import { TriggerOpType } from "./operations";

// 定义effect，本质是一个函数，第一个参数为函数，第二个参数为一个配置对象

let uid = 0;
let activeEffect; // 保存当前的effect
const effectStack = []; // 用一个栈来保存所有的effect

// 创建一个依赖收集器effect，并定义相关的属性。每个数据（变量）都有自己的effect。
function createReactEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      // 确保effect唯一性
      try {
        // 入栈
        effectStack.push(effect);
        activeEffect = effect;
        return fn(); // 执行用户的方法
      } finally {
        // 不管如何都会执行里面的方法
        // 出栈，将当前的effect改为栈顶
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.id = uid++; // 区分effect
  effect._isEffect = true; // 区分effect是不是响应式的effect
  effect.raw = fn; // 保存用户的方法
  effect.options = options; // 保存用户的effect配置
  activeEffect = effect;
  return effect;
}

// 收集依赖的操作（触发get()的时候，如果数据（变量）不是只读的，则触发Track，执行对应的依赖收集操作）
let targetMap = new WeakMap();
export function Track(target, type, key) {
  // console.log(`对象${target}的属性${key}涉及的effect为：`);
  // console.log(activeEffect); // 拿到当前的effect

  // key和我们的effect一一对应（map结构）
  if (activeEffect === undefined) {
    // 说明没有在effect中使用（变量不是响应式或者变量不存在）
    return;
  }
  // 获取对应的effect
  let depMap = targetMap.get(target);
  if (!depMap) {
    targetMap.set(target, (depMap = new Map()));
  }
  let dep = depMap.get(key);
  if (!dep) {
    // 没有属性
    depMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }

  // console.log(targetMap);
}

export function effect(fn, options: any = {}) {
  // 对于每个fn，都能创建自己的effect
  const effect = createReactEffect(fn, options);

  // 判断一下
  if (!options.lazy) {
    effect(); // 默认执行
  }
  return effect;
}

// 触发更新
export function trigger(target, type, key?, newValue?, oldValue?) {
  // console.log(target, type, key, newValue, oldValue);

  // 已经收集好的依赖，是target=>Map（key=>Set(n) {effect1, effect2, ..., effectn}）这种结构。
  // console.log(targetMap);

  // 获取对应的effect
  const depMap = targetMap.get(target);
  if (!depMap) {
    return;
  }

  // 不重复执行effect
  let effectSet = new Set();
  const addEffect = (effects) => {
    if (effects) {
      effects.forEach((effect) => effectSet.add(effect));
    }
  };

  // 对数组进行特殊处理，改变的key为length时(即直接修改数组的长度)时，要触发其它key的effect，否则其它key的effect不会被触发的，始终是旧的结果
  if (isArray(target) && key === "length") {
    depMap.forEach((dep, key) => {
      // 此时拿到depMap包含target对象所有key（包含'length'等属性以及所有下标'0'、'1'等等）的所有涉及effect
      // 如果下标key大于等于新的长度值，则要执行length的effect和超出length的那些key的effect（再去执行指的是比如刚开始拿到state.list[100]，
      // 现在将state.list.length直接改为1，重新触发state.list[100]这个语句，无法在内存中找到所以显示undefined）
      if (key === "length" || key >= newValue) {
        addEffect(dep);
      }
    });
  } else {
    // 数组或对象都会进行的正常操作
    if (key !== undefined) {
      const effects = depMap.get(key);
      addEffect(effects);
    }

    switch (type) {
      case TriggerOpType.ADD:
        // 针对的是通过下标给数组不存在的key赋值，从而改变数组的长度的情况，此时要额外触发"length"的effect
        if (isArray(target) && (isIntegerKey(key) as unknown as boolean)) {
          addEffect(depMap.get("length"));
        }
    }
  }

  effectSet.forEach((effect: any) => {
    if (effect.options.sch) {
      effect.options.sch(effect); // 用于实现computed计算属性的特性3，触发更新时使得this._dirty = true，以便执行computed里面的方法
    } else {
      effect();
    }
  });
}
