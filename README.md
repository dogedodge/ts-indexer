# TypeScript Indexer

A CLI tool that generates AI-powered descriptions for TypeScript files in your project, creating a structured Markdown index.

## Features

- Automatically scans and analyzes TypeScript files (`*.ts`, `*.d.ts`)
- Generates concise 50-word descriptions using Ollama AI
- Supports both command-line arguments and interactive mode
- Progress feedback with percentage completion
- Concurrent processing for faster results
- Error handling with individual file failure isolation

## Installation

```bash
npm install -g ts-indexer
```

Or install locally in your project:

```bash
npm install ts-indexer --save-dev
```

## Usage

### Command-line mode

```bash
ts-indexer -d [directory] -o [output] -c [concurrency]
```

Options:

- `-d, --dir`: Target directory path (default: current directory)
- `-o, --output`: Output Markdown file path (default: `./code_index.md`)
- `-c, --concurrency`: Number of files to process concurrently (default: 3)

### Interactive mode

Simply run without arguments:

```bash
ts-indexer
```

Then answer the prompts for directory path, output file, and concurrency.

## Output Example

The generated `code_index.md` will look like:

```markdown
# TypeScript 文件索引

> 本文件由 AI 生成，包含项目 TypeScript 文件的简要描述

## `src/utils.ts`

提供通用工具函数，包括日期格式化、字符串处理和错误包装器

## `api/types.d.ts`

定义 API 请求和响应的 TypeScript 接口类型

## `components/Button.tsx`

实现可复用的 React 按钮组件，支持多种状态和样式变体
```

## Requirements

- Node.js 16+
- Ollama service running locally (`ollama serve`)
- Ollama model installed (`ollama pull qwen2.5-coder:1.5b`)

## Notes

- The tool will skip `node_modules` directory automatically
- Each file description is limited to ~50 words
- Processing large projects may take time depending on hardware
- Failed files will be marked with error messages in the output
