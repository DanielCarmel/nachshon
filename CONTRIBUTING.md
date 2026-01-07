# 🤝 מדריך לתרומה לנחשון
# Contributing to Nachshon

תודה שאתם מעוניינים לתרום לנחשון! 🙏

Thank you for your interest in contributing to Nachshon! 🙏

---

## 📋 תוכן עניינים / Table of Contents

- [קוד התנהגות / Code of Conduct](#קוד-התנהגות--code-of-conduct)
- [איך לתרום / How to Contribute](#איך-לתרום--how-to-contribute)
- [פיתוח מקומי / Local Development](#פיתוח-מקומי--local-development)
- [הנחיות קוד / Code Guidelines](#הנחיות-קוד--code-guidelines)
- [בדיקות / Testing](#בדיקות--testing)
- [Pull Requests](#pull-requests)
- [דיווח על באגים / Bug Reports](#דיווח-על-באגים--bug-reports)
- [הצעות לתכונות / Feature Requests](#הצעות-לתכונות--feature-requests)

---

## 🎯 קוד התנהגות / Code of Conduct

אנו מחויבים לספק סביבה פתוחה ומכבדת לכולם. אנא נהגו בכבוד עם כל חברי הקהילה.

We are committed to providing a welcoming and respectful environment for everyone. Please treat all community members with respect.

---

## 💡 איך לתרום / How to Contribute

### סוגי תרומות / Types of Contributions

1. **תיקוני באגים / Bug Fixes** - תקנו בעיות קיימות
2. **תכונות חדשות / New Features** - הוסיפו פונקציונליות חדשה
3. **תיעוד / Documentation** - שפרו את התיעוד
4. **בדיקות / Tests** - הוסיפו בדיקות חדשות
5. **דוגמאות / Examples** - צרו תוכניות לדוגמה
6. **תרגומים / Translations** - תרגמו הודעות שגיאה

---

## 🛠️ פיתוח מקומי / Local Development

### דרישות מקדימות / Prerequisites

- Python 3.9+
- Git

### התקנה / Installation

```bash
# שכפול המאגר / Clone the repository
git clone https://github.com/nachshon-lang/nachshon.git
cd nachshon

# יצירת סביבה וירטואלית / Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# או / or
venv\Scripts\activate  # Windows

# התקנת תלויות / Install dependencies
pip install -r requirements.txt
pip install pytest pytest-cov
```

### הרצת הפרויקט / Running the Project

```bash
# הרצת קובץ לדוגמה / Run an example file
python src/cli.py run examples/01_שלום_עולם.נח

# הפעלת REPL
python src/cli.py repl

# הרצת בדיקות / Run tests
cd tests && python -m pytest -v
```

---

## 📝 הנחיות קוד / Code Guidelines

### סגנון קוד / Code Style

- השתמשו ב-4 רווחים להזחה (לא tabs)
- אורך שורה מקסימלי: 100 תווים
- כתבו docstrings לפונקציות ומחלקות
- הערות בעברית ו/או אנגלית

### מבנה הפרויקט / Project Structure

```
nachshon/
├── src/
│   ├── lexer.py      # מנתח לקסיקלי
│   ├── parser.py     # מנתח תחבירי
│   ├── transpiler.py # ממיר לפייתון
│   ├── cli.py        # ממשק שורת פקודה
│   └── loader.py     # מטען מודולים
├── tests/
│   ├── test_lexer.py
│   ├── test_parser.py
│   ├── test_transpiler.py
│   └── test_cli.py
├── examples/         # קבצי דוגמה
└── vscode-extension/ # תוסף VS Code
```

### הוספת מילת מפתח חדשה / Adding a New Keyword

1. הוסיפו את הטוקן ב-`lexer.py` ב-`TokenType`
2. הוסיפו את המיפוי העברי ב-`HEBREW_KEYWORDS`
3. הוסיפו את הניתוח ב-`parser.py`
4. הוסיפו את ההמרה ב-`transpiler.py`
5. צרו בדיקות ב-`tests/`
6. צרו דוגמה ב-`examples/`

---

## ✅ בדיקות / Testing

### הרצת בדיקות / Running Tests

```bash
# כל הבדיקות / All tests
cd tests && python -m pytest -v

# בדיקות ספציפיות / Specific tests
python -m pytest test_lexer.py -v
python -m pytest test_parser.py -v

# עם כיסוי קוד / With coverage
python -m pytest --cov=../src --cov-report=html
```

### כתיבת בדיקות / Writing Tests

- כתבו בדיקות לכל תכונה חדשה
- כסו מקרי קצה ושגיאות
- השתמשו בשמות תיאוריים

```python
def test_feature_description():
    """תיאור הבדיקה בעברית"""
    # Arrange
    code = "קוד נחשון לבדיקה"
    
    # Act
    result = function_to_test(code)
    
    # Assert
    assert result == expected
```

---

## 🔄 Pull Requests

### תהליך / Process

1. **Fork** את המאגר
2. צרו **Branch** חדש: `git checkout -b feature/my-feature`
3. בצעו **Commit** לשינויים: `git commit -m "תיאור השינוי"`
4. **Push** לענף: `git push origin feature/my-feature`
5. פתחו **Pull Request**

### תבנית PR / PR Template

```markdown
## תיאור / Description
תיאור קצר של השינויים

## סוג שינוי / Type of Change
- [ ] תיקון באג / Bug fix
- [ ] תכונה חדשה / New feature
- [ ] שינוי שובר / Breaking change
- [ ] תיעוד / Documentation

## בדיקות / Testing
תיאור הבדיקות שבוצעו

## רשימת משימות / Checklist
- [ ] הקוד עובר את כל הבדיקות
- [ ] נוספו בדיקות חדשות
- [ ] התיעוד עודכן
```

---

## 🐛 דיווח על באגים / Bug Reports

### מה לכלול / What to Include

1. **תיאור הבאג** - מה לא עובד?
2. **שלבים לשחזור** - איך להגיע לבעיה?
3. **התנהגות צפויה** - מה אמור לקרות?
4. **התנהגות בפועל** - מה באמת קורה?
5. **סביבה** - מערכת הפעלה, גרסת Python

### דוגמה / Example

```markdown
## תיאור הבאג
הפקודה `הדפס` לא עובדת עם מספרים שליליים

## שלבים לשחזור
1. צור קובץ עם: `הדפס(-5)`
2. הרץ עם `nachshon run file.נח`

## התנהגות צפויה
הדפסת `-5`

## התנהגות בפועל
שגיאה: "ביטוי לא צפוי"

## סביבה
- macOS 13.0
- Python 3.11
```

---

## 💭 הצעות לתכונות / Feature Requests

נשמח לשמוע רעיונות חדשים! אנא כללו:

1. **תיאור התכונה** - מה אתם רוצים?
2. **מוטיבציה** - למה זה חשוב?
3. **דוגמה** - איך זה ייראה?

---

## 🏆 תורמים / Contributors

תודה לכל התורמים לפרויקט! 💚

---

## 📧 יצירת קשר / Contact

- פתחו Issue ב-GitHub
- שלחו email ל: nachshon@example.com

---

## 📜 רישיון / License

התרומות שלכם יהיו תחת רישיון MIT, כמו שאר הפרויקט.

Your contributions will be under the MIT License, same as the rest of the project.

---

שוב תודה על התרומה שלכם! 🙏✨

Thank you again for your contribution! 🙏✨
