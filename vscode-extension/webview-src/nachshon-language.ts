/**
 * Nachshon Language Support for CodeMirror 6
 * 
 * This module provides syntax highlighting and autocompletion
 * for the Nachshon Hebrew programming language.
 */

import { parser } from './nachshon-parser';
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from '@codemirror/language';
import { styleTags, tags } from '@lezer/highlight';
import { CompletionContext, autocompletion, Completion } from '@codemirror/autocomplete';

/**
 * Nachshon keywords in Hebrew
 */
export const nachshonKeywords: { [key: string]: string } = {
    // Control flow
    'אם': 'if - תנאי',
    'אחרת': 'else - אחרת',
    'אחרת_אם': 'elif - אחרת אם',
    'כל_עוד': 'while - לולאת כל עוד',
    'לכל': 'for - לולאת לכל',
    'ב': 'in - בתוך',
    'עצור': 'break - עצור לולאה',
    'המשך': 'continue - המשך לולאה',
    'העבר': 'pass - העבר',
    
    // Definitions
    'פונקציה': 'def - הגדרת פונקציה',
    'מחלקה': 'class - הגדרת מחלקה',
    'החזר': 'return - החזר ערך',
    'למבדה': 'lambda - פונקציה אנונימית',
    
    // Values
    'אמת': 'True - ערך אמת',
    'שקר': 'False - ערך שקר',
    'כלום': 'None - ערך ריק',
    'עצמי': 'self - התייחסות עצמית',
    
    // Logical operators
    'וגם': 'and - וגם',
    'או': 'or - או',
    'לא': 'not - לא',
    
    // Exception handling
    'נסה': 'try - נסה',
    'תפוס': 'except - תפוס שגיאה',
    'לבסוף': 'finally - לבסוף',
    'זרוק': 'raise - זרוק שגיאה',
    'טען': 'assert - טען',
    
    // Context managers
    'עם': 'with - עם',
    'כ': 'as - כ',
    
    // Imports
    'ייבא': 'import - ייבא',
    'מ': 'from - מ',
    
    // Other
    'גלובלי': 'global - משתנה גלובלי',
    'בטווח': 'range - טווח מספרים',
    'אורך': 'len - אורך',
    'הדפס': 'print - הדפס',
    'קלט': 'input - קלט',
    'טיפוס': 'type - טיפוס',
    'מספר_שלם': 'int - מספר שלם',
    'מספר_עשרוני': 'float - מספר עשרוני',
    'מחרוזת': 'str - מחרוזת',
    'רשימה': 'list - רשימה',
    'מילון': 'dict - מילון',
    'קבוצה': 'set - קבוצה',
};

/**
 * Built-in functions
 */
export const builtinFunctions: string[] = [
    'הדפס', 'קלט', 'אורך', 'טיפוס', 'בטווח',
    'מספר_שלם', 'מספר_עשרוני', 'מחרוזת', 'רשימה', 'מילון', 'קבוצה',
    'סכום', 'מינימום', 'מקסימום', 'ממוין', 'הפוך',
    'כל', 'כלשהו', 'מפה', 'סנן', 'צמצם',
    'פתח', 'קרא', 'כתוב', 'סגור',
    'הוסף', 'הכנס', 'הסר', 'מחק', 'נקה',
];

/**
 * Create Nachshon language support
 */
export function nachshonLanguage(): LanguageSupport {
    const lang = LRLanguage.define({
        parser: parser.configure({
            props: [
                indentNodeProp.add({
                    Block: delimitedIndent({ closing: ':' }),
                    'IfStatement WhileStatement ForStatement FunctionDef ClassDef TryStatement WithStatement': (context) => {
                        return context.column(context.node.from) + context.unit;
                    },
                }),
                foldNodeProp.add({
                    Block: foldInside,
                    'IfStatement WhileStatement ForStatement FunctionDef ClassDef TryStatement WithStatement': foldInside,
                }),
                styleTags({
                    // Keywords
                    'אם אחרת אחרת_אם': tags.controlKeyword,
                    'כל_עוד לכל ב עצור המשך העבר': tags.controlKeyword,
                    'פונקציה מחלקה החזר למבדה': tags.keyword,
                    'נסה תפוס לבסוף זרוק טען': tags.controlKeyword,
                    'עם כ': tags.keyword,
                    'ייבא מ': tags.keyword,
                    'וגם או לא': tags.operatorKeyword,
                    'גלובלי': tags.keyword,
                    
                    // Values
                    'אמת שקר': tags.bool,
                    'כלום': tags.null,
                    'עצמי': tags.self,
                    
                    // Literals
                    'String': tags.string,
                    'Number': tags.number,
                    'Comment': tags.comment,
                    
                    // Identifiers
                    'FunctionName': tags.function(tags.definition(tags.variableName)),
                    'ClassName': tags.definition(tags.className),
                    'VariableName': tags.variableName,
                    'PropertyName': tags.propertyName,
                    
                    // Operators
                    'ArithOp': tags.arithmeticOperator,
                    'CompareOp': tags.compareOperator,
                    'AssignOp': tags.definitionOperator,
                    
                    // Brackets
                    '( )': tags.paren,
                    '[ ]': tags.squareBracket,
                    '{ }': tags.brace,
                    ':': tags.punctuation,
                    ',': tags.punctuation,
                    '.': tags.punctuation,
                }),
            ],
        }),
        languageData: {
            commentTokens: { line: '#' },
            closeBrackets: { brackets: ['(', '[', '{', '"', "'"] },
            indentOnInput: /^\s*[\}\]\)]$/,
        },
    });

    return new LanguageSupport(lang);
}

/**
 * Autocomplete for Nachshon
 */
function nachshonCompletions(context: CompletionContext) {
    const word = context.matchBefore(/[\u0590-\u05FF\w]*/);
    if (!word || (word.from === word.to && !context.explicit)) {
        return null;
    }

    const completions: Completion[] = [];

    // Add keywords
    for (const [keyword, description] of Object.entries(nachshonKeywords)) {
        completions.push({
            label: keyword,
            type: 'keyword',
            detail: description,
            boost: 1,
        });
    }

    // Add builtin functions
    for (const func of builtinFunctions) {
        completions.push({
            label: func,
            type: 'function',
            detail: 'פונקציה מובנית',
            apply: func + '(',
        });
    }

    return {
        from: word.from,
        options: completions,
        validFor: /^[\u0590-\u05FF\w]*$/,
    };
}

export const nachshonCompletion = autocompletion({
    override: [nachshonCompletions],
    icons: true,
});
