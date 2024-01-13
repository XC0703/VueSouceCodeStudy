/**
 * 定义一些公共的方法
 */

export const isObject = (target) =>
  typeof target === "object" && target !== null;
export const isArray = Array.isArray;
export const isFunction = (val) => typeof val === "function";
export const isString = (val) => typeof val === "string";
export const isNumber = (val) => typeof val === "number";

//合并两个对象
export const extend = Object.assign;

// 判断对象是否有某个属性（两个参数，返回值为布尔型，key is keyof typeof val使用了ts的类型守卫语法）
const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key);

// 判断数组的key是否是整数
// 数组经过proxy代理之后，会变成对象的形式，如console.log(new Proxy([1,2,3],{})); ===》Proxy(Array) {'0': 1, '1': 2, '2': 3}（js对象的key类型为字符串），因此"" + parseInt(key, 10)这样是为了方便拿到正确的字符串key用于判断
// console.log(Array.isArray(new Proxy([1,2,3],{})))===》true
// 比如此时arr[2]=4，应该是
export const isIntegerKey = (key) => {
  isString(key) &&
    key !== "NaN" &&
    key[0] !== "-" &&
    "" + parseInt(key, 10) === key;
};

// 判断值是否更新
export const hasChange = (value, oldValue) => value !== oldValue;
