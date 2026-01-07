/**
 * Nachshon RTL Editor - CodeMirror 6 Integration
 * 
 * This file creates a CodeMirror 6 editor instance with full RTL support
 * for the Nachshon Hebrew programming language.
 */

import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, crosshairCursor, highlightSpecialChars, dropCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { bracketMatching, indentOnInput, foldGutter, foldKeymap, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { tags } from '@lezer/highlight';
import { nachshonLanguage, nachshonCompletion } from './nachshon-language';

// VS Code API
declare const acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
};

const vscode = acquireVsCodeApi();

// Configuration compartment for dynamic updates
const themeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

// Track if we're updating from VS Code to prevent loops
let isExternalUpdate = false;

/**
 * Nachshon syntax highlighting theme
 */
const nachshonHighlightStyle = HighlightStyle.define([
    // Keywords - Hebrew control words
    { tag: tags.keyword, color: '#569cd6', fontWeight: 'bold' },
    { tag: tags.controlKeyword, color: '#c586c0', fontWeight: 'bold' },
    
    // Definitions
    { tag: tags.definition(tags.variableName), color: '#9cdcfe' },
    { tag: tags.definition(tags.function(tags.variableName)), color: '#dcdcaa' },
    { tag: tags.definition(tags.className), color: '#4ec9b0' },
    
    // Variables and properties
    { tag: tags.variableName, color: '#9cdcfe' },
    { tag: tags.propertyName, color: '#9cdcfe' },
    { tag: tags.function(tags.variableName), color: '#dcdcaa' },
    
    // Types
    { tag: tags.typeName, color: '#4ec9b0' },
    { tag: tags.className, color: '#4ec9b0' },
    
    // Literals
    { tag: tags.string, color: '#ce9178' },
    { tag: tags.number, color: '#b5cea8' },
    { tag: tags.bool, color: '#569cd6' },
    { tag: tags.null, color: '#569cd6' },
    
    // Comments
    { tag: tags.comment, color: '#6a9955', fontStyle: 'italic' },
    { tag: tags.lineComment, color: '#6a9955', fontStyle: 'italic' },
    { tag: tags.blockComment, color: '#6a9955', fontStyle: 'italic' },
    
    // Operators and punctuation
    { tag: tags.operator, color: '#d4d4d4' },
    { tag: tags.punctuation, color: '#d4d4d4' },
    { tag: tags.bracket, color: '#ffd700' },
    { tag: tags.paren, color: '#da70d6' },
    { tag: tags.squareBracket, color: '#179fff' },
    { tag: tags.brace, color: '#ffd700' },
    
    // Special
    { tag: tags.self, color: '#569cd6' },
    { tag: tags.special(tags.variableName), color: '#4fc1ff' },
]);

/**
 * RTL Theme for CodeMirror
 */
const rtlTheme = EditorView.theme({
    '&': {
        direction: 'rtl',
        textAlign: 'right',
        height: '100%',
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        color: 'var(--vscode-editor-foreground, #d4d4d4)',
    },
    '.cm-scroller': {
        direction: 'rtl',
        textAlign: 'right',
        fontFamily: 'var(--editor-font-family)',
        fontSize: 'var(--editor-font-size)',
        lineHeight: '1.5',
    },
    '.cm-content': {
        direction: 'rtl',
        textAlign: 'right',
        caretColor: 'var(--vscode-editorCursor-foreground, #aeafad)',
    },
    '.cm-line': {
        direction: 'rtl',
        textAlign: 'right',
        paddingRight: '4px',
        paddingLeft: '4px',
    },
    '.cm-gutters': {
        direction: 'ltr',
        backgroundColor: 'var(--vscode-editorGutter-background, #1e1e1e)',
        borderLeft: '1px solid var(--vscode-editorGroup-border, #444)',
        borderRight: 'none',
        color: 'var(--vscode-editorLineNumber-foreground, #858585)',
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'var(--vscode-editor-lineHighlightBackground, rgba(255, 255, 255, 0.1))',
    },
    '.cm-activeLine': {
        backgroundColor: 'var(--vscode-editor-lineHighlightBackground, rgba(255, 255, 255, 0.1))',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        backgroundColor: 'var(--vscode-editor-selectionBackground, #264f78)',
    },
    '.cm-cursor': {
        borderLeftColor: 'var(--vscode-editorCursor-foreground, #aeafad)',
        borderLeftWidth: '2px',
    },
});

/**
 * Create the CodeMirror editor
 */
function createEditor(container: HTMLElement, initialContent: string = ''): EditorView {
    const config = (window as any).editorConfig || {
        fontSize: 14,
        fontFamily: "'Courier New', monospace",
        lineNumbers: true,
    };

    const extensions = [
        // Basic setup
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        highlightSelectionMatches(),
        highlightSpecialChars(),
        
        // Line numbers (conditional)
        ...(config.lineNumbers ? [lineNumbers(), lintGutter()] : []),
        
        // Folding
        foldGutter({
            openText: '▼',
            closedText: '◀',
        }),
        
        // Keymaps
        keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            ...completionKeymap,
            ...closeBracketsKeymap,
            ...foldKeymap,
            indentWithTab,
            // Save command (Ctrl+S / Cmd+S)
            {
                key: 'Mod-s',
                run: () => {
                    vscode.postMessage({ type: 'save' });
                    return true;
                },
            },
        ]),
        
        // Nachshon language support
        nachshonLanguage(),
        nachshonCompletion,
        syntaxHighlighting(nachshonHighlightStyle),
        
        // RTL Theme
        themeCompartment.of(rtlTheme),
        
        // Update listener - send changes to VS Code
        EditorView.updateListener.of((update) => {
            if (update.docChanged && !isExternalUpdate) {
                const content = update.state.doc.toString();
                vscode.postMessage({
                    type: 'edit',
                    content: content,
                });
            }
        }),
    ];

    const state = EditorState.create({
        doc: initialContent,
        extensions,
    });

    return new EditorView({
        state,
        parent: container,
    });
}

// Initialize editor when DOM is ready
let editor: EditorView | null = null;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('editor-container');
    if (!container) {
        console.error('Editor container not found');
        return;
    }

    // Create the editor
    editor = createEditor(container, '');
    
    // Tell VS Code we're ready
    vscode.postMessage({ type: 'ready' });
});

// Handle messages from VS Code
window.addEventListener('message', (event) => {
    const message = event.data;
    
    switch (message.type) {
        case 'update':
            // Update editor content from VS Code
            if (editor) {
                isExternalUpdate = true;
                const currentContent = editor.state.doc.toString();
                if (currentContent !== message.content) {
                    editor.dispatch({
                        changes: {
                            from: 0,
                            to: currentContent.length,
                            insert: message.content,
                        },
                    });
                }
                isExternalUpdate = false;
            }
            break;
            
        case 'diagnostics':
            // Handle diagnostics from VS Code
            // TODO: Implement lint markers
            console.log('Received diagnostics:', message.diagnostics);
            break;
    }
});

// Focus editor when window gains focus
window.addEventListener('focus', () => {
    if (editor) {
        editor.focus();
    }
});
