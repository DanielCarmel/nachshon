/**
 * Build script for Nachshon webview editor
 * 
 * This script bundles the CodeMirror editor and all dependencies
 * into a single file for use in the VS Code webview.
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '..', 'media');
const srcDir = path.join(__dirname, '..', 'webview-src');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

async function build() {
    try {
        // Bundle the editor
        await esbuild.build({
            entryPoints: [path.join(srcDir, 'editor.ts')],
            bundle: true,
            minify: process.env.NODE_ENV === 'production',
            sourcemap: process.env.NODE_ENV !== 'production',
            outfile: path.join(outDir, 'editor.js'),
            format: 'iife',
            target: ['es2020'],
            define: {
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            },
            loader: {
                '.ts': 'ts',
            },
        });

        console.log('✓ Webview editor built successfully');
    } catch (error) {
        console.error('✗ Build failed:', error);
        process.exit(1);
    }
}

build();
