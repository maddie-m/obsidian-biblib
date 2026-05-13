import { App, Modal, Setting, Notice } from 'obsidian';
import { BibliographyPluginSettings } from '../../types/settings';
import { NoteCreationService, BulkImportSettings } from '../../services/note-creation-service';
import { errorMessage } from '../../utils/type-guards';

class BulkImportConfirmModal extends Modal {
    private decided = false;

    constructor(app: App, private onDecision: (confirmed: boolean) => void) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Confirm bulk import' });
        contentEl.createEl('p', {
            text: 'This operation may create multiple files in your vault.'
        });

        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Cancel')
                .onClick(() => this.decide(false)))
            .addButton(button => button
                .setButtonText('Start import')
                .setCta()
                .onClick(() => this.decide(true)));
    }

    onClose(): void {
        if (!this.decided) {
            this.onDecision(false);
        }
        this.contentEl.empty();
    }

    private decide(confirmed: boolean): void {
        this.decided = true;
        this.onDecision(confirmed);
        this.close();
    }
}

/**
 * Modal for configuring and initiating a bulk import operation
 */
export class BulkImportModal extends Modal {
    private settings: BibliographyPluginSettings;
    private noteCreationService: NoteCreationService;
    private selectedFile: File | null = null;
    private selectedFileName: string = '';

    // Current state for settings within this modal
    private importSettings: BulkImportSettings;

