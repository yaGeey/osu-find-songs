import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
   baseDirectory: __dirname,
})

const eslintConfig = [
   {
      ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
   },
   js.configs.recommended,
   ...compat.extends(
      'next/core-web-vitals',
      'next/typescript',
      'prettier',

      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react/jsx-runtime',
      'plugin:react-hooks/recommended',
      'plugin:@tanstack/eslint-plugin-query/recommended',
   ),
   {
      files: ['**/*.{js,jsx,ts,tsx}'],
      rules: {
         '@typescript-eslint/no-unused-vars': 'off',
         '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
         'no-extra-semi': 'off',
         'no-empty': 'off',
         '@typescript-eslint/no-namespace': 'off',
         '@typescript-eslint/no-explicit-any': 'off',
         '@typescript-eslint/no-unsafe-argument': 'off',
         'react-hooks/exhaustive-deps': 'off',
         'react/react-in-jsx-scope': 'off',
         'react-hooks/set-state-in-effect': 'warn',
         'react-hooks/use-memo': 'warn',
         'react/jsx-no-target-blank': 'off',
         'no-useless-escape': 'warn',
         '@tanstack/query/exhaustive-deps': 'off',
      },
   },
]

export default eslintConfig
