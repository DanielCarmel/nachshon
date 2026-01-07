import * as vscode from 'vscode';

/**
 * Provider for Nachshon RTL Custom Editor.
 * 
 * This provider uses a webview with CodeMirror to provide proper RTL support
 * for Hebrew code editing, which is not supported by VS Code's native Monaco editor.
 */
export class NachshonEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'nachshon.rtlEditor';

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Called when a custom editor is opened.
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Setup webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media'),
            ],
        };

        // Get configuration
        const config = vscode.workspace.getConfiguration('nachshon');
        const fontSize = config.get<number>('editor.fontSize', 14);
        const fontFamily = config.get<string>('editor.fontFamily', "'Courier New', monospace");
        const lineNumbers = config.get<boolean>('editor.lineNumbers', true);

        // Set the webview's HTML content
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, {
            fontSize,
            fontFamily,
            lineNumbers,
        });

        // Track if we're doing an internal update
        let isInternalChange = false;

        // Function to update webview content
        const updateWebview = () => {
            webviewPanel.webview.postMessage({
                type: 'update',
                content: document.getText(),
            });
        };

        // Hook up event handlers for document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                if (e.contentChanges.length > 0 && !isInternalChange) {
                    updateWebview();
                }
            }
        });

        // Clean up subscriptions when the panel is closed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        // Receive messages from the webview
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'ready':
                    // Webview is ready, send initial content
                    updateWebview();
                    break;
                    
                case 'edit':
                    // User made an edit in the webview
                    isInternalChange = true;
                    await this.applyEdit(document, message.content);
                    isInternalChange = false;
                    break;

                case 'save':
                    // User requested save (Ctrl+S in webview)
                    await document.save();
                    break;
            }
        });

        // Handle panel becoming visible
        webviewPanel.onDidChangeViewState(e => {
            if (e.webviewPanel.visible) {
                updateWebview();
            }
        });
    }

    /**
     * Apply an edit to the document
     */
    private async applyEdit(document: vscode.TextDocument, newContent: string): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        
        // Replace the entire document content
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            newContent
        );

        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Get the HTML content for the webview
     */
    private getHtmlForWebview(webview: vscode.Webview, config: {
        fontSize: number;
        fontFamily: string;
        lineNumbers: boolean;
    }): string {
        // Get URIs for local resources
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css')
        );

        const nonce = getNonce();

        // Use CodeMirror 5 from CDN for simplicity and reliability
        return /* html */ `
            <!DOCTYPE html>
            <html lang="he" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="
                    default-src 'none';
                    style-src ${webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com;
                    script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com;
                    font-src https://cdnjs.cloudflare.com;
                ">
                
                <!-- CodeMirror 5 CSS -->
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/fold/foldgutter.min.css">
                
                <!-- Custom styles -->
                <link href="${styleUri}" rel="stylesheet">
                
                <title>Nachshon Editor</title>
                <style>
                    :root {
                        --editor-font-size: ${config.fontSize}px;
                        --editor-font-family: ${config.fontFamily};
                    }
                    
                    /* Nachshon Dark Theme for CodeMirror */
                    .cm-s-nachshon-dark.CodeMirror {
                        background: var(--vscode-editor-background, #1e1e1e);
                        color: var(--vscode-editor-foreground, #d4d4d4);
                        direction: rtl;
                        text-align: right;
                        height: 100%;
                        font-weight: 600;
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-gutters {
                        background: var(--vscode-editorGutter-background, #1e1e1e);
                        border-right: 1px solid var(--vscode-editorGroup-border, #444);
                        border-left: none;
                        direction: ltr;
                        position: absolute;
                        right: 0;
                        left: auto !important;
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-linenumber {
                        color: var(--vscode-editorLineNumber-foreground, #858585);
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-cursor {
                        border-left: 2px solid var(--vscode-editorCursor-foreground, #aeafad);
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-activeline-background {
                        background: var(--vscode-editor-lineHighlightBackground, rgba(255, 255, 255, 0.1));
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-selected {
                        background: var(--vscode-editor-selectionBackground, #264f78);
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-focused .CodeMirror-selected {
                        background: var(--vscode-editor-selectionBackground, #264f78);
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-matchingbracket {
                        background: rgba(0, 100, 0, 0.3);
                        outline: 1px solid #888;
                        color: inherit !important;
                    }
                    
                    /* Syntax colors */
                    .cm-s-nachshon-dark .cm-keyword { color: #569cd6; font-weight: bold; }
                    .cm-s-nachshon-dark .cm-builtin { color: #dcdcaa; }
                    .cm-s-nachshon-dark .cm-variable { color: #9cdcfe; }
                    .cm-s-nachshon-dark .cm-variable-2 { color: #4fc1ff; }
                    .cm-s-nachshon-dark .cm-string { color: #ce9178; }
                    .cm-s-nachshon-dark .cm-number { color: #b5cea8; }
                    .cm-s-nachshon-dark .cm-comment { color: #6a9955; }
                    .cm-s-nachshon-dark .cm-operator { color: #d4d4d4; }
                    .cm-s-nachshon-dark .cm-punctuation { color: #d4d4d4; }
                    .cm-s-nachshon-dark .cm-atom { color: #569cd6; }
                    .cm-s-nachshon-dark .cm-def { color: #dcdcaa; }
                    .cm-s-nachshon-dark .cm-property { color: #9cdcfe; }
                    
                    /* RTL specific */
                    .cm-s-nachshon-dark .CodeMirror-lines {
                        direction: rtl;
                        text-align: right;
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-line {
                        direction: rtl;
                        text-align: right;
                        padding-right: 12px !important;
                        padding-left: 4px !important;
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-sizer {
                        direction: rtl;
                        margin-right: 0 !important;
                        margin-left: 48px !important;
                        padding-right: 0 !important;
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-scroll {
                        padding-right: 8px;
                        margin-right: 0;
                    }
                    
                    /* Move gutters to right side */
                    .cm-s-nachshon-dark .CodeMirror-gutter-wrapper {
                        left: auto !important;
                        right: 0 !important;
                    }
                    
                    .cm-s-nachshon-dark .CodeMirror-linenumber {
                        text-align: right;
                        padding-right: 8px;
                        padding-left: 4px;
                    }
                </style>
            </head>
            <body>
                <div id="editor-container"></div>
                
                <!-- CodeMirror 5 JS -->
                <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
                <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js"></script>
                <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js"></script>
                <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/selection/active-line.min.js"></script>
                <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/fold/foldcode.min.js"></script>
                <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/fold/foldgutter.min.js"></script>
                <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/fold/indent-fold.min.js"></script>
                
                <!-- Editor config -->
                <script nonce="${nonce}">
                    window.editorConfig = {
                        fontSize: ${config.fontSize},
                        fontFamily: "${config.fontFamily.replace(/"/g, '\\"')}",
                        lineNumbers: ${config.lineNumbers}
                    };
                </script>
                
                <!-- Our editor script -->
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

/**
 * Generate a nonce for Content Security Policy
 */
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
