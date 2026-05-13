// Type declarations for Citation.js and plugins used by BibLib.
// Citation.js does not currently ship first-party TypeScript declarations.
declare module 'citation-js' {
    export interface CiteGetOptions {
        style?: string;
        type?: string;
        format?: string;
    }

    export interface CiteFormatOptions {
        format?: string;
        template?: string;
        lang?: string;
    }

    export interface BibtexConfig {
        format: {
            checkLabel?: boolean;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    }

    export interface CitePlugins {
        config: {
            get(name: string): BibtexConfig;
        };
    }

    export default class Cite {
        static readonly plugins: CitePlugins;

        constructor(
            input?:
                | string
                | import('./citation').Citation
                | import('./citation').ZoteroItem
                | Array<import('./citation').Citation | import('./citation').ZoteroItem>,
            options?: Record<string, unknown>
        );

        static async(input: string, options?: Record<string, unknown>): Promise<Cite>;

        get(options: CiteGetOptions & { type: 'string' }): string;
        get(options?: CiteGetOptions): import('./citation').Citation[] | string;

        format(format: string, options?: CiteFormatOptions): string;
        format(options?: CiteFormatOptions): string;
    }
}

declare module '@citation-js/plugin-bibtex';
declare module '@citation-js/plugin-doi';
declare module '@citation-js/plugin-isbn';
declare module '@citation-js/plugin-pubmed';
declare module '@citation-js/plugin-wikidata';
declare module '@citation-js/date';
