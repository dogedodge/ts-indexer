"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSummary = void 0;
const axios_1 = __importDefault(require("axios"));
const OLLAMA_BASE_URL = 'http://localhost:11434/api/generate';
const generateSummary = async (content, model = 'qwen2.5-coder:1.5b') => {
    const prompt = `请描述以下TypeScript文件的用途，重点关注可能被外部引用的代码及其用途，忽略技术栈选择、框架细节、内部实现：\n\`\`\`typescript\n${content}\n\`\`\``;
    try {
        const response = await axios_1.default.post(OLLAMA_BASE_URL, {
            model,
            prompt,
            stream: false,
            options: {
                temperature: 0.2,
                // num_predict: 100
            }
        });
        return response.data.response.trim();
    }
    catch (error) {
        throw new Error(`Ollama API错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
};
exports.generateSummary = generateSummary;
