// 处理一些自定义的属性
export const patchAttr = (el, key, value) => {
  if (value === null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key);
  }
};
