# TypeScript文件索引

> 本文件由AI生成，包含项目TypeScript文件的简要描述

## `core-processor.ts`
该TypeScript文件定义了两个主要功能：`processDirectory` 和 `generateMarkdown`。`processDirectory` 函数用于扫描指定目录下的 TypeScript 文件，并生成每个文件的简要描述，这些描述通过 `generateSummary` 函数从 Ollama 服务中获取。`generateMarkdown` 函数将这些简要描述转换为 Markdown 格式的文档。

## `ollama-service.ts`
该TypeScript文件定义了一个名为`generateSummary`的异步函数，用于通过OpenAI的Ollama模型生成文本摘要。核心功能包括：
1. 使用Axios库发送HTTP POST请求到指定的Ollama API地址。
2. 设置请求体包含模型名称、提示信息和流选项。
3. 处理响应并返回摘要结果。
4. 异常处理，捕获API错误并抛出自定义错误。

## `types.ts`
该文件定义了两个接口：`FileSummary` 和 `OllamaResponse`。`FileSummary` 接口用于描述文件的摘要信息，包括路径、内容和可选的摘要和错误信息；而 `OllamaResponse` 接口则用于表示 Ollama 模型的响应，包括模型名称、响应文本和是否完成状态。

## `cli.ts`
此TypeScript脚本是一个命令行工具，用于生成TypeScript文件的AI描述索引。它允许用户指定目标目录、输出文件路径和并发处理数，并通过交互式问答收集必要的信息。脚本使用`inquirer`库进行用户输入，`commander`库来解析命令行参数，`fs`模块用于文件操作。核心功能包括：1. 读取目标目录中的TypeScript文件；2. 使用AI模型生成每个文件的

