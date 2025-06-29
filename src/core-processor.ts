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
