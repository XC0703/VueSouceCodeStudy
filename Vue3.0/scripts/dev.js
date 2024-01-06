import { execa } from "execa";

// 进行并行打包
async function build(target) {
  //   console.log(target); // reactivity shared
  // 执行了 execa 函数，调用了 Rollup 命令行工具，
  // 其中-c 参数表示使用当前目录下的 rollup 配置文件进行打包, 使用 --bundleConfigAsCjs 标志来指定配置文件为 CommonJS 模块
  // 还传入了 --environment 参数，并指定了一个变量 TARGET 的值为 target，将输出结果显示在当前进程的标准输入输出中（stdio）
  await execa(
    "rollup",
    ["-c", "--bundleConfigAsCjs", "--environment", `TARGET:${target}`],
    {
      stdio: "inherit",
    }
  );
}

// 此时仅仅以热更新reactivity包为例子，后面会补充完善
build("reactivity");
