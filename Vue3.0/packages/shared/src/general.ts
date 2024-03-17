/**
 * 定义一些公共常用方法
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

// 创建map映射关系
export function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (key: string) => boolean {
  const set = new Set(str.split(","));
  return expectsLowerCase
    ? (val) => set.has(val.toLowerCase())
    : (val) => set.has(val);
}

// 判断字符串是否是 onXxxx，如onclick
const onRE = /^on[^a-z]/;
export const isOn = (key) => onRE.test(key);

// 驼峰化
export const capitalize = (str) => {
  // e.g
  // my-first-name
  // myFirstName
  // replace 第二个参数可以是一个函数
  // 这个函数接收两个参数
  //      match: 匹配到的子串
  //      p1,p2,p3...: 假如 replace 第一个参数是正则表达式
  //                   则代表第 n 个括号匹配到的字符串
  // 如上例子中
  // nerverUse 是 -f、-n
  // c 是 f、n
  return str.replace(/-(\w)/g, (neverUse, c) => (c ? c.toUpperCase() : ""));
};

// 这里是一个将 xxx-xx 转化为 onxxxXx 的工具函数
export const toHandlerKey = (str) => (str ? `on${capitalize(str)}` : "");
