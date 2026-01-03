const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
console.log("🛠️  SARA 配置修复程序启动...");

// 1. 强制重写 tsconfig.json (标准 Next.js 16 配置)
const tsConfig = {
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
};

fs.writeFileSync(
    path.join(rootDir, 'tsconfig.json'), 
    JSON.stringify(tsConfig, null, 2)
);
console.log("✅ tsconfig.json 已重置 (强制包含根目录文件)");

// 2. 强制重写 next.config.ts (最简配置)
// 先删除可能存在的 .js 版本，防止冲突
if (fs.existsSync(path.join(rootDir, 'next.config.js'))) {
    fs.unlinkSync(path.join(rootDir, 'next.config.js'));
    console.log("🗑️  删除了旧的 next.config.js");
}

const nextConfigContent = `
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
`;

fs.writeFileSync(path.join(rootDir, 'next.config.ts'), nextConfigContent.trim());
console.log("✅ next.config.ts 已重置为初始状态");

// 3. 检查并屏蔽根目录的 pages 文件夹 (幽灵路由)
const pagesDir = path.join(rootDir, 'pages');
if (fs.existsSync(pagesDir)) {
    const backupDir = path.join(rootDir, 'pages_backup_ignore');
    fs.renameSync(pagesDir, backupDir);
    console.log(`⚠️  发现干扰源 'pages' 目录，已重命名为 '${path.basename(backupDir)}' 以屏蔽干扰。`);
}

// 4. 再次清理缓存
const nextCache = path.join(rootDir, '.next');
if (fs.existsSync(nextCache)) {
    fs.rmSync(nextCache, { recursive: true, force: true });
    console.log("🧹 缓存已粉碎");
}

console.log("\n🚀 配置修复完成！现在 Next.js 应该能看到 app 目录了。");