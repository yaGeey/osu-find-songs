import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
   baseDirectory: __dirname,
})

const eslintConfig = [
   {
      ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
   },
   // Use compat.extends to load the Next.js and Prettier configs
   ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
   {
      files: ["**/*.{js,jsx,ts,tsx}"],
      rules: {
         '@typescript-eslint/no-unused-vars': 'off',
         '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
         'no-extra-semi': 'off',
         '@typescript-eslint/no-namespace': 'off',
         '@typescript-eslint/no-explicit-any': 'off',
         '@typescript-eslint/no-unsafe-argument': 'off',
         'react-hooks/exhaustive-deps': 'off',
      },
   },
]

export default eslintConfig
