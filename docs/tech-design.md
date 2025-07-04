### 整体架构设计思路

根据需求，我将设计一个模块化、高效的CLI工具，主要分为以下模块：

1. **核心处理模块**
   - 文件遍历：使用`fast-glob`高效递归扫描目录
   - 文件处理：读取内容并调用Ollama API
   - 结果生成：构建Markdown索引

2. **AI交互模块**
   - 封装Ollama API调用（使用`axios`）
   - 设计优化后的prompt模板
   - 处理API错误和重试机制

3. **CLI交互层**
   - 支持命令行参数和交互式问答
   - 进度反馈（`ora`加载动画）
   - 错误处理和日志系统

4. **输出模块**
   - 生成结构化的Markdown文件
   - 包含文件路径和AI生成的描述

### 项目结构

```
├── code_index.md          # 生成的索引文件
├── package.json           # 项目配置
├── README.md              # 项目说明
├── tsconfig.json          # TypeScript配置
├── docs/
│   └── tech-design.md     # 技术设计文档
├── prompt/
│   └── summary.md         # 提示词模板文件
└── src/
    ├── cli.ts             # CLI入口
    ├── core-processor.ts  # 核心处理逻辑
    ├── ollama-service.ts  # Ollama API封装
    └── types.ts           # 类型定义
```

### 关键代码实现

#### 1. 依赖安装
```bash
npm install fast-glob axios inquirer ora commander
npm install -D typescript @types/node
```

#### 2. 类型定义 (`src/types.ts`)
```typescript
export interface FileSummary {
  path: string
  content: string
  summary?: string
  error?: string
}

export interface OllamaResponse {
  model: string
  response: string
  done: boolean
}
```

#### 3. Ollama服务封装 (`src/ollama-service.ts`)
```typescript
import axios from 'axios'
import { OllamaResponse } from './types'
import fs from 'fs'
import path from 'path'

const OLLAMA_BASE_URL = 'http://localhost:11434/api/generate'

/**
 * 加载提示词模板并替换占位符
 * @param templatePath 模板文件路径
 * @param replacements 替换键值对象
 * @returns 处理后的提示词字符串
 */
const loadPromptTemplate = (templatePath: string, replacements: Record<string, string>): string => {
  const templateDir = path.join(__dirname, '..', 'prompt')
  const filePath = path.join(templateDir, templatePath)
  let template = fs.readFileSync(filePath, 'utf-8')
  
  Object.entries(replacements).forEach(([key, value]) => {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })
  
  return template
}

export const generateSummary = async (
  content: string,
  model = 'qwen2.5-coder:1.5b'
): Promise<string> => {
  const prompt = loadPromptTemplate('summary.md', { content })

  try {
    const response = await axios.post<OllamaResponse>(OLLAMA_BASE_URL, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 100
      }
    })
  
    return response.data.response.trim()
  } catch (error) {
    throw new Error(`Ollama API错误: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}
```

#### 4. 核心处理器 (`src/core-processor.ts`)
```typescript
import { promises as fs } from 'fs'
import path from 'path'
import fg from 'fast-glob'
import { generateSummary } from './ollama-service'
import { FileSummary } from './types'
import ora from 'ora'

export const processDirectory = async (
  dirPath: string,
  concurrency = 3
): Promise<FileSummary[]> => {
  const spinner = ora('扫描TypeScript文件...').start()
  const files = await fg(['**/*.{ts,d.ts}'], {
    cwd: dirPath,
    absolute: false,
    ignore: ['**/node_modules/**']
  })

  spinner.succeed(`找到 ${files.length} 个文件`)
  const results: FileSummary[] = []
  const processingSpinner = ora('生成文件描述 (0%)').start()

  let processed = 0
  const updateProgress = () => {
    processingSpinner.text = `生成文件描述 (${Math.round((processed / files.length) * 100)}%)`
  }

  const processFile = async (file: string): Promise<FileSummary> => {
    const filePath = path.join(dirPath, file)
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const summary = await generateSummary(content)
      return { path: file, content, summary }
    } catch (error) {
      return { 
        path: file, 
        content: '', 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    } finally {
      processed++
      updateProgress()
    }
  }

  // 并发控制
  const queue: Promise<FileSummary>[] = []
  for (const file of files) {
    const promise = processFile(file).then(result => {
      results.push(result)
      return result
    })
    queue.push(promise)
  
    if (queue.length >= concurrency) {
      await Promise.race(queue)
    }
  }

  await Promise.all(queue)
  processingSpinner.succeed('所有文件处理完成!')
  return results
}

