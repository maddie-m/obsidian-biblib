/**
 * Tests for GitHub issue #29:
 * "BibTeX export does not preserve citation key"
 *
 * When exporting literature notes as BibTeX, the citation keys from the
 * frontmatter `id` field should be preserved in the BibTeX output.
 *
 * The fix copies `id` to `citation-key` before passing data to citation-js,
 * since citation-js uses `citation-key` for BibTeX output labels.
 *
 * @see https://github.com/callumacrae/biblib/issues/29
 */
import Cite from 'citation-js';
import '@citation-js/plugin-bibtex';

// Configure citation-js to preserve citation keys with special characters
// (mirrors the configuration in bibliography-builder.ts)
const bibtexConfig = Cite.plugins.config.get('@bibtex');
bibtexConfig.format.checkLabel = false;

/**
 * Helper function that mimics the preprocessing done in BibliographyBuilder.exportBibTeX()
 * This copies the `id` field to `citation-key` to preserve citation keys in BibTeX output.
 */
function preprocessForBibTeX(data: Record<string, any>): Record<string, any> {
    const processedData = { ...data };
    if (processedData.id) {
        processedData['citation-key'] = processedData.id;
    }
    return processedData;
}

describe('BibTeX export citation key preservation (issue #29)', () => {
    it('exported BibTeX should use the original citation key from the id field', () => {
        const frontmatterData = {
            id: 'mycustomkey2023',
            type: 'article-journal',
            title: 'A Study on Machine Learning',
            author: [{ family: 'Smith', given: 'John' }],
            issued: { 'date-parts': [[2023, 6, 15]] },
        };

        const processed = preprocessForBibTeX(frontmatterData);
        const bibtex = new Cite([processed]).get({ style: 'bibtex', type: 'string' });

        // The BibTeX entry should use "mycustomkey2023" as the citation key,
        // not a regenerated key like "Smith2023Study"
        expect(bibtex).toContain('@article{mycustomkey2023,');
    });

    it('multiple entries should each preserve their original keys', () => {
        const entries = [
            {
                id: 'jones-attention-2024',
                type: 'article-journal',
                title: 'Attention Mechanisms in NLP',
                author: [{ family: 'Jones', given: 'Mary' }],
                issued: { 'date-parts': [[2024]] },
            },
            {
                id: 'brown_deep_2022',
                type: 'paper-conference',
                title: 'Deep Learning for Vision',
                author: [{ family: 'Brown', given: 'Alice' }],
                issued: { 'date-parts': [[2022, 3]] },
            },
        ];

        const processed = entries.map(preprocessForBibTeX);
        const bibtex = new Cite(processed).get({ style: 'bibtex', type: 'string' });

        expect(bibtex).toContain('jones-attention-2024');
        expect(bibtex).toContain('brown_deep_2022');
    });

    it('keys with special but Pandoc-valid characters should be preserved', () => {
        // Pandoc citekeys can contain alphanumerics and: _ : . # $ % & - + ? < > ~ /
        const frontmatterData = {
            id: 'smith:2023-ml',
            type: 'article-journal',
            title: 'Machine Learning',
            author: [{ family: 'Smith', given: 'John' }],
            issued: { 'date-parts': [[2023]] },
        };

        const processed = preprocessForBibTeX(frontmatterData);
        const bibtex = new Cite([processed]).get({ style: 'bibtex', type: 'string' });

        // The key with colons and hyphens should be preserved
        expect(bibtex).toContain('smith:2023-ml');
    });
});
