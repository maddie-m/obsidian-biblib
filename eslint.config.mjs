import { globalIgnores } from 'eslint/config';
import obsidianmd from 'eslint-plugin-obsidianmd';
import { PlainTextParser } from 'eslint-plugin-obsidianmd/dist/lib/plainTextParser.js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const officialRecommendedConfig = obsidianmd.configs.recommendedWithLocalesEn.filter(
    (config) => {
        if (config.files || !config.rules) {
            return true;
        }

        return !Object.keys(config.rules).some((ruleName) =>
            ruleName.startsWith('obsidianmd/')
        );
    }
);

export default tseslint.config(
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.mjs', 'manifest.json'],
                },
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: ['.json'],
            },
        },
    },

    ...officialRecommendedConfig,

    {
        files: ['manifest.json'],
        plugins: {
            obsidianmd,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['manifest.json'],
                },
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: ['.json'],
            },
        },
        rules: {
            'obsidianmd/validate-manifest': 'error',
        },
    },

    {
        files: ['LICENSE'],
        plugins: {
            obsidianmd,
        },
        languageOptions: {
            parser: PlainTextParser,
        },
        rules: {
            'obsidianmd/validate-license': 'error',
        },
    },

    globalIgnores([
        'node_modules',
        '.obsidian-unpacked',
        'dist',
        'coverage',
        'test-results',
        'screenshots',
        'obsidian-developer-docs',
        'zotero-connectors',
        'e2e',
        'e2e-vault',
        '__mocks__',
        '.clump',
        'playwright.config.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        'copy-files.mjs',
        'version-bump.mjs',
        '*.config.js',
        '*.config.mjs',
        'main.js',
        'versions.json',
    ]),
);
