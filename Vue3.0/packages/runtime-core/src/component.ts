import { isFunction, isObject, ShapeFlags } from "@vue/shared";
import { componentPublicInstance } from "./componentPublicInstance";

// 创建组件实例
export const createComponentInstance = (vnode) => {
  // instance本质是一个对象(包含组件的vnode，前面实现的组件的一些属性如参数props、自定义属性attrs，setup入口函数的状态等)
  const instance = {
    vnode,
    type: vnode.type, // 组件的所有属性都在这里面
    props: {}, // 组件的参数
    attrs: {}, // 自定义属性
    setupState: {}, // 用来存储setup入口函数的返回值
    ctx: {}, // 用来处理代理，保存实例的值，和下面的proxy一起用。没有这个会导致用类似instance.props.xxx才能获取属性，有了之后直接proxy.xxx便能直接获取了
    proxy: {}, // 和上面的ctx一起用
    render: false, // 存储组件实例的渲染函数
    isMounted: false, // 是否挂载
  };
  instance.ctx = { _: instance };
  return instance;
};

// 解析数据到该组件实例
export const setupComponet = (instance) => {
  // 代理
  instance.proxy = new Proxy(instance.ctx, componentPublicInstance as any);

  // 拿到值（上面instance的props等）
  const { props, children } = instance.vnode;
  // 把值设置到组件实例上
  instance.props = props;
  instance.children = children; // 相当于slot插槽
  // 看一下这个组件有无状态（有状态代表有setup入口函数或者render函数）
  const shapeFlag = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
  if (shapeFlag) {
    setupStateComponent(instance);
  } else {
    // 如果无状态，说明是简单组件，直接渲染即可。
  }
};

// 处理有状态的组件
function setupStateComponent(instance) {
  // 1、setup方法的返回值是我们的render函数的参数
  // 拿到组件的setup方法，其中我们可以知道：
  //    1、setup方法的参数是组件参数props、上下文对象context（包含了父组件传递下来的非 prop 属性attrs、可以用来触发父组件中绑定的事件函数emit、一个指向当前组件实例的引用root、用来获取插槽内容的函数slot等）
  //    2、setup方法的返回值可以是一个对象（包含代理的响应式属性以供渲染函数使用），也可以是直接返回渲染函数
  const Component = instance.type; // createVNode时传入给type的是rootComponent，本质是一个对象，组件的所有属性都在这里，比如setup方法，比如render方法
  const { setup } = Component;
  //  console.log(setup);
  //  setup();
  //  2、处理参数
  if (setup) {
    const setupContext = createContext(instance); // 返回一个上下文对象
    const setupResult = setup(instance.props, setupContext); // 实际执行的setup函数（实参）
    // setup返回值有两种情况：1、对象；2、函数==>根据不同情况进行处理
    handlerSetupResult(instance, setupResult); // 如果是对象，则将值放在instance.setupState；如果是函数，则就是render函数
  } else {
    // 没有setup则会有instance.type.render方法的（处理无setup有render的情况）
    finishComponentSetup(instance); // 通过vnode拿到render方法
  }

  // render(instance.proxy);
}

// 处理context上下文对象（包含了父组件传递下来的非 prop 属性attrs、可以用来触发父组件中绑定的事件函数emit、一个指向当前组件实例的引用root、用来获取插槽内容的函数slot等）
function createContext(instance) {
  return {
    sttrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expose: () => {},
  };
}

// 处理setup函数的返回结果
function handlerSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult; // 处理有setup且返回函数的情况==>没必要使用组件的render方法了
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult; // 处理有setup且返回对象的情况==>要使用组件的render方法了
  }

  // 最终也会走render（把render挂载到实例上去）
  finishComponentSetup(instance);
}

// 处理render（把render挂载到实例上去）
function finishComponentSetup(instance) {
  // 判断组件中有没有render方法，没有则
  const Component = instance.type; // createVNode时传入给type的是rootComponent，本质是一个对象，组件的所有属性都在这里，比如setup方法，比如render方法
  if (!instance.render) {
    // 这里的render指的是上面instance实例的render属性，在handlerSetupResult函数中会赋值（赋值的情况：组件有setup且返回函数），如果没有setup则此时会为false，则需要赋组件的render方法
    if (!Component.render && Component.template) {
      // TODO：模版编译
    }
    instance.render = Component.render;
  }
  // console.log(instance.render);
}
