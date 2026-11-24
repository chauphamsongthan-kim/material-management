import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Server tĩnh chạy bằng Node, không phải code trình duyệt
    files: ['server.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Service worker có biến toàn cục riêng (self, clients...)
    files: ['public/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
])
