import { RESWORDSANDSYM } from "./constants";

class LexicalAnalyzer {
  constructor({ input }) {
    this.input = [...input];
    this.scanIndex = 0;
    this.ch = this.input[this.scanIndex];
    this.lineNum = 1;
  }

  lexemeCheck(lexeme, lineNumber) {
    let data = {
      lexeme: lexeme,
      token: undefined,
      attribute: undefined,
      line: lineNumber,
    };

    if (Object.keys(RESWORDSANDSYM).includes(lexeme)) {
      const token = RESWORDSANDSYM[lexeme];
      data = {
        lexeme: lexeme,
        token,
        attribute: undefined,
        line: lineNumber,
      };
      return data;
    }

    if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(lexeme)) {
      if (lexeme.length > 17) {
        data = {
          ...data,
          lexeme: lexeme.slice(0, 17),
          attribute: lexeme,
        };
      } else {
        data = {
          lexeme,
          attribute: lexeme,
          line: lineNumber,
        };
      }
      data.token = "idT";
    } else if (/^[0-9_]+(\.[0-9_]+)?$/.test(lexeme)) {
      data.token = lexeme.includes(".") ? "valueR" : "value";
      data = {
        ...data,
        attribute: lexeme,
        lexeme: lexeme,
        line: lineNumber,
      };
    }
    return data;
  }

  checkIdT(lexeme) {
    const regex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    return regex.test(lexeme);
  }

  lookAhead() {
    if (this.scanIndex + 1 < this.input.length) {
      return this.input[this.scanIndex + 1];
    }
    return null;
  }

  checkDoubleToken(currentChar, nextChar) {
    const doubleToken = currentChar + nextChar;
    if (Object.keys(RESWORDSANDSYM).includes(doubleToken)) {
      return doubleToken;
    }
    return null;
  }

  parseProgram() {
    let result;
    const data = [];

    while (this.scanIndex < this.input.length) {
      const lexeme = this.getNextLexeme();
      if (lexeme) {
        result = lexeme;
      }
    }

    if (result) {
      result.forEach((element) => {
        const lexCheck = this.lexemeCheck(element.lexeme, element.line);
        data.push({
          lexeme: lexCheck.lexeme,
          token: lexCheck.token,
          attribute: lexCheck.attribute,
          line: lexCheck.line,
        });
      });
    }

    return data;
  }

  getNextLexeme() {
    let lexeme = "";
    const tokens = [];
    let inComment = false;
    let currentLineNum = this.lineNum;

    while (this.scanIndex < this.input.length) {
      this.ch = this.input[this.scanIndex];

      // When we find a quote, we're starting a string literal
      // We'll capture everything until the closing quote
      if (this.ch === '"') {
        if (lexeme) {
          tokens.push({ lexeme: lexeme.toUpperCase(), line: currentLineNum });
          lexeme = "";
        }
        tokens.push({ lexeme: this.ch, line: currentLineNum });
        this.scanIndex++;
        while (
          this.scanIndex < this.input.length &&
          this.input[this.scanIndex] !== '"'
        ) {
          lexeme += this.input[this.scanIndex];
          if (this.input[this.scanIndex] === "\n") currentLineNum++;
          this.scanIndex++;
        }
        if (this.scanIndex < this.input.length) {
          tokens.push({ lexeme: lexeme.toUpperCase(), line: currentLineNum });
          tokens.push({
            lexeme: this.input[this.scanIndex],
            line: currentLineNum,
          });
          this.scanIndex++;
          lexeme = "";
        }
        continue;
      }

      // Look for Ada style comments that start with --
      // Skip everything until we hit a new line
      if (
        this.ch === "-" &&
        this.scanIndex + 1 < this.input.length &&
        this.input[this.scanIndex + 1] === "-"
      ) {
        if (lexeme) {
          tokens.push({ lexeme: lexeme.toUpperCase(), line: currentLineNum });
          lexeme = "";
        }
        inComment = true;
        this.scanIndex += 2;
        continue;
      }

      // If we're in a comment, keep going until we hit a new line
      if (inComment) {
        if (this.ch === "\n") {
          inComment = false;
          currentLineNum++;
          this.lineNum = currentLineNum;
        }
        this.scanIndex++;
        continue;
      }

      // Check for special characters and operators
      // This includes things like :=, >=, <=, etc.
      if (Object.keys(RESWORDSANDSYM).includes(this.ch)) {
        if (lexeme) {
          tokens.push({ lexeme: lexeme.toUpperCase(), line: currentLineNum });
          lexeme = "";
        }

        const nextChar = this.lookAhead();
        if (["/", ">", "<", ":"].includes(this.ch) && nextChar) {
          const doubleToken = this.checkDoubleToken(this.ch, nextChar);
          if (doubleToken) {
            tokens.push({
              lexeme: doubleToken.toUpperCase(),
              line: currentLineNum,
            });
            this.scanIndex += 2;

            continue;
          }
        }

        tokens.push({ lexeme: this.ch.toUpperCase(), line: currentLineNum });
        this.scanIndex++;
        continue;
      }

      // Handle numeric values
      // This includes both integers and floating point numbers
      if (/\d/.test(this.ch)) {
        lexeme += this.ch;
        this.scanIndex++;
        while (
          this.scanIndex < this.input.length &&
          (/\d/.test(this.input[this.scanIndex]) ||
            this.input[this.scanIndex] === ".")
        ) {
          lexeme += this.input[this.scanIndex];
          this.scanIndex++;
        }
        tokens.push({ lexeme: lexeme.toUpperCase(), line: currentLineNum });
        lexeme = "";
        continue;
      }

      // Handle spaces, tabs, and newlines
      // Keep track of line numbers for error reporting
      if (/\s/.test(this.ch)) {
        if (/\n/.test(this.ch)) {
          currentLineNum++;
          this.lineNum = currentLineNum;
        }
        if (lexeme) {
          tokens.push({ lexeme: lexeme.toUpperCase(), line: currentLineNum });
          lexeme = "";
        }
        this.scanIndex++;
        continue;
      } else {
        lexeme += this.ch;
      }
      this.scanIndex++;
    }

    if (lexeme) {
      tokens.push({ lexeme: lexeme.toUpperCase(), line: currentLineNum });
    }
    return tokens;
  }
}

export default LexicalAnalyzer;
