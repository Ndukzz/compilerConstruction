const RESWORDSANDSYM = {
  BEGIN: "beginT",
  MODULE: "moduleT",
  CONSTANT: "constT",
  PROCEDURE: "procedureT",
  IS: "isT",
  IF: "ifT",
  THEN: "thenT",
  ELSE: "elseT",
  ELSIF: "elseifT",
  WHILE: "whileT",
  LOOP: "loopT",
  FLOAT: "floatT",
  INTEGER: "integer",
  CHAR: "charT",
  GET: "getT",
  PUT: "putT",
  END: "endT",
  "--": "openCommentT",
  // "*)": "closeCommentT",
  ":=": "assignOp",
  "+": "addOp",
  "-": "addOp",
  REM: "mulOp",
  MOD: "mulOp",
  AND: "mulOp",
  "*": "mulOp",
  "/": "mulOp",
  "=": "relOp",
  "<": "relOp",
  ">": "relOp",
  "<=": "relOp",
  ">=": "relOp",
  "#": "relOp",
  "^": "caretT",
  "/=": "relOp",
  "&": "MulOp",
  ".": "periodT",
  ",": "commaT",
  ";": "semicolonT",
  ":": "colonT",
  "(": "LparenT",
  ")": "RparenT",
  '"': "doubleQuotesT",
  "{": "LcurlybraceT",
  "}": "RtcurlybraceT",
};

class LexicalAnalyzer {
  constructor(props) {
    this.input = [...props];
    this.scanIndex = 0;
    (this.ch = this.input[this.scanIndex]),
      (this.chSpy = this.input[this.scanIndex + 1]);
    (this.currLexeme = ""), (this.ResultsTable = []);
    this.lineNum = 1;
  }