    constructor(app: App, settings: BibliographyPluginSettings, noteCreationService: NoteCreationService) {
        super(app);
        this.settings = settings;
        this.noteCreationService = noteCreationService;
        
        // Initialize import settings from plugin settings
        this.importSettings = {
            attachmentHandling: settings.bulkImportAttachmentHandling,
            annoteToBody: settings.bulkImportAnnoteToBody,
            citekeyPreference: settings.bulkImportCitekeyPreference,
            conflictResolution: settings.bulkImportConflictResolution
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('bibliography-bulk-import-modal');

        // Modal title
        contentEl.createEl('h2', { text: 'Bulk import references' });

        // Warning message
        const warningEl = contentEl.createDiv({ cls: 'bulk-import-warning' });
        warningEl.createEl('p', { text: 'Warning: This operation may create or overwrite many files. Consider backing up your vault first.' });
        
        // Zotero export instructions
        const zoteroTipsEl = contentEl.createDiv({ cls: 'bulk-import-instructions' });
        zoteroTipsEl.createEl('h3', { text: 'Importing from Zotero' });
        
        const importSteps = zoteroTipsEl.createEl('ol');
        importSteps.createEl('li', { text: 'In Zotero, select items and use "export items..." (not better bibtex)' });
        importSteps.createEl('li', { text: 'Select format "bibtex" and check "export files"' });
        importSteps.createEl('li', { text: 'Save the exported bibliography.bib and files/ folder to your vault' });
        importSteps.createEl('li', { text: 'Select the bibliography.bib file in this dialog' });
        
        zoteroTipsEl.createEl('p', { 
            text: 'Important: You must move the entire export folder (with the files/ subdirectory) into your vault before importing to ensure attachments are found.'
        });

        // File selection
        new Setting(contentEl)
            .setName('Import file')
            .setDesc('Select a bibtex (.bib) or csl-JSON (.JSON) file to import')
            .addButton(button => button
                .setButtonText('Choose file')
                .onClick(() => {
                    // Create and trigger an input element to select a file
                    const input = activeDocument.createElement('input');
                    input.type = 'file';
                    input.accept = '.bib,.json';
                    input.multiple = false;
                    
                    input.onchange = () => {
                        const file = input.files?.[0];
                        if (file) {
                            this.selectedFile = file;
                            this.selectedFileName = file.name;
                            
                            // Update the UI to show the selected file
                            const fileInfoEl = contentEl.querySelector('.file-info');
                            if (fileInfoEl) {
                                fileInfoEl.textContent = `Selected: ${this.selectedFileName}`;
                                fileInfoEl.addClass('has-file');
                            }
                        }
                    };
                    
                    input.click();
                })
            );

        // File info display
        contentEl.createDiv({ cls: 'file-info', text: 'No file selected' });

        // Import settings
        contentEl.createEl('h3', { text: 'Import settings' });

        // Attachment handling
        new Setting(contentEl)
            .setName('Attachment handling')
            .setDesc('Choose how to handle attachments referenced in the import file')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'none': 'Ignore attachments',
                    'import': 'Import attachments to vault'
                })
                .setValue(this.importSettings.attachmentHandling)
                .onChange(value => {
                    this.importSettings.attachmentHandling = value as 'none' | 'import';
                })
            );

        // Annotations/Notes
        new Setting(contentEl)
            .setName('Include annotations')
            .setDesc('Include content from bibtex "annote" field in the body of literature notes')
            .addToggle(toggle => toggle
                .setValue(this.importSettings.annoteToBody)
                .onChange(value => {
                    this.importSettings.annoteToBody = value;
                })
            );

        // Citekey preference
        new Setting(contentEl)
            .setName('Citekey preference')
            .setDesc('Choose whether to use citekeys from the import file or generate new ones')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'imported': 'Use imported citekeys',
                    'generate': 'Generate new citekeys'
                })
                .setValue(this.importSettings.citekeyPreference)
                .onChange(value => {
                    this.importSettings.citekeyPreference = value as 'imported' | 'generate';
                })
            );

        // Conflict resolution
        new Setting(contentEl)
            .setName('Conflict resolution')
            .setDesc('What to do when a literature note with the same citekey already exists')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'skip': 'Skip existing notes',
                    'overwrite': 'Overwrite existing notes'
                })
                .setValue(this.importSettings.conflictResolution)
                .onChange(value => {
                    this.importSettings.conflictResolution = value as 'skip' | 'overwrite';
                })
            );

        // Import button
        const importButtonContainer = contentEl.createDiv({ cls: 'import-button-container' });
        const importButton = importButtonContainer.createEl('button', {
            text: 'Start import',
            cls: 'mod-cta'
        });
        
        importButton.onclick = async () => {
            if (!this.selectedFile) {
                new Notice('Please select a file to import');
                return;
            }
            
            // Confirm before proceeding
            if (!await this.confirmBulkImport()) {
                return;
            }
            
            // Disable the button during import
            importButton.disabled = true;
            importButton.textContent = 'Importing...';
            
            try {
                // Save current settings back to plugin settings
                this.settings.bulkImportAttachmentHandling = this.importSettings.attachmentHandling;
                this.settings.bulkImportAnnoteToBody = this.importSettings.annoteToBody;
                this.settings.bulkImportCitekeyPreference = this.importSettings.citekeyPreference;
                this.settings.bulkImportConflictResolution = this.importSettings.conflictResolution;
                
                // Read the file content
                const fileContent = await this.readFileContent(this.selectedFile);
                const fileExt = this.selectedFileName.split('.').pop()?.toLowerCase();
                
                // Handle attachment importing special case for web file picker
                if (this.importSettings.attachmentHandling === 'import') {
                    // Let user know about attachment importing limitation with file picker
                    new Notice('To import attachments, you need to use a file-based import method or move attachments to your vault first.', 5000);
                    
                    // Look for attachments in a standard Zotero export structure
                    if (this.selectedFile.name === 'bibliography.bib' || this.selectedFile.name.includes('export')) {
                        new Notice('Tip: If this is a Zotero export, make sure the "files" folder and bibtex file are both in your vault.', 5000);
                    }
                }
                
                // Start the import process
                await this.noteCreationService.bulkImportFromString(
                    fileContent, 
                    fileExt || '', 
                    this.selectedFileName,
                    this.importSettings
                );
                
                // Close the modal after successful import
                this.close();
            } catch (error) {
                console.error('Bulk import failed:', error);
                new Notice(`Import failed: ${errorMessage(error)}`);
                
                // Re-enable the button
                importButton.disabled = false;
                importButton.textContent = 'Start import';
            }
        };
    }

    /**
     * Read file content as text
     * @param file The file to read
     * @returns The file content as a string
     */
    private readFileContent(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else if (reader.result instanceof ArrayBuffer) {
                    // Convert ArrayBuffer to string if needed
                    const decoder = new TextDecoder('utf-8');
                    resolve(decoder.decode(reader.result));
                } else {
                    reject(new Error("Failed to read file content"));
                }
            };
            reader.onerror = () => reject(new Error(reader.error?.message || 'Failed to read file content'));
            reader.readAsText(file);
        });
    }

    private confirmBulkImport(): Promise<boolean> {
        return new Promise(resolve => {
            new BulkImportConfirmModal(this.app, resolve).open();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