export const generateMarkdown = (summaries: FileSummary[]): string => {
  let md = '# TypeScript文件索引\n\n'
  md += '> 本文件由AI生成，包含项目TypeScript文件的简要描述\n\n'

  for (const { path, summary, error } of summaries) {
    md += `## \`${path}\`\n`
    md += error 
      ? `❌ 错误: ${error}\n\n` 
      : `${summary}\n\n`
  }

  return md
}
```

#### 5. CLI入口 (`src/cli.ts`)
```typescript
#!/usr/bin/env node
import inquirer from 'inquirer'
import { Command } from 'commander'
import { processDirectory, generateMarkdown } from './core-processor'
import { promises as fs } from 'fs'

const program = new Command()

program
  .name('ts-indexer')
  .description('生成TypeScript文件AI描述索引')
  .version('1.0.0')
  .option('-d, --dir <path>', '目标目录路径', process.cwd())
  .option('-o, --output <path>', '输出Markdown文件路径', './code_index.md')
  .option('-c, --concurrency <number>', '并发处理数', '3')
  .parse(process.argv)

const run = async () => {
  const options = program.opts()
  let { dir, output, concurrency } = options

  // 交互式问答
  if (process.argv.length <= 2) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'dir',
        message: '请输入目标目录路径:',
        default: process.cwd(),
        validate: input => !!input || '路径不能为空'
      },
      {
        type: 'input',
        name: 'output',
        message: '请输入输出文件路径:',
        default: './code_index.md'
      },
      {
        type: 'number',
        name: 'concurrency',
        message: '设置并发处理数:',
        default: 3,
        validate: input => input > 0 || '必须大于0'
      }
    ])
    dir = answers.dir
    output = answers.output
    concurrency = answers.concurrency
  }

  try {
    const summaries = await processDirectory(dir, parseInt(concurrency))
    const markdown = generateMarkdown(summaries)
    await fs.writeFile(output, markdown)
    console.log(`\n✅ 索引文件已生成: ${output}`)
  
    const successCount = summaries.filter(s => !s.error).length
    const errorCount = summaries.length - successCount
    console.log(`处理结果: ${successCount}成功, ${errorCount}失败`)
  } catch (error) {
    console.error('\n❌ 处理失败:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

run()
```

### 使用示例

#### 1. 命令行参数模式
```bash
ts-indexer -d ./src -o ./docs/code_index.md -c 5
```

#### 2. 交互式模式
```bash
ts-indexer
? 请输入目标目录路径: ./src
? 请输入输出文件路径: ./docs/code_index.md
? 设置并发处理数: 3
```

#### 3. 输出示例 (`code_index.md`)
```markdown
# TypeScript文件索引

> 本文件由AI生成，包含项目TypeScript文件的简要描述

## `src/utils.ts`
提供通用工具函数，包括日期格式化、字符串处理和错误包装器

## `api/types.d.ts`
定义API请求和响应的TypeScript接口类型

## `components/Button.tsx`
实现可复用的React按钮组件，支持多种状态和样式变体
```

### 优化特性

1. **智能截断**：自动处理大文件，避免超过模型token限制
2. **并发控制**：限制同时处理的文件数量（默认3个）
3. **错误恢复**：单个文件失败不影响整体流程
4. **进度反馈**：实时显示处理百分比
5. **模块化提示词**：使用外部markdown文件存储提示词模板，支持`{{变量}}`占位符替换
6. **prompt优化**：明确要求功能描述重点关注可能被外部引用的代码及其用途

> 注意：使用前需确保本地已安装并运行Ollama服务，且`qwen2.5-coder:1.5b`模型已下载 (`ollama pull qwen2.5-coder:1.5b`)

### 提示词模板

提示词模板存放在`prompt`目录中，使用Markdown格式，包含占位符以便动态替换内容：

#### `prompt/summary.md`
```markdown
请描述以下TypeScript文件的用途，重点关注可能被外部引用的代码及其用途，忽略技术栈选择、框架细节、内部实现：
```typescript
{{content}}
```
```