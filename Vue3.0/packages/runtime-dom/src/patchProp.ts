// 操作属性（增删改查）
import { patchClass } from "./modules/class";
import { patchStyle } from "./modules/style";
import { patchAttr } from "./modules/attrt";
import { patchEvent } from "./modules/event";
export const patchProps = (el, key, prevValue, nextValue) => {
  switch (key) {
    case "class":
      patchClass(el, nextValue); // 只用传节点和新的class值
      break;
    case "style":
      patchStyle(el, prevValue, nextValue);
      break;
    default:
      // 事件要另外处理(事件的特征：@、onclick等==>正则匹配，如以on开头，后面跟小写字母，这里简化判断，知道思想即可)
      if (/^on[^a-z]/.test(key)) {
        patchEvent(el, key, nextValue);
      } else {
        patchAttr(el, key, nextValue);
      }
  }
};
