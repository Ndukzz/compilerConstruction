import HashTable from "./HashTable.js";

class SyntaxAnalyzer2 {
  constructor(tokens) {
    this.procs = {};
    this.procName = ''
    this.tokens = tokens;
    this.currentToken = 0;
    this.depthTables = [];
    this.errors = [];
    this.depth = 0;
    this.ProcList = [];
    this.hasError = false;
    this.HashTable = new HashTable();
    this.offset = 0;
    this.procDetails = {
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
      this.depthTables.forEach((depthData) => console.log(depthData));
      this.depthTables.push(success);

      // Collect results to return
      const hashTableResults = this.HashTable.writeTable();
      return {
        success,
        errors: this.errors,
        hashTableResults,
        depthData: this.depthTables,
      };
    } catch (error) {
      return {
        success: false,
        errors: this.errors,
        depthData: this.depthTables, // passed upward
      };
    }
  }

  getCurrentToken() {
    console.log(this.currentToken);

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

    //push proc into the hash table with this.procDetails
    //start proc
    if (!this.match("procedureT")) return false;

    const procName = this.getCurrentToken();

    if (!procName || procName.token !== "idT") {
      // this.addError("Expected procedure name (idT)");
      console.log("Expected procedure name (idT)");
      return false;
    }
    
    this.currentToken++;
    this.offset = 0;
    
    //  create a new proc object and set the name and depth
    this.CreateProc(procName, this.depth);
    
    this.depth++;

    let args = this.Args(); //Update the params and their size in procs and SymbolTable
    // console.log(args);

    if (!this.match("isT")) return false;

    this.DeclarativePart(); // should update the locals and their size in procs and SymbolTable

    this.Procedures();

    if (!this.match("beginT")) return false;

    let stat = this.SeqOfStatements();
    // stat && console.log(this.HashTable.lookup(stat.lexeme))

    console.log(this.getCurrentToken());

    if (!this.match("endT")) return false;

    // Make sure the end name matches the procedure name
    const endProcName = this.getCurrentToken();
    if (
      !endProcName ||
      endProcName.token !== "idT" ||
      endProcName.lexeme !== variable.lexeme
    ) {
      //------------------------------------------------------------------------------------------------------------end proc
      // this.addError("Expected matching procedure name (idT)");
      this.addError("Expected matching procedure name (", procName.lexeme, ")");
      return false;
    }

    this.currentToken++;

    // console.log("Procedure ", variable.lexeme);

    if (!this.match("semicolonT")) return false;
    // console.log(variable.lexeme, " ", this.depth);

    //------------------------------------------------insert this.procs: values, sizeOfParams, sizeOfLocals into symbolTable------------------------------------------------------------

    console.table(this.HashTable.writeTable(this.depth));

    this.HashTable.writeTable(this.depth).forEach((depthData) => {
      this.depthTables.push(depthData);
    });

    this.DisplayProcs();

    //------------------------------------------------FUNCTIONS AT THE END OF THE PROCECURE------------------------------------------------------------

    this.HashTable.deleteDepth(this.depth);
    this.depth--;

    //Insert the procedure into the hashTable
    this.HashTable.insert(
      procName,
      "procT",
      this.depth,
      this.procs[this.depth]
    );
    // console.log("Nested List after " + procName.lexeme);
    let result = this.HashTable.writeTable();

    //HANDLE THIS variable VAR TO RETURN NOTHING
    return true;
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
      console.log(list);

      if (!this.match("RparenT")) {
        console.log("Expected RparenT");
        return false;
      }
    }
    // insert the lexeme into this.procs          ***************************************************************
   
    this.setParamList(list)

    this.SetParamSizes(list);
    console.log("done!!!!x");

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
      for (let i = startIndex; i < output.list.length; i++) {
        //Setting the current offset before updating it based on the size of the current typeMark
        let currOffset = this.offset;
        output.list[i].offset = currOffset;

        this.setOffset(output.list[i].typeMark);
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

    return output;
  }

  SetParamSizes(list) {
    list.forEach((item) => {
      switch (item.typeMark) {
        case "integerT":
          this.procs[this.depth].sizeOfParams += 2;
          break;
        case "realT":
          this.procs[this.depth].sizeOfParams += 4;
          break;
        case "charT":
          this.procs[this.depth].sizeOfParams += 1;
          break;

        default:
          break;
      }
    });
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

  setOffset(typeMark) {
    // Using if/else statements
    if (typeMark === "value" || typeMark === "integerT") {
      this.offset += 2;
    } else if (typeMark === "valueR" || typeMark === "realT") {
      this.offset += 4;
    } else if (typeMark === "charT") {
      this.offset++;
    }
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

  DeclarativePart() {
    let arg = {
      lexeme: "",
      typeMark: "", // Will be set below
      offset: "", //add
    };

    let typeMark;
    let idList,
      data = [];
    // Variable declarations: list of identifiers, their type, and a semicolon
    while (this.getCurrentToken() && this.getCurrentToken().token === "idT") {
      idList = this.IdentifierList();
      if (!this.match("colonT")) return false;
      typeMark = this.TypeMark();
      if (!this.match("semicolonT")) return false;
      data.push({
        idList,
        typeMark,
      });
      console.log(idList);

      //-------------restructure the object---------------

      console.log(idList, typeMark);
      for (let index = 0; index < idList.length; index++) {
        let currOffset = this.offset;
        // set the values of the arg object
        if (typeMark.typeMark == "CONSTANT") {
          (arg.lexeme = idList[index].lexeme),
            (arg.typeMark = typeMark.token),
            (arg.offset = currOffset);
          this.setOffset(typeMark.token);
        } else {
          (arg.lexeme = idList[index].lexeme),
            (arg.typeMark = typeMark.typeMark),
            (arg.offset = currOffset);
          this.setOffset(typeMark.typeMark);
        }
        let token = idList[index].token;
        let props = {
          typeMark: arg.typeMark,
          offset: arg.offset,
        };

        //upddate the localParams field using the
        this.setLocalSizes(idList);
        console.log(arg);
        this.HashTable.insert(arg.lexeme, token, this.depth, props);
        //add to symbolTable here
      }
      idList.forEach((id) => {
        this.procDetails.values.locals.push(id.lexeme);
      });
    }
  }

  setLocalSizes(list) {
    list.forEach((item) => {
      if (item.typeMark == "charT") {
        this.procs[this.depth].sizeOfLocals++;
      }
      if (item.typeMark == "integerT" || item.typeMark == "value") {
        this.procs[this.depth].sizeOfLocals += 2;
      }
      if (item.typeMark == "realT" || item.typeMark == "valueR") {
        this.procs[this.depth].sizeOfLocals += 4;
      }
    });
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

  //  HELPER FUNCTIONS
  //_________________________________________________________________________________________________________

  CreateProc(lexeme, depth) {
    // This is where the issue is - you're not assigning the result anywhere
    // Also, the syntax for object spread is incorrect
    this.procs = {
      ...this.procs,
      [depth]: {
        // Use bracket notation for dynamic property names
        ...this.procDetails,
        lexeme: lexeme,
        depth: depth,
      },
    };
  }

  setParamList(list) {
    console.log(this.procs);
    list.forEach(element => {
      console.log('aInnnn depth', this.depth);
      
      this.procs[this.depth].values.params.push(element.lexeme)
      console.log(this.procs);
    });
  }

  DisplayProcs() {
    console.log(this.procs);
  }
}

export default SyntaxAnalyzer2;
