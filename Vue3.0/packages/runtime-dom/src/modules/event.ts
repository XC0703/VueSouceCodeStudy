// 对事件的处理（注意，事件和样式类名自定义属性不一样，绑定不同的事件不能进行覆盖，如@click="fn1"、@click = "fn2"，因为addEventListener重复添加事件监听时，不能替换之前的监听，导致有多个监听同时存在
// 源码对这个处理使用了缓存，用一个map结构存储元素key上面绑定的元素
// 例子：假如当前要处理的元素el，已经绑定了@click="fn1"，现在可能要添加@click = "fn2"（情况1），也可能添加@hover = "fn3"（情况2），也可能添加@click = ""（情况3）

// el为元素，key是触发事件的方法，即事件名（如click），value为绑定的函数方法
export const patchEvent = (el, key, value) => {
  const invokers = el._vei || (el._vei = {}); // el._vei相当于一个元素的事件map缓存结构，可能为空{}。拿上面的例子来说的话，此时应该是{"click":{value:fn1}}
  const exists = invokers[key]; // 拿上面的例子来说的话，此时应该是 {value:fn1}
  if (exists && value) {
    // 不能进行覆盖（情况1）==>改变缓存中的value指向最新的事件即可，相当于改变exists的fn引用
    exists.value = value;
  } else {
    // 如果该触发方式还未绑定事件或者传入的函数为空，可能是新的绑定，也可能是清除事件
    const eventName = key.slice(2).toLowCase();
    if (value) {
      //  新的事件绑定，且将该绑定放入缓存器（情况2）
      let invoker = (invokers[eventName] = createInvoker(value)); // 返回一个包装后的函数
      el.addEventListener(eventName, invoker);
    } else {
      //  移除事件（情况3）
      el.removeEventListener(eventName, exists);
      invokers[eventName] = null;
    }
  }
};

function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e);
  };
  invoker.value = value;
  return invoker;
}
