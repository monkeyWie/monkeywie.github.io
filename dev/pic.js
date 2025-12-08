#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import clipboardy from 'clipboardy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取命令行参数
const postSlug = process.argv[2];

if (!postSlug) {
  console.error('请提供文章名称参数，例如：node pic.js xxx');
  process.exit(1);
}

// 构建本地 markdown 文件路径
const mdPath = path.join(__dirname, '..', 'src', 'content', 'posts', `${postSlug}.md`);

// 检查文件是否存在
if (!fs.existsSync(mdPath)) {
  console.error(`文件不存在: ${mdPath}`);
  process.exit(1);
}

// 读取 markdown 文件内容
let content = fs.readFileSync(mdPath, 'utf-8');

console.log(`正在处理文章: ${postSlug}`);

// 构建博客文章 URL
const blogUrl = `https://monkeywie.cn/posts/${postSlug}`;

console.log(`访问博客地址: ${blogUrl}`);

// 使用 fetch 获取博客页面内容
let htmlContent;
try {
  const response = await fetch(blogUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  htmlContent = await response.text();
} catch (error) {
  console.error('获取博客页面失败:', error.message);
  process.exit(1);
}

// 匹配所有 <img> 标签中 src 以 /_astro/ 开头的 URL
const imgRegex = /<img[^>]+src=["'](\/_astro\/[^"']+)["'][^>]*>/g;
const astroUrls = [];
let match;

while ((match = imgRegex.exec(htmlContent)) !== null) {
  astroUrls.push(match[1]);
}

if (astroUrls.length === 0) {
  console.log('未找到任何 /_astro/ 图片链接');
  console.log('原始内容已复制到剪贴板');
  await copyToClipboard(content);
  process.exit(0);
}

console.log(`找到 ${astroUrls.length} 个图片链接`);

// 匹配 markdown 中的图片语法 ![](xxx)
const mdImgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
const mdImages = [];
let mdMatch;

while ((mdMatch = mdImgRegex.exec(content)) !== null) {
  mdImages.push({
    full: mdMatch[0],
    url: mdMatch[1],
    index: mdMatch.index
  });
}

console.log(`Markdown 中找到 ${mdImages.length} 个图片`);

// 按顺序替换图片 URL
if (mdImages.length !== astroUrls.length) {
  console.warn(`警告: Markdown 图片数量(${mdImages.length})与博客图片数量(${astroUrls.length})不匹配`);
}

// 从后往前替换，避免索引问题
for (let i = mdImages.length - 1; i >= 0; i--) {
  if (i < astroUrls.length) {
    const mdImg = mdImages[i];
    const fullUrl = `https://monkeywie.cn${astroUrls[i]}`;
    const newImgSyntax = `![](${fullUrl})`;
    
    content = content.substring(0, mdImg.index) + newImgSyntax + content.substring(mdImg.index + mdImg.full.length);
    
    console.log(`替换第 ${i + 1} 个图片:`);
    console.log(`  原始: ${mdImg.url}`);
    console.log(`  新链接: ${fullUrl}`);
  }
}

// 复制到剪贴板
await copyToClipboard(content);

console.log('\n✓ 处理完成！内容已复制到剪贴板');

/**
 * 复制文本到剪贴板（跨平台）
 */
async function copyToClipboard(text) {
  try {
    await clipboardy.write(text);
  } catch (error) {
    console.error('复制到剪贴板失败:', error.message);
    console.log('\n处理后的内容：');
    console.log('---');
    console.log(text);
    console.log('---');
  }
}
