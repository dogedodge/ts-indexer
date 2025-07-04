"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarkdown = exports.processDirectory = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const ollama_service_1 = require("./ollama-service");
const ora_1 = __importDefault(require("ora"));
const processDirectory = async (dirPath, concurrency = 3) => {
    const spinner = (0, ora_1.default)('扫描TypeScript文件...').start();
    const files = await (0, fast_glob_1.default)(['**/*.{ts,d.ts,tsx}'], {
        cwd: dirPath,
        absolute: false,
        ignore: ['**/node_modules/**']
    });
    spinner.succeed(`找到 ${files.length} 个文件`);
    const results = [];
    const processingSpinner = (0, ora_1.default)('生成文件描述 (0%)').start();
    let processed = 0;
    const updateProgress = () => {
        processingSpinner.text = `生成文件描述 (${Math.round((processed / files.length) * 100)}%)`;
    };
    const processFile = async (file) => {
        const filePath = path_1.default.join(dirPath, file);
        try {
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            const summary = await (0, ollama_service_1.generateSummary)(content);
            return { path: file, content, summary };
        }
        catch (error) {
            return {
                path: file,
                content: '',
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
        finally {
            processed++;
            updateProgress();
        }
    };
    // 并发控制
    const queue = [];
    for (const file of files) {
        const promise = processFile(file).then(result => {
            results.push(result);
            return result;
        });
        queue.push(promise);
        if (queue.length >= concurrency) {
            await Promise.race(queue);
        }
    }
    await Promise.all(queue);
    processingSpinner.succeed('所有文件处理完成!');
    return results;
};
exports.processDirectory = processDirectory;
const generateMarkdown = (summaries) => {
    let md = '# TypeScript文件索引\n\n';
    md += '> 本文件由AI生成，包含项目TypeScript文件的简要描述\n\n';
    for (const { path, summary, error } of summaries) {
        md += `## \`${path}\`\n`;
        md += error
            ? `❌ 错误: ${error}\n\n`
            : `${summary}\n\n`;
    }
    return md;
};
exports.generateMarkdown = generateMarkdown;
