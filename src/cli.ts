#!/usr/bin/env node
import inquirer from "inquirer";
import { Command } from "commander";
import { processDirectory, generateMarkdown } from "./core-processor";
import { promises as fs } from "fs";

const program = new Command();

program
  .name("ts-indexer")
  .description("生成TypeScript文件AI描述索引")
  .version("1.0.0")
  .option("-d, --dir <path>", "目标目录路径", process.cwd())
  .option("-o, --output <path>", "输出Markdown文件路径", "./code_index.md")
  .option("-c, --concurrency <number>", "并发处理数", "3")
  .parse(process.argv);

const run = async () => {
  const options = program.opts();
  let { dir, output, concurrency } = options;

  // 交互式问答
  if (process.argv.length <= 2) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "dir",
        message: "请输入目标目录路径:",
        default: process.cwd(),
        validate: (input: string) => {
          if (input.trim() === "") {
            return "路径不能为空";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "output",
        message: "请输入输出文件路径:",
        default: "./code_index.md",
      },
      {
        type: "number",
        name: "concurrency",
        message: "设置并发处理数:",
        default: 3,
        validate: (input: number | undefined) => {
          if (!input) {
            return "必须大于0";
          }
          return true;
        },
      },
    ]);
    dir = answers.dir;
    output = answers.output;
    concurrency = answers.concurrency;
  }

  try {
    const summaries = await processDirectory(dir, parseInt(concurrency));
    const markdown = generateMarkdown(summaries);
    await fs.writeFile(output, markdown);
    console.log(`\n✅ 索引文件已生成: ${output}`);

    const successCount = summaries.filter((s) => !s.error).length;
    const errorCount = summaries.length - successCount;
    console.log(`处理结果: ${successCount}成功, ${errorCount}失败`);
  } catch (error) {
    console.error(
      "\n❌ 处理失败:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

run();
