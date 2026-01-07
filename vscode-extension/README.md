# Nachshon VS Code Extension

עורך קוד RTL מלא עבור שפת התכנות נחשון בעברית.

A full RTL code editor for the Nachshon Hebrew programming language.

## ✨ Features

### 🔄 True RTL Editing
Unlike standard VS Code which struggles with RTL text, this extension uses a **Custom Editor** approach with CodeMirror that provides:
- **Correct cursor movement** - Arrow keys move in the right direction
- **Proper text selection** - Select text naturally from right to left
- **Natural typing flow** - Hebrew text flows correctly from right to left

### 🎨 Syntax Highlighting
Full syntax highlighting for Nachshon keywords:
- **מילות מפתח**: `פונקציה`, `מחלקה`, `אם`, `אחרת`, `כל_עוד`, `לכל`, etc.
- **ערכים**: `אמת`, `שקר`, `כלום`
- **פונקציות מובנות**: `הדפס`, `קלט`, `אורך`, etc.
- **מחרוזות, מספרים, והערות**

### ▶️ Run Nachshon Files
Run your Nachshon code directly from VS Code with the play button or command palette.

## 📦 Installation

### From VSIX (Local)
1. Build the extension:
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   npm run package
   ```
2. Install the generated `.vsix` file:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Install from VSIX"
   - Select the `.vsix` file

### From Marketplace (Coming Soon)
Search for "Nachshon" in the VS Code Extensions marketplace.

## 🚀 Usage

1. Open any `.נח` or `.nach` file
2. The RTL editor will automatically activate
3. Start coding in Hebrew!

### Commands
- **Nachshon: Run File** - Execute the current Nachshon file
- **Nachshon: Open with RTL Editor** - Open file with the custom RTL editor
- **Nachshon: Open with Default Editor** - Open file with standard VS Code editor

## ⚙️ Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `nachshon.pythonPath` | Path to Python interpreter | `python3` |
| `nachshon.nachshonPath` | Path to nachshon.py | Auto-detect |
| `nachshon.editor.fontSize` | Font size in the RTL editor | `14` |
| `nachshon.editor.fontFamily` | Font family | `'Courier New', monospace` |
| `nachshon.editor.lineNumbers` | Show line numbers | `true` |

## 🏗️ Architecture

This extension uses a "Custom Editor" approach to solve VS Code's RTL limitations:

```
┌─────────────────────────────────────────────────────┐
│                    VS Code                          │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │           Custom Editor (Webview)            │   │
│  │  ┌───────────────────────────────────────┐  │   │
│  │  │         CodeMirror Editor             │  │   │
│  │  │         (RTL Mode Enabled)            │  │   │
│  │  │                                       │  │   │
│  │  │   פונקציה שלום():                     │  │   │
│  │  │       הדפס("שלום עולם!")              │  │   │
│  │  │                                       │  │   │
│  │  └───────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
│                        │                            │
│                        ▼                            │
│              Extension Host (TS)                    │
│                        │                            │
│                        ▼                            │
│              Document Sync & Commands               │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
cd vscode-extension
npm install
```

### Build
```bash
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Package
```bash
npm run package
```

### Debug
1. Open the `vscode-extension` folder in VS Code
2. Press F5 to launch the Extension Development Host
3. Open a `.נח` file to test

## 📝 License

MIT License - See LICENSE file for details.

## 🙏 Credits

- **CodeMirror** - The excellent editor framework that makes RTL possible
- **Nachshon Language** - The Hebrew programming language this extension supports
