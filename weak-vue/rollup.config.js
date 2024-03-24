// （1）引入相关依赖
import ts from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import resolvePlugin from "@rollup/plugin-node-resolve";
import path from "path"; // 处理路径

// （2）获取文件路径，并拿到路径下的包
let packagesDir = path.resolve(__dirname, "packages");
const packageDir = path.resolve(packagesDir, process.env.TARGET);
// 获取需要打包的文件的自定义配置
const resolve = (p) => path.resolve(packageDir, p);
const pkg = require(resolve(`package.json`)); // 获取json配置
const options = pkg.buildOptions; // 获取每个子包配置中的buildOptions配置
// 获取文件名字
const name = path.basename(packageDir);

// （3）创建一个映射输出表
const outputOpions = {
  "esm-bundler": {
    // 输出文件的名字
    file: resolve(`dist/${name}.esm-bundler.js`),
    // 输出文件的格式
    format: "es",
  },
  cjs: {
    // 输出文件的名字
    file: resolve(`dist/${name}.cjs.js`),
    // 输出文件的格式
    format: "cjs",
  },
  global: {
    // 输出文件的名字
    file: resolve(`dist/${name}.global.js`),
    // 输出文件的格式
    format: "iife",
  },
};

// （4）创建一个打包的配置对象
function createConfig(format, output) {
  // 进行打包
  output.name = options.name; //指定一个名字
  // 用于调整代码
  output.sourcemap = true;
  // 生成rollup配置
  return {
    // resolve表示当前包
    input: resolve("src/index.ts"), //导入
    // 输出
    output,
    //
    plugins: [
      json(),
      ts({
        //解析ts语法
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      resolvePlugin(), //解析第三方插件
    ],
  };
}

// （5）rullup需要导出一个配置
export default options.formats.map((format) =>
  createConfig(format, outputOpions[format])
);