  lexemeCheck(lexeme) {
    let data = {
      lexeme: lexeme,
      token: undefined,
      attribute: undefined,
    };
    if (Object.keys(RESWORDSANDSYM).includes(lexeme)) {
      let token = RESWORDSANDSYM[lexeme];
      data = {
        lexeme: lexeme,
        token,
        attribute: undefined,
      };
      return data;
    }
    if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(lexeme)) {
      // checks for idt strings
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
        };
      }
      data.token = "idT";
    } else if (/^[0-9_]+(\.[0-9_]+)?$/.test(lexeme)) {
      // checks for numbers
      // console.log("Number: ", lexeme);
      if (lexeme.toString().includes(".")) {
        data.token = "valueR";
      } else {
        data.token = "value";
      }
      data = {
        ...data,
        attribute: lexeme, //add a rounding logic to this
        lexeme: lexeme,
      };
    }
    return data;
  }

  checkIdT(lexeme) {
    const regex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    let isIdT = regex.test(lexeme);
    return isIdT;
  }

  parseProgram() {
    // console.log(this.input);
    // console.log(this.input.length);
    let result;
    let data = [];

    while (this.scanIndex < this.input.length) {
      let lexeme = this.getNextLexeme(); // Get lexeme
      // let lexResult = this.lexemeCheck(lexeme);
      if (lexeme) {
        // Check if lexeme is not empty
        result = this.lexemeCheck(lexeme).lexeme; // Call lexemeCheck
        console.log(result);
      }
    }
    if (result) {
      result.forEach((element) => {
        let lexCheck = this.lexemeCheck(element);
        // console.log(result);
        data.push({
          lexeme: lexCheck.lexeme,
          token: lexCheck.token,
          attribute: lexCheck.attribute,
        });
      });
    }
		console.table(data)
    return data;
  }

  getNextLexeme() {
    let lexeme = ""; // Initialize lexeme
    const tokens = []; // Array to hold the tokens
    let inComment = false; // Flag to indicate if we are in a comment

    while (this.scanIndex < this.input.length) {
      this.ch = this.input[this.scanIndex]; // Update current character

      // Check for string literals
      if (this.ch === '"') {
        if (lexeme) {
          tokens.push(lexeme.toUpperCase()); // Push the accumulated lexeme
          lexeme = ""; // Reset lexeme
        }
        tokens.push(this.ch); // Push the opening quote
        this.scanIndex++; // Move to the next character
        while (
          this.scanIndex < this.input.length &&
          this.input[this.scanIndex] !== '"'
        ) {
          lexeme += this.input[this.scanIndex]; // Collect characters inside the string
          this.scanIndex++; // Move to the next character
        }
        if (this.scanIndex < this.input.length) {
          tokens.push(lexeme.toUpperCase()); // Push the collected string
          tokens.push(this.input[this.scanIndex]); // Push the closing quote
          this.scanIndex++; // Move past the closing quote
          lexeme = ""; // Reset lexeme
        }
        continue; // Continue to the next iteration
      }

      // Check for double reserved word "--"
      if (
        this.ch === "-" &&
        this.scanIndex + 1 < this.input.length &&
        this.input[this.scanIndex + 1] === "-"
      ) {
        inComment = true; // Start comment
        this.scanIndex += 2; // Move past the "--"
        continue; // Continue to the next iteration
      }

      // If we are in a comment, ignore characters until a newline
      if (inComment) {
        if (this.ch === "\n") {
          inComment = false; // End comment on newline
          this.lineNum++; // Increment line number
        }
        this.scanIndex++; // Move to the next character
        continue; // Continue to the next iteration
      }

      // Check for reserved words based on RESWORDSANDSYM
      if (this.ch in RESWORDSANDSYM) {
        if (lexeme == "") {
          lexeme += this.ch; // Start collecting the reserved word
        } else {
          tokens.push(lexeme.toUpperCase());
        }
        // tokens.push(lexeme.toUpperCase());
        lexeme = this.ch;
        this.scanIndex++; // Move to the next character
        while (
          this.scanIndex < this.input.length &&
          this.input[this.scanIndex] in RESWORDSANDSYM
        ) {
          lexeme += this.input[this.scanIndex]; // Collect the reserved word
          this.scanIndex++; // Move to the next character
        }
        tokens.push(lexeme.toUpperCase()); // Push the complete reserved word
        lexeme = ""; // Reset lexeme
        continue; // Continue to the next iteration
      }

      // Check for floating-point numbers
      if (/\d/.test(this.ch)) {
        lexeme += this.ch; // Start collecting digits
        this.scanIndex++; // Move to the next character
        while (
          this.scanIndex < this.input.length &&
          (/\d/.test(this.input[this.scanIndex]) ||
            this.input[this.scanIndex] === ".")
        ) {
          lexeme += this.input[this.scanIndex];
          this.scanIndex++; // Move to the next character
        }
        tokens.push(lexeme.toUpperCase()); // Push the complete number lexeme
        lexeme = ""; // Reset lexeme
        continue; // Continue to the next iteration
      }

      if (/\s/.test(this.ch)) {
        if (/\n/.test(this.ch)) {
          this.lineNum++; // Found a newline
        }
        if (lexeme) {
          tokens.push(lexeme.toUpperCase()); // Push the collected lexeme
          lexeme = ""; // Reset lexeme
        }
        this.scanIndex++; // Move past whitespace
        continue; // Continue to the next iteration
      } else {
        lexeme += this.ch; // Collect non-whitespace characters
      }
      this.scanIndex++; // Move to the next character
    }

    // Check if there's any remaining lexeme to return
    if (lexeme) {
      tokens.push(lexeme.toUpperCase()); // Push any remaining lexeme
    }
    return tokens; // Return the array of tokens
  }

  getNextCh() {
    if (/\n/.test(this.ch)) {
      //check for newLines
      this.lineNum++; // increase the line Number
    }
    this.scanIndex++;
    return this.ch; //return the curr char
    // this might be where we detect the EOF and predict the escape func
  }
}

export default LexicalAnalyzer;

