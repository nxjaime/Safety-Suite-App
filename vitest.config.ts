/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

process.env.NODE_ENV = 'test'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.worktrees/**',
            '**/semgrep-results-001/**',
            '**/test-results/**'
        ],
    },
})
