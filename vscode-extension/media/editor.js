/**
 * Nachshon RTL Editor - Standalone CodeMirror Integration
 * 
 * This is a self-contained editor that loads CodeMirror from CDN
 * for immediate functionality without complex build steps.
 */

(function() {
    'use strict';

    // VS Code API
    const vscode = acquireVsCodeApi();
    
    // State management
    let editor = null;
    let isExternalUpdate = false;

    // Nachshon keywords for highlighting
    const nachshonKeywords = [
        'אם', 'אחרת', 'אחרת_אם', 'כל_עוד', 'לכל', 'ב', 'עצור', 'המשך', 'העבר',
        'פונקציה', 'מחלקה', 'החזר', 'למבדה', 'אמת', 'שקר', 'כלום', 'עצמי',
        'וגם', 'או', 'לא', 'נסה', 'תפוס', 'לבסוף', 'זרוק', 'טען',
        'עם', 'כ', 'ייבא', 'מ', 'גלובלי'
    ];

    const nachshonBuiltins = [
        'הדפס', 'קלט', 'אורך', 'טיפוס', 'בטווח', 'מספר_שלם', 'מספר_עשרוני',
        'מחרוזת', 'רשימה', 'מילון', 'קבוצה', 'סכום', 'מינימום', 'מקסימום',
        'ממוין', 'הפוך', 'כל', 'כלשהו', 'מפה', 'סנן', 'הוסף', 'הכנס', 'הסר'
    ];

    // Wait for CodeMirror to load
    function waitForCodeMirror(callback, maxAttempts = 50) {
        let attempts = 0;
        const check = () => {
            attempts++;
            if (typeof CodeMirror !== 'undefined') {
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.error('CodeMirror failed to load');
            }
        };
        check();
    }

    // Define Nachshon mode for CodeMirror 5
    function defineNachshonMode() {
        CodeMirror.defineMode('nachshon', function(config, parserConfig) {
            const keywords = new Set(nachshonKeywords);
            const builtins = new Set(nachshonBuiltins);

            function tokenize(stream, state) {
                // Skip whitespace
                if (stream.eatSpace()) return null;

                // Comments
                if (stream.match('#')) {
                    stream.skipToEnd();
                    return 'comment';
                }

                // Strings
                if (stream.match(/^"(?:[^"\\]|\\.)*"/) || stream.match(/^'(?:[^'\\]|\\.)*'/)) {
                    return 'string';
                }

                // Numbers
                if (stream.match(/^-?\d+\.?\d*/)) {
                    return 'number';
                }

                // Hebrew and ASCII identifiers
                if (stream.match(/^[\u0590-\u05FF_a-zA-Z][\u0590-\u05FF_a-zA-Z0-9]*/)) {
                    const word = stream.current();
                    if (keywords.has(word)) return 'keyword';
                    if (builtins.has(word)) return 'builtin';
                    if (word === 'אמת' || word === 'שקר') return 'atom';
                    if (word === 'כלום') return 'atom';
                    if (word === 'עצמי') return 'variable-2';
                    return 'variable';
                }

                // Operators
                if (stream.match(/^[+\-*\/%=<>!&|]+/)) {
                    return 'operator';
                }

                // Punctuation
                if (stream.match(/^[()[\]{}:,\.]/)) {
                    return 'punctuation';
                }

                // Advance if nothing matched
                stream.next();
                return null;
            }

            return {
                startState: function() {
                    return { indented: 0 };
                },
                token: tokenize,
                indent: function(state, textAfter) {
                    return state.indented;
                },
                electricInput: /^\s*[\}\]\)]$/,
                lineComment: '#',
                fold: 'indent'
            };
        });

        // Define MIME type
        CodeMirror.defineMIME('text/x-nachshon', 'nachshon');
    }

    // Initialize the editor
    function initEditor() {
        const container = document.getElementById('editor-container');
        if (!container) {
            console.error('Editor container not found');
            return;
        }

        const config = window.editorConfig || {
            fontSize: 14,
            fontFamily: "'Courier New', monospace",
            lineNumbers: true
        };

        // Define the mode first
        defineNachshonMode();

        // Create CodeMirror instance
        editor = CodeMirror(container, {
            mode: 'nachshon',
            theme: 'nachshon-dark',
            lineNumbers: config.lineNumbers,
            direction: 'rtl',
            rtlMoveVisually: true,
            lineWrapping: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            smartIndent: true,
            electricChars: true,
            autofocus: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            showCursorWhenSelecting: true,
            styleActiveLine: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            extraKeys: {
                'Ctrl-S': function() { vscode.postMessage({ type: 'save' }); },
                'Cmd-S': function() { vscode.postMessage({ type: 'save' }); },
                'Tab': function(cm) {
                    if (cm.somethingSelected()) {
                        cm.indentSelection('add');
                    } else {
                        cm.replaceSelection('    ', 'end');
                    }
                },
                'Shift-Tab': function(cm) {
                    cm.indentSelection('subtract');
                }
            }
        });

        // Set font styles
        const wrapper = editor.getWrapperElement();
        wrapper.style.fontSize = config.fontSize + 'px';
        wrapper.style.fontFamily = config.fontFamily;
        wrapper.style.height = '100%';

        // Listen for changes and notify VS Code
        editor.on('change', function(cm, change) {
            if (!isExternalUpdate && change.origin !== 'setValue') {
                vscode.postMessage({
                    type: 'edit',
                    content: cm.getValue()
                });
            }
        });

        // Tell VS Code we're ready
        vscode.postMessage({ type: 'ready' });
    }

    // Handle messages from VS Code
    window.addEventListener('message', function(event) {
        const message = event.data;

        switch (message.type) {
            case 'update':
                if (editor) {
                    isExternalUpdate = true;
                    const currentContent = editor.getValue();
                    if (currentContent !== message.content) {
                        const cursor = editor.getCursor();
                        const scrollInfo = editor.getScrollInfo();
                        editor.setValue(message.content);
                        editor.setCursor(cursor);
                        editor.scrollTo(scrollInfo.left, scrollInfo.top);
                    }
                    isExternalUpdate = false;
                }
                break;

            case 'focus':
                if (editor) {
                    editor.focus();
                }
                break;
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            waitForCodeMirror(initEditor);
        });
    } else {
        waitForCodeMirror(initEditor);
    }
})();
