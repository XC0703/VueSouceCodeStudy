// 处理style
// 已经渲染到页面上{style：{color:'red'}}=>当前（新的）样式{style:{background:'green'，font-size:20px}}
export const patchStyle = (el, prev, next) => {
  const style = el.style;

  // 说明样式删除
  if (next === null) {
    el.removeAttribute("style");
  } else {
    // 如果是已经渲染的样式有某样式，但是新的样式没有，则要清除老的样式
    if (prev) {
      for (const key in prev) {
        if (next[key] === null) {
          style[key] = "";
        }
      }
    }
    // 如果是新的有，老的没有，则直接打点获取属性后覆盖
    for (const key in next) {
      style[key] = next[key];
    }
  }
};
