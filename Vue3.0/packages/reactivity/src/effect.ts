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
        fn(); // 执行用户的方法
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

  console.log(targetMap);
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
