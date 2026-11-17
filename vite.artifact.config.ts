import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// بناء بملف JS واحد لتضمينه داخل صفحة واحدة تُنشر رابطاً للتجربة على الجوال
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist-artifact', rollupOptions: { output: { inlineDynamicImports: true } } },
});
