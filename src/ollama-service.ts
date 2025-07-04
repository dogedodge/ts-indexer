import axios from 'axios'
import { OllamaResponse } from './types'
import fs from 'fs'
import path from 'path'

const OLLAMA_BASE_URL = 'http://localhost:11434/api/generate'

/**
 * Loads a prompt template from a file and replaces placeholders
 * @param templatePath Path to the template file
 * @param replacements Object with keys as placeholders and values as replacements
 * @returns Processed prompt string
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
        // num_predict: 100
      }
    })
  
    return response.data.response.trim()
  } catch (error) {
    throw new Error(`Ollama API错误: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}
