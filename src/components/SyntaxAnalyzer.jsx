import HashTable from "./HashTable";

class SyntaxAnalyzer {
  constructor(tokens) {
    this.tokens = tokens;
    this.currentToken = 0;
    this.errors = [];
    this.depth = 0;
    this.ProcList = [];
    this.hasError = false;
    this.HashTable = new HashTable();
    this.offset = 0;
    this.progDetails = {
      lexeme: "",
      values: {
        params: [],
        locals: [],
      },
      sizeOfParams: 0,
      sizeOfLocals: 0,
    };
  }

  analyze() {
    try {
      const success = this.Prog();
      console.log(success);

      // Collect results to return
      const hashTableResults = this.HashTable.writeTable();
      return {
        success,
        errors: this.errors,
        hashTableResults,
      };
    } catch (error) {
      return {
        success: false,
        errors: this.errors,
      };
    }
  }

  getCurrentToken() {
    return this.tokens[this.currentToken];
  }

  addError(message) {
    const token = this.getCurrentToken();
    const lineNumber = token ? token.line : "EOF";
    const errorMsg = `Error at line ${lineNumber}: ${message} ${
      token ? `(Found: ${token.token})` : "(End of input)"
    }`;
    this.errors.push(errorMsg);
    this.hasError = true;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  match(expectedToken) {
    const token = this.getCurrentToken();
    if (token && token.token === expectedToken) {
      // console.log(token.lexeme);

      this.currentToken++;
      return token;
    }
    // this.addError(`Expected token type '${expectedToken}'`);
    console.log(`Expected token type '${expectedToken}' got ${token.token}`);
    console.log(token);
    return false;
  }

  Prog() {
    // Main program structure:
    // procedure name (arguments) is
    //    declarations
    //    nested procedures
    // begin
    //    statements
    // end name;
    let variable = {
      lexeme: "",
      values: {
        params: [],
        locals: [],
      },
      sizeOfParams: 0,
      sizeOfLocals: 0,
    };
    //push proc into the hash table with this.progDetails
    //start proc
    if (!this.match("procedureT")) return false;

    const procName = this.getCurrentToken();

    if (!procName || procName.token !== "idT") {
      // this.addError("Expected procedure name (idT)");
      console.log("Expected procedure name (idT)");
      return false;
    }
    variable.lexeme = this.progDetails.lexeme = procName.lexeme;

    this.currentToken++;
    this.depth++;

    let args = this.Args(); //should contain the params and their sizes...
    // console.log(args);
    //------------------------------------------------------------------------------------------------------------end proc

    if (!this.match("isT")) return false;

    let declPart = this.DeclarativePart(); // should contain the locals and their sizes..
    this.Procedures();

    if (!this.match("beginT")) return false;

    let stat = this.SeqOfStatements();
    // stat && console.log(this.HashTable.lookup(stat.lexeme))

    if (!this.match("endT")) return false;

    // Make sure the end name matches the procedure name
    const endProcName = this.getCurrentToken();
    if (
      !endProcName ||
      endProcName.token !== "idT" ||
      endProcName.lexeme !== variable.lexeme
    ) {
      // this.addError("Expected matching procedure name (idT)");
      console.log("Expected matching procedure name (", procName.lexeme, ")");
      return false;
    }

    this.currentToken++;

    // console.log("Procedure ", variable.lexeme);

    if (!this.match("semicolonT")) return false;
    // console.log(variable.lexeme, " ", this.depth);

    //------------------------------------------------insert this.progDetails: values, sizeOfParams, sizeOfLocals into symbolTable------------------------------------------------------------

    console.table(this.HashTable.writeTable(this.depth));
    this.HashTable.deleteDepth(this.depth);
    this.offset = 0;
    this.depth--;
    //Insert the procedure into the hashTable
    this.HashTable.insert(procName, "procT", this.depth, this.progDetails);
    // console.log("Nested List after " + procName.lexeme);
    let result = this.HashTable.writeTable();

    //------------------------------------------------clear this.progDetails------------------------------------------------------------
    this.ClearProgDetails();
    return variable;
  }

  Args() {
    const token = this.getCurrentToken();
    let list = []; // Initialize empty list to pass to ArgList

    if (token && token.token === "LparenT") {
      this.match("LparenT");
      const argListResult = this.ArgList(list); // Pass list to ArgList
      if (argListResult) {
        list = argListResult.list; // Update list with result
      }
      if (!this.match("RparenT")) {
        console.log("Expected RparenT");
        return false;
      }
    }
    // insert the lexeme into this.progDetails
    list.forEach((item) => {
      this.progDetails.values.params.push(item.lexeme);
    });
    this.SetParamSizes(list);

    return list; // Return the final list of arguments
  }

  ArgList(previousList = []) {
    let output = {
      locals: 0,
      params: 0,
      list: [...previousList], // Initialize with previous list if any
    };

    let variable = {
      mode: null,
      typeMark: null,
    };

    if (this.getCurrentToken()?.token === "modeT") {
      variable.mode = this.Mode();
    }

    let ids = this.IdentifierList();

    //_________________________________________________________________________________________________________
    if (ids) {
      ids.forEach((id) => {
        // Create argument object with all necessary information
        const arg = {
          lexeme: id.lexeme,
          mode: variable.mode,
          typeMark: null, // Will be set below
          offset: null, //add the offset here
        };
        output.list.push(arg);
      });
    } else {
      console.log("Invalid identifier list in arguments");
      return false;
    }
    //_________________________________________________________________________________________________________

    if (!this.match("colonT")) return false;

    let typeMark = this.TypeMark();
    if (typeMark) {
      if (typeMark.typeMark == "integerT") {
        output.params += ids.length * 2;
      } else if (typeMark.typeMark == "realT") {
        output.params += ids.length * 4;
      }

      // Update typeMark for all arguments just added
      let startIndex = output.list.length - ids.length;
      for (let i = startIndex; i < output.list.length; i++) {
        output.list[i].typeMark = typeMark.typeMark;
        output.list[i].token = "idT";
      }

      //update offset for all arguements
      startIndex = output.list.length - ids.length;
      for (let i = output.list.length - 1; i >= startIndex; i--) {
        //Setting the current offset before updating it based on the size of the current typeMark
        let currOffset = this.offset;
        output.list[i].offset = currOffset;

        switch (output.list[i].typeMark) {
          case "integerT":
            //increase the offset by 2
            this.offset += 2;
            break;
          case "realT":
            //increase the offset by 4
            this.offset += 4;
            break;
          case "charT":
            // increase the offset by 1
            this.offset++;
            break;
          default:
            break;
        }
        // console.log(output.list[i]);
      }

      //if mode => pass as props
      let props = {};
      variable.mode && (props = { mode: variable.mode });

      // Insert into table
      output.list.forEach((id) => {

        this.HashTable.insert(
          id.lexeme,
          id.token,
          this.depth,
          (props = {
            ...props,
            typeMark: id.typeMark,
            offset: id.offset,
          })
        );
      });
    } else {
      console.log("Invalid type mark in arguments");
      return false;
    }

    const moreArgs = this.MoreArgs(output.list);
    if (moreArgs) {
      output = {
        locals: output.locals + (moreArgs.locals || 0),
        params: output.params + (moreArgs.params || 0),
        list: moreArgs.list, // Use the updated list from MoreArgs
      };
    }

    // console.log(output);

    return output;
  }

  MoreArgs(previousList = []) {
    const token = this.getCurrentToken();
    if (token && token.token === "semicolonT") {
      this.match("semicolonT");
      return this.ArgList(previousList); // Pass the current list to ArgList
    }
    return {
      locals: 0,
      params: 0,
      list: previousList, // Return unchanged list if no more arguments
    };
  }

  Mode() {
    // Parameter modes: in (read-only), out (write-only), inout (read-write)
    const token = this.getCurrentToken();
    this.currentToken++;
    console.error(token);
    if (token && ["modeT", null].includes(token.token)) {
      return token.lexeme;
    } else {
      return null;
    }
  }
  //
  IdentifierList() {
    let idList = [];
    // One or more identifiers separated by commas
    if (this.getCurrentToken()?.token === "idT") {
      let id = this.match("idT");
      if (id) {
        id = {
          ...id,
          depth: this.depth,
        };

        idList.push(id);
        this.IdentifierListPrime(idList);
      } else {
        // this.addError("Expected idT");
        console.log("Expected idT");
        return false;
      }
    }

    return idList;
  }

  IdentifierListPrime(idList) {
    if (this.getCurrentToken()?.token === "commaT") {
      this.match("commaT");
      let id = this.match("idT");
      if (id) {
        idList.push(id);
        this.IdentifierListPrime(idList);
      } else {
        // this.addError("Expected idT after comma");
        console.log("Expected idT after comma");
        return false;
      }
    }
  }

  TypeMark() {
    // Variable types: integer, real, char, or constant with a valu
    const token = this.getCurrentToken();
    if (!token) {
      // this.addError("Expected type mark");
      console.log("Expected type mark");
      return false;
    }

    if (["integerT", "realT", "charT"].includes(token.token)) {
      // if int, real or char
      this.currentToken++;
      return {
        typeMark: token.token,
      };
    } else if (token.token === "constT") {
      // if constant value
      let lexeme = token.lexeme;
      this.currentToken++;
      if (!this.match("assignOp")) {
        // this.addError("Expected assignOp after constT");
        console.log("Expected assignOp after constT");
        return false;
      }
      let value = this.Value();

      // insert into the table
      return {
        typeMark: lexeme,
        token: value.token,
        value: parseInt(lexeme),
        attribute: value.attribute,
      };
    }

    // this.addError("Invalid type mark");
    console.log("Invalid type mark");
    return false;
  }

  Value() {
    // Numeric literals (integer or real)
    const token = this.getCurrentToken();
    if (!token || (token.token !== "value" && token.token !== "valueR")) {
      // this.addError("Expected numerical value");
      console.log("Expected numerical value");
      return false;
    }
    this.currentToken++;
    return token;
  }

  DeclarativePart() {
    // Variable declarations: list of identifiers, their type, and a semicolon
    while (this.getCurrentToken() && this.getCurrentToken().token === "idT") {
      if (!this.IdentifierList()) {
        // this.addError("Invalid identifier list in declaration");
        console.log("Invalid identifier list in declaration");
        return false;
      }
      if (!this.match("colonT")) return false;
      if (!this.TypeMark()) {
        // this.addError("Invalid type mark in declaration");
        console.log("Invalid type mark in declaration");
        return false;
      }
      if (!this.match("semicolonT")) return false;
    }
    return true;
  }
  // ___________________________________________________________________________________________

  Procedures() {
    // Handle nested procedures
    if (
      this.getCurrentToken() &&
      this.getCurrentToken().token === "procedureT"
    ) {
      let prog = this.Prog();

      this.Procedures();
    }

    while (this.getCurrentToken()?.token === "procedureT") {
      this.Prog();
      if (!this.Prog()) {
        // this.addError("Error in nested procedure");
        console.log("Error in nested procedure");
        return false;
      }
    }
    return true;
  }

  SeqOfStatements() {
    let lhs;
    if (this.getCurrentToken()?.token === "idT") {
      lhs = this.match("idT");
      // console.log(lhs);

      if (!this.match("LparenT")) return false;
      while (!this.match("RparenT")) {
        //skip until the rParent is found
        if (!this.getCurrentToken()) return false;
      }
      if (!this.match("semicolonT")) return false;
      return lhs;
    }
  }

  //  // ______________________________Helper Functions_____________________________________________________________

  ClearProgDetails() {
    this.progDetails = {
      lexeme: "",
      values: {
        params: [],
        locals: [],
      },
      sizeOfParams: 0,
      sizeOfLocals: 0,
    };
  }

  SetParamSizes(list) {
    list.forEach((item) => {
      switch (item.typeMark) {
        case "integerT":
          this.progDetails.sizeOfParams += 2;
          break;
        case "realT":
          this.progDetails.sizeOfParams += 4;
          break;

        default:
          break;
      }
    });
  }
}

export default SyntaxAnalyzer;
