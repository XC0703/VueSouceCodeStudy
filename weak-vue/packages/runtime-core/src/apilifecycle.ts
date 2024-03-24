import { currentInstance, setCurrentInstance } from "./component";

// 处理生命周期
const enum lifeCycle {
  BEFOREMOUNT = "bm",
  MOUNTED = "m",
  BEFOREUPDATE = "bu",
  UPDATED = "u",
}

// 常用的生命周期钩子——柯里化操作
export const onBeforeMount = createHook(lifeCycle.BEFOREMOUNT);
export const onMounted = createHook(lifeCycle.MOUNTED);
export const onBeforeUpdate = createHook(lifeCycle.BEFOREUPDATE);
export const onUpdated = createHook(lifeCycle.UPDATED);

// 创建生命周期钩子
function createHook(lifecycle: lifeCycle) {
  // 返回一个函数,这个函数接收两个参数，hook和target。hook是生命周期中的方法，target是当前组件实例
  return function (hook, target = currentInstance) {
    // 获取到当前组件的实例，然后和生命周期产生关联
    injectHook(lifecycle, hook, target);
  };
}

// 注入生命周期钩子
function injectHook(lifecycle: lifeCycle, hook, target = currentInstance) {
  //   console.log("当前组件实例：", target);
  // 注意：vue3.x中的生命周期都是在setup中使用的
  if (!target) {
    console.warn(`lifecycle: ${lifecycle} is used outside of setup`);
    return;
  }
  // 给这个实例添加生命周期
  const hooks = target[lifecycle] || (target[lifecycle] = []);

  // 注意：vue3.x中获取组件示例是通过getCurrentInstance()方法获取的
  // 为了可以在生命周期中获取到组件实例，vue3.x通过切片的手段实现（即函数劫持的思路，修改传入的hook，使得hook执行前设置当前组件实例到全局）
  const rap = () => {
    setCurrentInstance(target);
    hook(); // 执行生命周期钩子前存放一下当前组件实例
    setCurrentInstance(null);
  };

  hooks.push(rap);
}

// 生命周期的执行
export function invokeArrayFns(fns) {
  fns.forEach((fn) => fn());
}
