import { hasOwn } from "@vue/shared";

// 处理组件实例代理时的配置对象
export const componentPublicInstance = {
  // target即{ _: instance }
  get({ _: instance }, key) {
    // 获取值的时候返回正确的结果，如proxy.xxx==>proxy.props.xxx
    const { props, data, setupState } = instance;
    if (key[0] === "$") {
      // 表示该属性不能获取
      return;
    }
    if (hasOwn(props, key)) {
      return props[key];
    } else if (hasOwn(setupState, key)) {
      return setupState[key];
    }
  },
  set({ _: instance }, key, value) {
    const { props, data, setupState } = instance;

    if (hasOwn(props, key)) {
      props[key] = value;
    } else if (hasOwn(setupState, key)) {
      setupState[key] = value;
    }
  },
};
