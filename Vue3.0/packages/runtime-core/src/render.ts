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
        patch(null, subTree, container); // 渲染vnode（此时是元素的vnode）
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
    }
  };
  // 元素的渲染方法
  const mountElement = (vnode, container) => {
    // 递归渲染子节点==>dom操作==》挂载到container/页面上
    const { shapeFlag, props, type, children } = vnode;
    // 1、创建元素
    let el = hostCreateElement(type);
    // 2、创建元素的属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 3、处理children
    if (children) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        console.log("这是文本字符串形式子节点：", children);
        hostSetElementText(el, children); // 文本形式子节点，比如这种情况：h('div',{},'张三')，将children直接插入到el中
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 递归渲染子节点
        console.log("这是数组形式子节点：", children);
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

  // patch函数负责根据vnode的不同情况（组件、元素、文本）来实现对应的渲染
  const patch = (n1, n2, container) => {
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
