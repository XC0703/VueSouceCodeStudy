import { isObject } from "@vue/shared";
import { NodeTypes } from "./ast";

// codegen 代码生成
export const generate = (ast) => {
  // console.log("调用 generate 函数生成代码");
  // console.log("传入 generate 函数的 ast 参数", ast);
  // 获取上下文（包含生成代码所需的状态和工具函数）
  const context = createCodegenContext();
  // console.log("调用 createCodegenContext 函数获取上下文");
  // push用于添加代码到上下文中，indent和deindent用于增加或减少代码的缩进级别。
  const { push, indent, deindent } = context;

  indent();
  push("with (ctx) {"); // with语句用于确保ctx中的属性和方法可以在代码块内部直接访问，用于后面的new Function生成代码(因此此时生成的是字符串，里面的h函数、渲染的值以及函数等都需要传入)
  indent();

  push("return function render(){return ");
  if (ast.codegenNode) {
    // console.log("递归调用 genNode 函数生成代码");
    genNode(ast.codegenNode, context); // 递归生成代码
  } else {
    push("null");
  }

  deindent();
  push("}}");

  // console.log("生成代码完成");
  // console.log("generate 函数返回返回的结果", { ast, code: context.code });
  return {
    ast,
    code: context.code,
  };
};

// 获取上下文
const createCodegenContext = () => {
  const context = {
    // state
    code: "", // 目标代码
    indentLevel: 0, // 缩进等级

    // method
    push(code) {
      context.code += code;
    },
    indent() {
      newline(++context.indentLevel);
    },
    deindent(witoutNewLine = false) {
      if (witoutNewLine) {
        --context.indentLevel;
      } else {
        newline(--context.indentLevel);
      }
    },
    newline() {
      newline(context.indentLevel);
    },
  };
  function newline(n) {
    context.push("\n" + "  ".repeat(n));
  }
  return context;
};

// 生成代码
const genNode = (node, context) => {
  // 如果是字符串就直接 push
  if (typeof node === "string") {
    context.push(node);
    return;
  }
  switch (node.type) {
    case NodeTypes.ELEMENT:
      // console.log("调用 genElement 函数生成代码");
      genElement(node, context);
      break;
    case NodeTypes.TEXT:
    case NodeTypes.INTERPOLATION:
      // console.log("调用 genTextData 函数生成代码");
      genTextData(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      // console.log("调用 genCompoundExpression 函数生成代码");
      genCompoundExpression(node, context);
      break;
  }
};

// 生成元素节点
const genElement = (node, context) => {
  const { push, deindent } = context;
  const { tag, children, props, directives } = node;
  // tag
  push(`h(${tag}, `);

  // props
  if (props) {
    genProps(props.properties, context);
  } else {
    push("null, ");
  }

  // children
  if (children) {
    genChildren(children, context);
  } else {
    push("null");
  }

  deindent();
  push(")");
};

// 获取节点中的属性数据
const genProps = (props, context) => {
  const { push } = context;

  if (!props.length) {
    push("{}");
    return;
  }

  push("{ ");
  for (let i = 0; i < props.length; i++) {
    // 遍历每个 prop 对象，获取其中的 key 节点和 value 节点
    const prop = props[i];
    const key = prop ? prop.key : "";
    const value = prop ? prop.value : prop;

    if (key) {
      // key
      genPropKey(key, context);
      // value
      genPropValue(value, context);
    } else {
      // 如果 key 不存在就说明是一个 v-bind
      const { content, isStatic } = value;
      const contentStr = JSON.stringify(content);
      push(`${contentStr}: ${isStatic ? contentStr : content}`);
    }

    if (i < props.length - 1) {
      push(", ");
    }
  }
  push(" }, ");
};

// 生成键
const genPropKey = (node, context) => {
  const { push } = context;
  const { isStatic, content } = node;
  push(isStatic ? JSON.stringify(content) : content);
  push(": ");
};

// 生成值
const genPropValue = (node, context) => {
  const { push } = context;
  const { isStatic, content } = node;
  push(isStatic ? JSON.stringify(content.content) : JSON.stringify(content));
};

// 生成子节点
const genChildren = (children, context) => {
  const { push, indent } = context;

  push("[");
  indent();

  // 单独处理 COMPOUND_EXPRESSION
  if (children.type === NodeTypes.COMPOUND_EXPRESSION) {
    genCompoundExpression(children, context);
  }

  // 单独处理 TEXT
  else if (isObject(children) && children.type === NodeTypes.TEXT) {
    genNode(children, context);
  }

  // 其余节点直接递归
  else {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      genNode(child.codegenNode || child.children, context);
      push(", ");
    }
  }

  push("]");
};

// 生成文本节点和插值表达式节点
const genTextData = (node, context) => {
  const { push } = context;
  const { type, content } = node;

  // 如果是文本节点直接拿出 content
  // 如果是插值表达式需要拿出 content.content
  const textContent =
    type === NodeTypes.TEXT
      ? JSON.stringify(content)
      : NodeTypes.INTERPOLATION
      ? content.content
      : "";

  if (type === NodeTypes.TEXT) {
    push(textContent);
  }
  if (type === NodeTypes.INTERPOLATION) {
    push("`${");
    push(`${textContent}`);
    push("}`");
  }
};

// 生成复合表达式
const genCompoundExpression = (node, context) => {
  const { push } = context;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (typeof child === "string") {
      push(child);
    } else {
      genNode(child, context);
    }

    if (i !== node.children.length - 1) {
      push(", ");
    }
  }
};
