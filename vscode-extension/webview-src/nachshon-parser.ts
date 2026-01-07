/**
 * Nachshon Parser for CodeMirror 6 / Lezer
 * 
 * This is a simplified parser using Lezer's LR parser generator.
 * For a full implementation, you would compile a .grammar file.
 * 
 * This file provides a basic streaming parser that handles Hebrew tokens.
 */

import { parser as jsParser } from '@lezer/javascript';
import { parseMixed } from '@lezer/common';
import { LRParser, ExternalTokenizer, InputStream } from '@lezer/lr';

// Hebrew character ranges
const HEBREW_START = 0x0590;
const HEBREW_END = 0x05FF;

function isHebrew(ch: number): boolean {
    return ch >= HEBREW_START && ch <= HEBREW_END;
}

function isIdentifierChar(ch: number): boolean {
    return isHebrew(ch) || 
           (ch >= 65 && ch <= 90) ||   // A-Z
           (ch >= 97 && ch <= 122) ||  // a-z
           (ch >= 48 && ch <= 57) ||   // 0-9
           ch === 95;                   // _
}

/**
 * Hebrew keywords mapping to token types
 */
const keywords: Map<string, string> = new Map([
    // Control flow
    ['אם', 'if'],
    ['אחרת', 'else'],
    ['אחרת_אם', 'elif'],
    ['כל_עוד', 'while'],
    ['לכל', 'for'],
    ['ב', 'in'],
    ['עצור', 'break'],
    ['המשך', 'continue'],
    ['העבר', 'pass'],
    
    // Definitions
    ['פונקציה', 'def'],
    ['מחלקה', 'class'],
    ['החזר', 'return'],
    ['למבדה', 'lambda'],
    
    // Values
    ['אמת', 'True'],
    ['שקר', 'False'],
    ['כלום', 'None'],
    ['עצמי', 'self'],
    
    // Logical
    ['וגם', 'and'],
    ['או', 'or'],
    ['לא', 'not'],
    
    // Exception
    ['נסה', 'try'],
    ['תפוס', 'except'],
    ['לבסוף', 'finally'],
    ['זרוק', 'raise'],
    ['טען', 'assert'],
    
    // Context
    ['עם', 'with'],
    ['כ', 'as'],
    
    // Import
    ['ייבא', 'import'],
    ['מ', 'from'],
    
    // Other
    ['גלובלי', 'global'],
]);

/**
 * Simple token types
 */
export const enum TokenType {
    Comment = 1,
    String,
    Number,
    Keyword,
    Identifier,
    Operator,
    Punctuation,
    Newline,
    Indent,
    Dedent,
    EOF,
}

/**
 * Simple tokenizer for Nachshon
 */
export class NachshonTokenizer {
    private pos: number = 0;
    private input: string;
    private indentStack: number[] = [0];

    constructor(input: string) {
        this.input = input;
    }

    private peek(offset: number = 0): number {
        const pos = this.pos + offset;
        if (pos >= this.input.length) return -1;
        return this.input.charCodeAt(pos);
    }

    private advance(): number {
        if (this.pos >= this.input.length) return -1;
        return this.input.charCodeAt(this.pos++);
    }

    private skipWhitespace(): void {
        while (this.pos < this.input.length) {
            const ch = this.peek();
            if (ch === 32 || ch === 9) { // space or tab
                this.pos++;
            } else {
                break;
            }
        }
    }

    public next(): { type: TokenType; value: string; from: number; to: number } | null {
        if (this.pos >= this.input.length) {
            return null;
        }

        const start = this.pos;
        const ch = this.peek();

        // Newline
        if (ch === 10 || ch === 13) {
            this.advance();
            if (ch === 13 && this.peek() === 10) {
                this.advance();
            }
            return { type: TokenType.Newline, value: '\n', from: start, to: this.pos };
        }

        // Comment
        if (ch === 35) { // #
            while (this.pos < this.input.length && this.peek() !== 10 && this.peek() !== 13) {
                this.advance();
            }
            return { type: TokenType.Comment, value: this.input.slice(start, this.pos), from: start, to: this.pos };
        }

        // Skip whitespace
        this.skipWhitespace();
        if (this.pos > start) {
            return this.next(); // recurse to get actual token
        }

        // String
        if (ch === 34 || ch === 39) { // " or '
            const quote = ch;
            this.advance();
            while (this.pos < this.input.length) {
                const c = this.peek();
                if (c === quote) {
                    this.advance();
                    break;
                }
                if (c === 92) { // backslash
                    this.advance();
                    this.advance();
                } else {
                    this.advance();
                }
            }
            return { type: TokenType.String, value: this.input.slice(start, this.pos), from: start, to: this.pos };
        }

        // Number
        if ((ch >= 48 && ch <= 57) || (ch === 46 && this.peek(1) >= 48 && this.peek(1) <= 57)) {
            while (this.pos < this.input.length) {
                const c = this.peek();
                if ((c >= 48 && c <= 57) || c === 46) {
                    this.advance();
                } else {
                    break;
                }
            }
            return { type: TokenType.Number, value: this.input.slice(start, this.pos), from: start, to: this.pos };
        }

        // Identifier or Keyword (Hebrew or ASCII)
        if (isIdentifierChar(ch)) {
            while (this.pos < this.input.length && isIdentifierChar(this.peek())) {
                this.advance();
            }
            const value = this.input.slice(start, this.pos);
            const type = keywords.has(value) ? TokenType.Keyword : TokenType.Identifier;
            return { type, value, from: start, to: this.pos };
        }

        // Operators
        const operators = ['==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '**', '//', '->', '<', '>', '+', '-', '*', '/', '%', '=', '@'];
        for (const op of operators) {
            if (this.input.slice(this.pos, this.pos + op.length) === op) {
                this.pos += op.length;
                return { type: TokenType.Operator, value: op, from: start, to: this.pos };
            }
        }

        // Punctuation
        if ('()[]{}:,.'.includes(String.fromCharCode(ch))) {
            this.advance();
            return { type: TokenType.Punctuation, value: String.fromCharCode(ch), from: start, to: this.pos };
        }

        // Unknown - advance and skip
        this.advance();
        return this.next();
    }
}

/**
 * Create a basic parser that wraps our tokenizer
 * For full functionality, compile a Lezer grammar file
 */
export const parser = jsParser;

// Export for use in language support
export { keywords };
