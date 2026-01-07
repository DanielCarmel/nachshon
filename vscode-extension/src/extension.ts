import * as vscode from 'vscode';
import { NachshonEditorProvider } from './nachshonEditorProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Nachshon RTL Editor extension is now active!');

    // Register the custom editor provider
    const provider = new NachshonEditorProvider(context);
    
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            NachshonEditorProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            }
        )
    );

    // Register command to run Nachshon files
    context.subscriptions.push(
        vscode.commands.registerCommand('nachshon.runFile', async () => {
            const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
            
            let filePath: string | undefined;
            
            if (activeTab?.input && typeof (activeTab.input as any).uri !== 'undefined') {
                filePath = (activeTab.input as any).uri.fsPath;
            }

            if (!filePath) {
                vscode.window.showErrorMessage('No Nachshon file is currently open');
                return;
            }

            const config = vscode.workspace.getConfiguration('nachshon');
            const pythonPath = config.get<string>('pythonPath', 'python3');
            let nachshonPath = config.get<string>('nachshonPath', '');

            // Auto-detect nachshon.py if not configured
            if (!nachshonPath) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                    for (const folder of workspaceFolders) {
                        const possiblePath = vscode.Uri.joinPath(folder.uri, 'nachshon.py');
                        try {
                            await vscode.workspace.fs.stat(possiblePath);
                            nachshonPath = possiblePath.fsPath;
                            break;
                        } catch {
                            // File doesn't exist, continue
                        }
                    }
                }
            }

            if (!nachshonPath) {
                vscode.window.showErrorMessage('Could not find nachshon.py. Please configure nachshon.nachshonPath in settings.');
                return;
            }

            const terminal = vscode.window.createTerminal('Nachshon');
            terminal.show();
            terminal.sendText(`${pythonPath} "${nachshonPath}" "${filePath}"`);
        })
    );

    // Register command to open with RTL editor
    context.subscriptions.push(
        vscode.commands.registerCommand('nachshon.openWithRtlEditor', async (uri: vscode.Uri) => {
            if (uri) {
                await vscode.commands.executeCommand('vscode.openWith', uri, NachshonEditorProvider.viewType);
            }
        })
    );

    // Register command to open with default editor
    context.subscriptions.push(
        vscode.commands.registerCommand('nachshon.openWithDefaultEditor', async (uri: vscode.Uri) => {
            if (uri) {
                await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
            }
        })
    );
}

export function deactivate() {
    console.log('Nachshon RTL Editor extension deactivated');
}
