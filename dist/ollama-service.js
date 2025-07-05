"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSummary = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const OLLAMA_BASE_URL = 'http://localhost:11434/api/generate';
/**
 * Loads a prompt template from a file and replaces placeholders
 * @param templatePath Path to the template file
 * @param replacements Object with keys as placeholders and values as replacements
 * @returns Processed prompt string
 */
const loadPromptTemplate = (templatePath, replacements) => {
    const templateDir = path_1.default.join(__dirname, '..', 'prompt');
    const filePath = path_1.default.join(templateDir, templatePath);
    let template = fs_1.default.readFileSync(filePath, 'utf-8');
    Object.entries(replacements).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return template;
};
const generateSummary = async (content, model = 'qwen2.5-coder:7b') => {
    const prompt = loadPromptTemplate('summary.md', { content });
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
