class SyntaxAnalyzer {
    constructor(tokens) {
      this.tokens = tokens;
      this.currentToken = 0;
      this.errors = [];
      this.hasError = false;
    }
  
    getCurrentToken() {
      return this.tokens[this.currentToken];
    }
  
    addError(message) {
      const token = this.getCurrentToken();
      const lineNumber = token ? token.line : 'EOF';
      const errorMsg = `Error at line ${lineNumber}: ${message} ${token ? `(Found: ${token.token})` : '(End of input)'}`;
      this.errors.push(errorMsg);
      this.hasError = true;
      throw new Error(errorMsg);
    }
  
    match(expectedToken) {
      const token = this.getCurrentToken();
      if (token && token.token === expectedToken) {
        this.currentToken++;
        return true;
      }
      this.addError(`Expected token type '${expectedToken}'`);
      return false;
    }
  
    parseProgram() {
      // Main program structure:
      // procedure name (arguments) is
      //    declarations
      //    nested procedures
      // begin
      //    statements
      // end name;
      if (!this.match('procedureT')) return false;
      
      const procName = this.getCurrentToken();
      if (!procName || procName.token !== 'idT') {
        this.addError('Expected procedure name (idT)');
        return false;
      }
      const procNameLexeme = procName.lexeme;
      this.currentToken++;
  
      this.parseArgs();
      
      if (!this.match('isT')) return false;
  
      this.parseDeclarativePart();
      this.parseProcedures();
  
      if (!this.match('beginT')) return false;
      
      this.parseSeqOfStatements();
  
      if (!this.match('endT')) return false;
      
      // Make sure the end name matches the procedure name
      const endProcName = this.getCurrentToken();
      if (!endProcName || endProcName.token !== 'idT' || endProcName.lexeme !== procNameLexeme) {
        this.addError('Expected matching procedure name (idT)');
        return false;
      }
      this.currentToken++;
      
      if (!this.match('semicolonT')) return false;
  
      return !this.hasError;
    }
  
    parseArgs() {
      // Optional argument list surrounded by parentheses
      const token = this.getCurrentToken();
      if (token && token.token === 'LparenT') {
        this.match('LparenT');
        this.parseArgList();
        if (!this.match('RparenT')) {
          this.addError('Expected RparenT');
          return false;
        }
      }
      return true;
    }
  
    parseArgList() {
      // Arguments have a mode (in/out/inout), identifiers, and a type
      this.parseMode();
      if (!this.parseIdentifierList()) {
        this.addError('Invalid identifier list in arguments');
        return false;
      }
      if (!this.match('colonT')) return false;
      if (!this.parseTypeMark()) {
        this.addError('Invalid type mark in arguments');
        return false;
      }
      this.parseMoreArgs();
      return true;
    }
  
    parseMode() {
      // Parameter modes: in (read-only), out (write-only), inout (read-write)
      const token = this.getCurrentToken();
      if (token && ['inT', 'outT', 'inoutT'].includes(token.token)) {
        this.currentToken++;
      }
      return true;
    }
  
    parseIdentifierList() {
      // One or more identifiers separated by commas
      if (!this.match('idT')) {
        this.addError('Expected idT');
        return false;
      }
  
      while (this.getCurrentToken()?.token === 'commaT') {
        this.match('commaT');
        if (!this.match('idT')) {
          this.addError('Expected idT after comma');
          return false;
        }
      }
      return true;
    }
  
    parseTypeMark() {
      // Variable types: integer, real, char, or constant with a value
      const token = this.getCurrentToken();
      if (!token) {
        this.addError('Expected type mark');
        return false;
      }
  
      if (['integerT', 'realT', 'charT'].includes(token.token)) {
        this.currentToken++;
        return true;
      } else if (token.token === 'constT') {
        this.currentToken++;
        if (!this.match('assignOp')) {
          this.addError('Expected assignOp after constT');
          return false;
        }
        return this.parseValue();
      }
  
      this.addError('Invalid type mark');
      return false;
    }
  
    parseValue() {
      // Numeric literals (integer or real)
      const token = this.getCurrentToken();
      if (!token || (token.token !== 'value' && token.token !== 'valueR')) {
        this.addError('Expected numerical value');
        return false;
      }
      this.currentToken++;
      return true;
    }
  
    parseMoreArgs() {
      // Additional arguments after a semicolon
      const token = this.getCurrentToken();
      if (token && token.token === 'semicolonT') {
        this.match('semicolonT');
        this.parseArgList();
      }
      return true;
    }
  
    parseDeclarativePart() {
      // Variable declarations: list of identifiers, their type, and a semicolon
      while (this.getCurrentToken() && this.getCurrentToken().token === 'idT') {
        if (!this.parseIdentifierList()) {
          this.addError('Invalid identifier list in declaration');
          return false;
        }
        if (!this.match('colonT')) return false;
        if (!this.parseTypeMark()) {
          this.addError('Invalid type mark in declaration');
          return false;
        }
        if (!this.match('semicolonT')) return false;
      }
      return true;
    }
  
    parseProcedures() {
      // Handle nested procedures
      while (this.getCurrentToken()?.token === 'procedureT') {
        if (!this.parseProgram()) {
          this.addError('Error in nested procedure');
          return false;
        }
      }
      return true;
    }
  
    parseSeqOfStatements() {
      // For this subset, we don't parse statements
      return true;
    }
  
    analyze() {
      try {
        const success = this.parseProgram();
        return {
          success,
          errors: this.errors
        };
      } catch (error) {
        return {
          success: false,
          errors: this.errors
        };
      }
    }
  }
  
  export default SyntaxAnalyzer;