import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import ZipPack from 'vite-plugin-zip-pack';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';

// 复制并修改 HTML 文件，将绝对路径改为相对路径
function copyHtmlWithRelativePaths() {
  return {
    name: 'copy-html-with-relative-paths',
    enforce: 'post' as const,
    closeBundle: async () => {
      // 查找 CSS 文件
      const assetsDir = 'dist/assets';
      const files = fs.readdirSync(assetsDir);

      // global CSS 文件名
      const globalCssFile = files.find(f => f.startsWith('global-') && f.endsWith('.css')) || '';
      const optionsCssFile =
        files.find(f => f.startsWith('options-') && f.endsWith('.css') && !f.includes('global')) ||
        '';
      const popupCssFile =
        files.find(f => f.startsWith('popup-') && f.endsWith('.css') && !f.includes('global')) ||
        '';

      console.log('[copy-html] Found CSS files:', { globalCssFile, optionsCssFile, popupCssFile });

      // 复制 popup.html - 使用源文件的样式（包含 380px x 500px 尺寸）
      let popupHtml = fs.readFileSync('src/popup/index.html', 'utf-8');

      // 添加 CSS 链接（全局CSS + 页面CSS）
      const popupCssLinks: string[] = [];
      if (globalCssFile) {
        popupCssLinks.push(`<link rel="stylesheet" href="assets/${globalCssFile}">`);
        console.log('[copy-html] Added global CSS link:', `assets/${globalCssFile}`);
      }
      if (popupCssFile) {
        popupCssLinks.push(`<link rel="stylesheet" href="assets/${popupCssFile}">`);
        console.log('[copy-html] Added popup CSS link:', `assets/${popupCssFile}`);
      }
      if (popupCssLinks.length > 0) {
        popupHtml = popupHtml.replace('</head>', `  ${popupCssLinks.join('\n  ')}\n</head>`);
      }

      popupHtml = popupHtml.replace('./main.ts', 'popup.js');
      fs.writeFileSync('dist/popup.html', popupHtml);
      console.log('[copy-html] Written dist/popup.html');

      // 复制 options.html
      let optionsHtml = fs.readFileSync('src/options/index.html', 'utf-8');
      const optionsCssLinks: string[] = [];
      if (globalCssFile) {
        optionsCssLinks.push(`<link rel="stylesheet" href="assets/${globalCssFile}">`);
      }
      if (optionsCssFile) {
        optionsCssLinks.push(`<link rel="stylesheet" href="assets/${optionsCssFile}">`);
      }
      if (optionsCssLinks.length > 0) {
        optionsHtml = optionsHtml.replace('</head>', `  ${optionsCssLinks.join('\n  ')}\n</head>`);
      }
      optionsHtml = optionsHtml.replace('./main.ts', 'options.js');
      fs.writeFileSync('dist/options.html', optionsHtml);
      console.log('[copy-html] Written dist/options.html');
    },
  };
}

export default defineConfig({
  base: './', // 使用相对路径，适合Chrome扩展
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [{ src: 'public/manifest.json', dest: '.' }],
    }),
    copyHtmlWithRelativePaths(),
    ZipPack({
      outDir: 'release',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@common': resolve(__dirname, 'src/common'),
      '@background': resolve(__dirname, 'src/background'),
      '@popup': resolve(__dirname, 'src/popup'),
      '@options': resolve(__dirname, 'src/options'),
      '@content': resolve(__dirname, 'src/content'),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
  },
  esbuild: {
    drop: ['debugger'],
  },
});
