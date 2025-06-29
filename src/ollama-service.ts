import axios from 'axios'
import { OllamaResponse } from './types'

const OLLAMA_BASE_URL = 'http://localhost:11434/api/generate'

export const generateSummary = async (
  content: string,
  model = 'qwen2.5-coder:1.5b'
): Promise<string> => {
  const prompt = `请用50字以内描述以下TypeScript文件的用途，只返回核心功能说明：\n\`\`\`typescript\n${content}\n\`\`\``

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
