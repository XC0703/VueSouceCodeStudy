// 进行打包  monorepo
import fs from "fs";
import { execa } from "execa";

// （1）获取打包目录
// 注意：文件夹才进行打包，因此写一个filter方法进行过滤
const dirs = fs.readdirSync("packages").filter((p) => {
  return fs.statSync(`packages/${p}`).isDirectory();
});
// console.log(dirs); // [ 'reactivity', 'shared' ]

// （2）进行并行打包
async function build(target) {
  //   console.log(target); // reactivity shared
  // 执行了 execa 函数，调用了 Rollup 命令行工具，
  // 其中-c 参数表示使用当前目录下的 rollup 配置文件进行打包，使用 --bundleConfigAsCjs 标志来指定配置文件为 CommonJS 模块
  // 还传入了 --environment 参数，并指定了一个变量 TARGET 的值为 target，将输出结果显示在当前进程的标准输入输出中（stdio）
  await execa(
    "rollup",
    ["-c", "--bundleConfigAsCjs", "--environment", `TARGET:${target}`],
    {
      stdio: "inherit",
    }
  );
}
async function runParaller(dirs, itemfn) {
  // 遍历打包
  let result = [];
  for (let item of dirs) {
    result.push(itemfn(item));
  }
  return Promise.all(result); //存放打包的promise，等待这里的打包执行完毕之后，调用成功
}
runParaller(dirs, build).then(() => {});
