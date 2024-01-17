// 处理class
export const patchClass = (el, value) => {
  // 对这个标签的class赋值（如果没有赋值为空，如果有则直接打点获取属性后覆盖）
  if (value === null) {
    value = "";
  }
  el.className = value;
};
