import { ShapeFlags } from "@vue/shared";
import { effect } from "@vue/reactivity";
import { apiCreateApp } from "./apiCreateApp";
import { createComponentInstance, setupComponet } from "./component";
import { CVnode, TEXT } from "./vnode";

// 实现渲染Vue3组件==>vnode==>render
export function createRender(renderOptionDom) {
  // 获取所有的dom操作
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProps: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = renderOptionDom;

  // 创建一个effect让render函数执行(响应式)
  const setupRenderEffect = (instance, container) => {
    // 创建effect(原理可以回前面的内容找)
    effect(function componentEffect() {
      // 判断是否是初次渲染
      if (!instance.isMounted) {
        // 获取到render返回值
        const proxy = instance.proxy; // 已经代理了组件，可以访问到组件的所有属性和所有方法
        // console.log("这是组件实例proxy：");
        // console.log(proxy);
        const subTree = instance.render.call(proxy, proxy); // render函数执行，即调用render函数，第一个参数表示render函数的this指向组件实例proxy，第二个参数表示执行render函数的参数也是proxy
        // console.log("h函数生成的vnode树：", subTree);
        instance.subTree = subTree; // 记得在实例上挂载vnode，方便后面更新时使用
        patch(null, subTree, container); // 渲染vnode（此时是元素的vnode）
        instance.isMounted = true;
      } else {
        // console.log("更新");
        // 对比新旧vnode--diff算法
        let proxy = instance.proxy;
        const prevVnode = instance.subTree; // 旧vnode，记得上面首次渲染在实例上挂载
        const nextVnode = instance.render.call(proxy, proxy); // 新vnode
        instance.subTree = nextVnode;
        patch(prevVnode, nextVnode, container); // 此时在patch方法中会对比新旧vnode，然后更新
      }
    });
  };

  /** ---------------处理组件--------------- */
  // 组件的创建方法（分为初次渲染和更新两种情况）
  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      // 组件第一次加载
      mountComponent(n2, container);
    } else {
      // 更新
    }
  };
  // 组件渲染的真正方法（实现由虚拟dom变成真实dom），步骤（核心）：
  const mountComponent = (InitialVnode, container) => {
    // 1、先有一个组件的实例对象（即Vue3组件渲染函数render传入的第一个参数proxy，其实proxy参数将组件定义的所有属性合并了，等效于在setup入口函数里面返回一个函数，可以用proxy.来获取属性）
    const instanece = (InitialVnode.component =
      createComponentInstance(InitialVnode)); // 记得在Vue3.0\packages\runtime-core\src\vnode.ts文件给vnode定义中加上这个属性
    // 2、解析数据到这个实例对象中
    setupComponet(instanece);
    // 3、创建一个effect让render函数执行
    setupRenderEffect(instanece, container);
  };

  /** ---------------处理元素--------------- */
  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      // 元素第一次挂载
      mountElement(n2, container);
    } else {
      // 更新
      // console.log("更新！！！");
      patchElement(n1, n2, container);
    }
  };
  // 元素的更新方法
  const patchElement = (n1, n2, container) => {
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // 1、对比属性
    let el = (n2.el = n1.el); // 获取真实dom
    patchProps(el, oldProps, newProps);
    // 2、对比子节点
    patchChildren(n1, n2, el);
  };
  // 对比属性有三种情况：
  // 1、新旧属性都有，但是值不一样
  // 2、旧属性有，新属性没有
  // 3、新属性有，旧属性没有
  const patchProps = (el, oldProps, newProps) => {
    if (oldProps !== newProps) {
      // 1、新旧属性都有，但是值不一样
      for (const key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next); // 替换属性
        }
      }
      // 2、新属性有，旧属性没有
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null); // 删除属性
        }
      }
      // 3、旧属性有，新属性没有
      for (const key in newProps) {
        if (!(key in oldProps)) {
          hostPatchProp(el, key, null, newProps[key]); // 新增属性
        }
      }
    }
  };
  // 对比子节点有四种情况：
  // 1、旧的有子节点，新的没有子节点
  // 2、旧的没有子节点，新的有子节点
  // 3、旧的有子节点，新的也有子节点，但是是文本节点（最简单的情况）
  // 4、旧的有子节点，新的也有子节点，但是可能是数组
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const newShapeFlag = n2.shapeFlag;
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新的是文本节点，直接替换
      if (c2 !== c1) {
        hostSetElementText(el, c2);
      }
    } else {
      // 新的是数组，此时要判断旧的
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 旧的也是数组（较复杂）
        patchKeyChildren(c1, c2, el);
      } else {
        // 旧的是文本节点，将文本节点清空，然后再将新的节点进行渲染
        hostSetElementText(el, "");
        mountChildren(el, c2);
      }
    }
  };
  // TODO：对比数组子节点
  const patchKeyChildren = (c1, c2, el) => {};
  // 元素的渲染方法
  const mountElement = (vnode, container) => {
    // 递归渲染子节点==>dom操作==》挂载到container/页面上
    const { shapeFlag, props, type, children } = vnode;
    // 1、创建元素--记得把真实dom挂载到vnode上，方便后面更新时使用
    let el = (vnode.el = hostCreateElement(type));
    // 2、创建元素的属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 3、处理children
    if (children) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // console.log("这是文本字符串形式子节点：", children);
        hostSetElementText(el, children); // 文本形式子节点，比如这种情况：h('div',{},'张三')，将children直接插入到el中
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 递归渲染子节点
        // console.log("这是数组形式子节点：", children);
        mountChildren(el, children); // 数组形式子节点，比如这种情况：h('div',{},['张三',h('p',{},'李四')])，将children递归渲染插入到el中
      }
    }
    // 4、放入到对应的容器中
    hostInsert(el, container);
  };
  // 递归渲染子节点
  const mountChildren = (container, children) => {
    for (let i = 0; i < children.length; i++) {
      // children[i]两种情况：1、['张三']这种元素，字符串的形式；2、h('div',{},'张三')这种元素，对象的形式（vnode）
      // 但两种情况都需要转换成vnode来处理，方便借助patch函数来渲染
      const child = CVnode(children[i]); // 第一种情况转换成vnode
      // 递归渲染子节点（vnode包含了元素、组件、文本三种情况）
      patch(null, child, container);
    }
  };

  /** ---------------处理文本--------------- */
  const processTxt = (n1, n2, container) => {
    if (n1 === null) {
      // 创建文本==>直接渲染到页面中（变成真实dom==>插入）
      hostInsert(hostCreateText(n2.children), container);
    } else {
      // 更新
    }
  };

  /**---------------------------------------------------------- */
  // 判断是否是同一个元素
  const isSameVnode = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };
  // 卸载老的元素
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  // patch函数负责根据vnode的不同情况（组件、元素、文本）来实现对应的渲染
  const patch = (n1, n2, container) => {
    // diff算法
    // 1、判断是不是同一个元素
    // console.log("n1:", n1, "n2:", n2);
    if (n1 && n2 && !isSameVnode(n1, n2)) {
      // 卸载老的元素
      unmount(n1);
      n1 = null; // n1置空，可以重新走组件挂载了，即传给processElement的n1为null，走mountElement方法
    }
    // 2、如果是同一个元素，对比props、children，此时传给processElement的n1为老的vnode，走patchElement方法

    // 针对不同的类型采取不同的渲染方式（vonode有一个shapeFlag标识来标识组件/元素）
    const { shapeFlag, type } = n2;
    switch (type) {
      case TEXT:
        // 处理文本
        processTxt(n1, n2, container);
        break;
      default:
        // 等效于shapeFlag && shapeFlag === ShapeFlags.ELEMENT
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理元素(h函数)
          // console.log("此时处理的是元素！！！");
          processElement(n1, n2, container);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          // console.log("此时处理的是组件！！！");
          processComponent(n1, n2, container);
        }
    }
  };

  // 真正实现渲染的函数（渲染vnode)
  const render = (vnode, container) => {
    // 第一次渲染（三个参数：旧的节点、当前节点、位置）
    patch(null, vnode, container);
  };

  // 返回一个具有createApp方法的对象，其中createApp负责生成一个具有mount挂载方法的app对象（包含属性、方法等），进而实现1、生成vnode；2、render渲染vnode
  return {
    createApp: apiCreateApp(render),
  };
}
