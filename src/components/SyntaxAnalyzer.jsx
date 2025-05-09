import { decl } from "postcss";
import HashTable from "./HashTable.js";
// TODO:  ADD TABS INTO THE ASM FILE WHERE NECESSARY FOR READABILITY
// the depth 1 variables are gonna reamein the same in the asm file
// add the mod anb other arithmetic operations to it

class SyntaxAnalyzer2 {
  constructor(tokens) {
    this.EOF = false;
    this.tables = [];
    this.procs = {};
    this.tokens = tokens;
    this.procNames = [];
    this.currentToken = 0;
    this.depthTables = [];
    this.errors = [];
    this.depth = 0;
    this.ProcList = [];
    this.hasError = false;
    this.HashTable = new HashTable();
    this.offset = 0;
    this.Svars = "";
    this.ASM =
      ".model small\n.586 \n.stack 100h\n.data \n" +
      this.Svars +
      "\n" +
      ".code\n\n";
    this.procDetails = {
      lexeme: "",
      values: {
        params: [],
        locals: [],
      },
      sizeOfParams: 0,
      sizeOfLocals: 0,
    };
    // assignment 7 globals
    (this.tempCount = 0),
      (this.stack = []),
      (this.node = { lex: "", size: null, value: 0 });
    this.TAC = [];
    this.typeList = [];
    //assignment 8 globals
    this.SvarCount = 0;
    this.messVal = null;
    this.Message = "";
    this.userInput = null;
    this.OutputMessages = [];
    this.calculate = false;
  }

  analyze() {
    try {
      const success = this.Prog();
      let resultTables = this.tables;
      this.depthTables.push(success);
      console.log(this.stack);

      // Process all output messages
      this.OutputMessages.forEach((message) => {
        this.Svars += message + " \n";
      });
      console.log(this.Svars);

      // Insert Svars into ASM file
      this.ASM = this.insertAfterData(this.Svars);
      console.log(this.ASM);

      // Collect results to return
      return {
        success,
        tacFile: this.TAC,
        asmFile: this.ASM,
        errors: [
          this.errors.length > 0 ? this.errors[this.errors.length - 1] : [],
        ],
        depthData: this.tables,
        EOF: this.EOF,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          this.errors.length > 0 ? this.errors[this.errors.length - 1] : [],
        ],
        depthData: this.tables,
        EOF: this.EOF,
      };
    }
  }

  insertAfterData(stringToInsert) {
    // Find the position of .data directive
    const dataIndex = this.ASM.indexOf(".data");

    if (dataIndex === -1) {
      return this.ASM; // Return original if .data not found
    }

    // Find the end of the .data line (next newline)
    const endOfLine = this.ASM.indexOf("\n", dataIndex);

    // Insert the string after .data and update this.ASM
    this.ASM =
      this.ASM.slice(0, endOfLine + 1) +
      stringToInsert +
      this.ASM.slice(endOfLine + 1);

    return this.ASM;
  }

  getCurrentToken() {
    return this.tokens[this.currentToken];
  }

  addError(message) {
    const token = this.getCurrentToken();
    const lineNumber = token ? token.line : "EOF";
    const errorMsg = `${message} at line ${lineNumber}`;
    this.errors.push(errorMsg);
    this.hasError = true;
    // console.error(errorMsg);
    throw new Error(errorMsg);
  }

  Match(expectedToken) {
    const token = this.getCurrentToken();
    console.log(token.lexeme);
    let string = "";

    if (token && token.token === expectedToken) {
      // console.log(token.lexeme);

      this.currentToken++;
      return token;
    }
    if (expectedToken == "literalT") {
      while (this.getCurrentToken().token != "doubleQuotesT") {
        let token = this.getCurrentToken();
        string += token.lexeme;
        this.currentToken++;
      }
      return string;
    }
    // this.addError(`Expected token type '${expectedToken}'`);
    const errorMsg = `Expected token type '${expectedToken}' got ${token.token}, ${token.lexeme}`;
    console.log(errorMsg);
    this.addError(errorMsg);
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
    this.offset = 0;
    let progDetails = {
      lexeme: "",
      values: {
        params: [],
        locals: [],
      },
      sizeOfParams: 0,
      sizeOfLocals: 0,
      depth: this.depth,
    };

    //push proc into the hash table with this.procDetails
    //start proc
    if (!this.Match("procedureT")) {
      this.addError(
        "Expected ProcedureT at line ",
        this.getCurrentToken().line
      );
      return false;
    }

    const procName = this.getCurrentToken();
    this.procNames.push(procName.lexeme);

    // console.log(this.procNames);

    if (!procName || procName.token !== "idT") {
      // this.addError("Expected procedure name (idT)");
      const error = "Expected procedure name (idT)";
      this.addError(error);
      return false;
    }

    progDetails.lexeme = procName.lexeme;
    this.procs[this.depth] = progDetails;

    this.currentToken++;

    this.offset = 0;
    let args = this.Args(); //should contain the params and their sizes...

    //AFTER THE DECLARATION OF PARAMS, INSERT THE BP

  

    console.log(this.stack);
    progDetails.values.params = args.list;
    progDetails.sizeOfParams = args.paramSize;

    if (!this.Match("isT")) return false;
    this.pushStack("BP", 0);


    let declPart = this.DeclarativePart(); // should contain the locals and their sizes..

    progDetails.sizeOfLocals = declPart.localSize;
    progDetails.values.locals = declPart.returnedIds;

    this.procDetails.sizeOfLocals = 0; //clearing the global sizeOfLocals

    while (this.getCurrentToken().token === "procedureT") {
      //PROCEDURES
      const procedures = this.Procedures();
    }

    if (!this.Match("beginT")) return false;
    let tac = `PROC ${procName.lexeme}`; //BEGIN ProcName
    // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
    this.Emit(tac);
    let asm = `${procName.lexeme.toLowerCase()} PROC \npush bp \nmov bp, sp \nsub sp, ${
      declPart.localSize
    } \n\n`;
    this.ASM += asm;
    // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
    let token = this.getCurrentToken();

    let stat = this.SeqOfStatements();

    // console.log(this.getCurrentToken());

    if (!this.Match("endT")) return false;

    tac = `ENDP ${procName.lexeme}`; // ENDP ProcName
    // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
    this.Emit(tac);
    asm = `add sp, ${declPart.localSize}\npop bp \nret ${
      args.paramSize
    } \n${procName.lexeme.toLowerCase()} ENDP\n\n`;
    this.ASM += asm;
    // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
    // Make sure the end name matches the procedure name
    const endProcName = this.getCurrentToken();
    if (
      !endProcName ||
      endProcName.token !== "idT" ||
      endProcName.lexeme !== progDetails.lexeme
    ) {
      //------------------------------------------------------------------------------------------------------------end proc
      // this.addError("Expected matching procedure name (idT)");
      const error = `Expected matching procedure name ( ${procName.lexeme} )`;
      this.addError(error);

      return false;
    }
    this.currentToken++;

    if (!this.Match("semicolonT")) return false;

    //------------------------------------------------FUNCTIONS AT THE END OF THE PROCECURE------------------------------------------------------------

    // console.log("progDetails", progDetails);
    // console.log("procs", this.procs);

    // this.HashTable.insert(procName, "procT", this.depth , progDetails);

    let result = this.HashTable.writeTable(this.depth);
    console.log(result);

    this.tables.push(this.procs[this.depth]);
    this.HashTable.deleteDepth(this.depth);
    let stack = this.stack;
    console.log("depth", this.depth);

    stack.map((item) => {
      console.log(item);
    });

    // console.log("Depth " + this.depth);

    this.depth--;
    this.popAfterOldBP(this.stack);

    let currProc = this.procs[this.depth];
    this.HashTable.insert(currProc.lexeme, "procT", currProc.depth, currProc);
    delete this.procs[this.depth + 1];
    // console.log("Depth", this.depth + 1, " ", result);

    // console.log("procs:", this.procs);

    this.tables.push(result);
    // if (this.depth == 0) {
    //   this.tables.push(depth0);d
    // }
    // SET EOF TOKEN TO TRUE

    if (this.depth == 0) {
      // console.log("FINAL RESULTS:", this.tables);
      this.EOF = true;
      this.tables.push(this.procs[this.depth]);
      tac = `START PROC ${procName.lexeme.toLowerCase()}`; // START PROC ProcName
      // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
      this.Emit(tac);
      asm = `
        start PROC\n
mov ax, @data\n
mov ds, ax\n
call ${procName.lexeme.toLowerCase()}\n
mov ah, 4ch\n
mov al,0\n
int 21h\n
start ENDP\n
END start
      `;

      this.ASM += asm;
      // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
    }
    console.log(this.TAC);

    return this.tables;
  }

  Args() {
    const token = this.getCurrentToken();
    let list = []; // Initialize empty list to pass to ArgList

    this.depth++;
    if (token && token.token === "LparenT") {
      this.Match("LparenT");
      const argListResult = this.ArgList(list); // Pass list to ArgList
      if (argListResult) {
        list = argListResult.list; // Update list with result
      }
      if (!this.Match("RparenT")) {
        console.log("Expected RparenT");
        return false;
      }
    }
    // insert the lexeme into this.procDetails
    list.forEach((item) => {
      this.procDetails.values.params.push(item.lexeme);
    });
    let paramSize = this.SetParamSizes(list);

    return { list, paramSize }; // Return the final list of arguments
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

    if (!this.Match("colonT")) return false;

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

        let lookupResult = this.HashTable.lookup(output.list[i].lexeme);
        if (lookupResult == null) {
          this.setOffset(output.list[i].lexeme, output.list[i].typeMark);
        }

        // console.log(output.list[i]);
        let size = 0;
        output.list[i].typeMark == "realT" ||
        output.list[i].typeMark == "valueR"
          ? (size = 4)
          : (size = 2);
        this.pushStack(output.list[i].lexeme, size);
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
      this.Match("semicolonT");
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
      let id = this.Match("idT");
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
      this.Match("commaT");
      let id = this.Match("idT");
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
      if (!this.Match("assignOp")) {
        // this.addError("Expected assignOp after constT");
        console.log("Expected assignOp after constT");
        return false;
      }
      let value = this.Value();

      // console.log(token);

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
    let arg = {
      lexeme: "",
      typeMark: "", // Will be set below
      offset: "", //add
    };

    let typeMark;
    let returnedIds = [];
    let idList,
      data = [];
    // Variable declarations: list of identifiers, their type, and a semicolon
    while (this.getCurrentToken() && this.getCurrentToken().token === "idT") {
      idList = this.IdentifierList();
      // console.log(idList);

      if (!this.Match("colonT")) return false;
      typeMark = this.TypeMark();
      if (!this.Match("semicolonT")) return false;
      data.push({
        idList,
        typeMark: typeMark.typeMark,
        token: typeMark.token,
      });

      //-------------restructure the object---------------

      // console.log(idList, typeMark);
      for (let index = 0; index < idList.length; index++) {
        let currOffset = this.offset;
        // set the values of the arg object
        if (typeMark.typeMark == "CONSTANT") {
          (arg.lexeme = idList[index].lexeme),
            (arg.typeMark = typeMark.token),
            (arg.offset = currOffset);
        } else {
          (arg.lexeme = idList[index].lexeme),
            (arg.typeMark = typeMark.typeMark),
            (arg.offset = currOffset);
        }

        if (typeMark.typeMark == "CONSTANT") {
          this.setOffset(arg.lexeme, typeMark.token);
          data[index].typeMark = typeMark.token;
        } else {
          this.setOffset(arg.lexeme, typeMark.typeMark);
        }

        returnedIds.push(idList[index].lexeme);

        let token = idList[index].token;
        let props = {
          typeMark: arg.typeMark,
          offset: arg.offset,
          const: true,
        };

        if (!this.HashTable.lookup(arg.lexeme)) {
          this.HashTable.insert(arg.lexeme, token, this.depth, props);
          this.setLocalSizes(arg.typeMark);
          // console.log(arg.lexeme, arg.typeMark);
        }

        this.pushStack(arg.lexeme, arg.typeMark);

        //add to symbolTable here
      }
      //reset the procDetails // localSize to be specific

      idList.forEach((id) => {
        this.procDetails.values.locals.push(id.lexeme);
      });
      // console.log(idList);
    }

    //ORGANIZING OUTPUT
    let localSize = this.procDetails.sizeOfLocals;

    //RETURN THE LIST AND LOCALSIZES
    return { returnedIds, localSize };
  }

  Procedures() {
    // Handle nested procedures
    while (this.getCurrentToken().token === "procedureT") {
      let prog = this.Prog();

      let procedures = this.Procedures();
      return true;
    }
    return true;
  }

  //  // ______________________________Helper Functions_____________________________________________________________

  SetParamSizes(list) {
    list.forEach((item) => {
      switch (item.typeMark) {
        case "integerT":
          this.procDetails.sizeOfParams += 2;
          break;
        case "realT":
          this.procDetails.sizeOfParams += 4;
          break;

        default:
          break;
      }
    });
    let paramSize = this.procDetails.sizeOfParams;

    return paramSize;
  }

  setLocalSizes(typeMark) {
    if (typeMark == "char") {
      this.procDetails.sizeOfLocals += 1;
    } else if (typeMark == "value" || typeMark == "integerT") {
      this.procDetails.sizeOfLocals += 2;
    } else if (typeMark == "valueR" || typeMark == "realT") {
      this.procDetails.sizeOfLocals += 4;
    }
  }

  //ASSIGNMENT 5 FUNCTIONS

  setOffset(lexeme, typeMark) {
    // Using if/else statements
    if (!this.HashTable.lookup(lexeme)) {
      if (typeMark === "value" || typeMark === "integerT") {
        this.offset += 2;
      } else if (typeMark === "valueR" || typeMark === "realT") {
        this.offset += 4;
      } else if (typeMark === "charT") {
        this.offset++;
      }
    }
  }

  //ASSIGNMENT 6 METHODS

  Statement() {
    //   Statement -> AssignStat || IOStat
    if (this.getCurrentToken().token == "idT") {
      const assignStat = this.AssignStat();
    } else {
      const ioStat = this.IOStat();

      return true;
    }
  }

  SeqOfStatements() {
    // SeqOfStatments -> Statement ; StatTail || return
    const token = this.getCurrentToken().token;
    if (token == "getT" || token == "putT" || token == "putLnT") {
      this.calculate = true;
    }
    if (
      token == "idT" ||
      token == "getT" ||
      token == "putT" ||
      token == "putLnT"
    ) {
      let statement = this.Statement();

      this.Match("semicolonT");

      let statTail = this.StatTail();
      return true;
    } else {
      return;
    }
  }

  StatTail() {
    // StatTail -> Statement ; StatTail || return
    const token = this.getCurrentToken().token;
    // console.log("INNNNNNNNNNNNN");

    if (
      token == "idT" ||
      token == "getT" ||
      token == "putT" ||
      token == "putLnT"
    ) {
      const statement = this.Statement();

      this.Match("semicolonT");

      const statTail = this.StatTail();
    } else {
      return;
    }
  }

  AssignStat() {
    console.log(this.stack)
    // AssignStat -> idt := Expr || ProcCall
    let idt = this.getCurrentToken();
    if (idt.token == "idT") {
      let token = this.getCurrentToken();
      let idt = token;

      let ptr = this.HashTable.lookup(token.lexeme);
      if (ptr.const) {
        //if ptr.const == true
      }
      if (ptr) {
        this.Match("idT");
      }

      token = this.getCurrentToken().token;
      if (token == "assignOp") {
        this.Match("assignOp");
        const expr = this.Expr();
        console.log(idt.lexeme, " ", expr);

        //  UPDATE THE VALUE OF THE VARIABLE ON THE LEFT OF THE ASSIGNMENT STATEMENT
        if (this.calculate) {
          if (this.IsNumber(expr)) {
            this.updateStackValue(idt.lexeme, expr);
          } else {
            let data = this.getStackData(expr);
            this.updateStackValue(idt.lexeme, data.value);
          }
        }

        this.typeList = [];
        let tac = `${idt.lexeme} = ${expr}`;
        let dest = this.findBPPointer(idt.lexeme);
        let source = this.findBPPointer(expr);
        if (this.depth == 2) {
          tac = `${dest} = ${source}`;
        }
        //dest = var1
        // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
        this.Emit(tac, dest, source);

        // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
      } else if (token == "LparenT") {
        this.ProcCall(idt.lexeme);
      }

      return true;
    } else {
      this.typeList = [];
      return true;
    }
  }

  Expr() {
    // Expr -> Relation
    const relation = this.Relation();
    // console.log(this.typeList);

    return relation;
  }

  Relation() {
    // Relation -> SimpleExpr

    const simpleExpr = this.SimpleExpr();
    return simpleExpr;
  }

  SimpleExpr() {
    //  E =>  syn(T) -> R
    // SimpleExpr -> Term MoreTerm
    const term = this.Term(); //This is expressed as "T"   console.log(factor);

    const moreTerm = this.MoreTerm(term); //This is expressed as "R"
    // console.log(moreTerm);

    return moreTerm;
  }

  Term() {
    // T
    // Term -> Factor MoreFactor
    const factor = this.Factor();

    let factorData = this.GetTypeMark(factor);
    // console.log(factorData);
    this.typeList.push(factorData.typeMark);

    const moreFactor = this.MoreFactor(factor);
    // console.log(moreFactor);

    return moreFactor;
  }

  MoreTerm(inhVal) {
    // R
    // MoreTerm -> addopt Term MoreTerm || return

    if (this.getCurrentToken().token == "addOp") {
      // create temp values
      // create TAC   _tx = a addOp R
      const addOp = this.Match("addOp");
      const term = this.Term();

      let factorData = this.GetTypeMark(term);
      // console.log(factorData);
      // this.typeList.push(factorData.typeMark);

      const temp = this.NewTemp();
      this.HashTable.insert(temp, "idT", this.depth);
      this.pushStack(temp, 2);
      let ptr = this.HashTable.lookup(temp);

      //   UPDATE THE VALUE OF THE TEMP VALUES IN THE STACK
      if (this.calculate) {
        let var1 = this.getStackData(inhVal).value;
        let var2 = this.getStackData(term).value;
        addOp.lexeme == "+" ? (var1 += var2) : (var1 -= var2);
        this.updateStackValue(temp, var1);
      }

      // console.log("AHHHHHHHHHH!!!!!", temp, this.findBPPointer(temp));

      let tac = ``;
      let dest, source1, source2, op;
      if (this.depth >= 2) {
        dest = this.findBPPointer(temp);
        source1 = this.findBPPointer(inhVal);
        source2 = this.findBPPointer(term);
        op = addOp.lexeme;
        tac = `${dest} = ${source1} ${op} ${source2}`;
        // // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
        // this.Emit(tac, dest, source1, op, source2);
        // // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
      } else {
        tac = `${temp} = ${inhVal} ${addOp.lexeme} ${term}`;
      }
      // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
      this.Emit(tac, dest, source1, op, source2);

      // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST

      // console.log(tac);

      //pass temp value to this.MoreTerm
      const moreTerm = this.MoreTerm(temp);
      return moreTerm;
    } else {
      return inhVal;
    }
  }

  MoreFactor(inhVal) {
    // create temp values, insert to hash and Synthesize
    // MoreFactor -> mulopt Factor MoreFactor || return

    if (this.getCurrentToken().token == "mulOp") {
      const mulOp = this.Match("mulOp");
      const factor = this.Factor();
      // create temp values  and insert into HashTable

      let factorData = this.GetTypeMark(factor);
      // console.log(factorData);
      this.typeList.push(factorData.typeMark);

      const temp = this.NewTemp();
      this.HashTable.insert(temp, "idT", this.depth);
      this.pushStack(temp, 2);

      let ptr = this.HashTable.lookup(temp);

      //   UPDATE THE VALUE OF THE TEMP VALUES IN THE STACK
      if (this.calculate) {
        console.log(this.getStackData(inhVal));

        let var1 = this.getStackData(inhVal).value;
        let var2 = this.getStackData(factor).value;
        mulOp.lexeme == "*" ? (var1 *= var2) : (var1 /= var2);
        this.updateStackValue(temp, var1);
      }

      // create TAC   _tx = a mulOp R
      // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
      let dest, source1, source2, op;
      let tac = ``;
      if (this.depth >= 2) {
        dest = this.findBPPointer(temp);
        source1 = this.findBPPointer(inhVal);
        source2 = this.findBPPointer(factor);
        op = mulOp.lexeme;
        tac = `${dest} = ${source1} ${op} ${source2}  `; // in depth 2
      } else {
        tac = `${temp} = ${inhVal} ${mulOp.lexeme} ${factor}  `; // in depth 1
      }
      this.Emit(tac, dest, inhVal, op, factor);
      // console.log("DESTIINATION" + dest);

      // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST

      // console.log(tac);
      //pass temp value to this.MoreTerm
      const moreFactor = this.MoreFactor(temp);
      return moreFactor;
    } else {
      return inhVal;
    }

    return true; // Assuming no more factors is a valid option
  }

  Factor() {
    //returns the lexeme value
    // Factor -> idt || numt || ( Expr )|| nott Factor|| signopt Factor

    let token = this.getCurrentToken();
    if (token.token == "idT") {
      //checking if the idT is in hashTable

      if (this.HashTable.lookup(token.lexeme)) {
        this.Match("idT");
        return token.lexeme;
      } else {
        this.errors.push(`Undefined token: ${token.lexeme} `);
        console.log(token.lexeme);
      }
      return false;
    } else if (token.token == "value" || token.token == "valueR") {
      token.token = "numT";
      this.Match("numT");
      return token.lexeme;
    } else if (token.token == "LparenT") {
      // fix
      this.Match("LparenT");
      const expr = this.Expr();
      this.Match("RparenT");
      return token.lexeme;
    } else if (token.token == "notT") {
      let notT = this.Match("notT");
      const factor = this.Factor();
      // const notValue = `notT + factor`
      return factor;
    } else if (token.token == "addOp") {
      //use addOp = signOp
      let addOp = this.Match("addOp");

      const factor = this.Factor();
      return `${addOp.lexeme}${factor}`;
    } else {
      this.addError("Expected idT, numT, LparenT, notT, or signOp");
    }
  }

  // Factor -> idt || numt || ( Expr )|| nott Factor|| signopt Factor

  IsNumber(value) {
    // First check if it's a temporary variable
    if (value.startsWith("_t")) {
      return false;
    }

    // Try to convert to number
    const num = Number(value);

    // Check if it's a valid number (not NaN)
    if (!isNaN(num)) {
      return true;
    }

    return false;
  }

  Consume(token) {
    // console.log(token, this.getCurrentToken().line);

    this.getCurrentToken().token == token && this.currentToken++;
  }

  // Assignment 7 Section:
  ProcCall(procName) {
    // ProcCall ->  ( Params )
    this.Match("LparenT");
    const params = this.Params();
    this.Match("RparenT");
    let tac = "call " + procName; // call ProcName
    // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
    this.Emit(tac);
    // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
  }

  Params() {
    // Params -> idt ParamsTail || num ParamsTail || return
    let token = this.getCurrentToken();
    let lex = token.lexeme;
    token = token.token;

    if (token == "idT" || token == "value" || token == "valueR") {
      if (token == "idT") {
        let idt = this.Match("idT");
        // console.log(idt);
        let tac = "push " + idt.lexeme; // Push var
        // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
        this.Emit(tac);
        // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
        this.ParamsTail();
      } else if (token == "value" || "valueR") {
        let idt = this.Match(token);
        let tac = "push " + idt.lexeme; //push var
        // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
        this.Emit(tac);
        // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
        this.ParamsTail();
      }

      return true;
    } else {
      return true;
    }
  }

  ParamsTail() {
    // ParamsTail -> , idt ParamsTail || , num ParamsTail || return
    let token = this.getCurrentToken().token;

    if (token == "commaT") {
      this.Match("commaT");
      token = this.getCurrentToken().token;

      if (token == "idT" || token == "value" || token == "valueR") {
        if (token == "idT") {
          let idt = this.Match(token);
          let tac = "push " + idt.lexeme; // Push var
          // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
          this.Emit(tac);
          // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
          return;
        }
        if (token == "value" || "valueR") {
          let idt = this.Match(token);
          let tac = "push " + idt.lexeme; // Push var
          // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
          this.Emit(tac);
          // --------8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8-8 POINT OF INTEREST
        }
        this.ParamsTail();
      }
    } else {
      return true;
    }
  }

  NewTemp() {
    //creates temporary values and pushes them onto this.sta ck
    //if depth !>= 1 : else use the BPcounters
    this.tempCount++;
    let newTemp = `_t${this.tempCount}`;

    return newTemp;
  }
  pushStack(lex, size) {
    if (size === "integerT" || size == "value") {
      size = 2;
    } else if (size === "realT" || size === "valueR") {
      size = 4;
    }
    let node = { ...this.node, lex: lex, size: size };

    this.stack.push(node);
  }

  popAfterOldBP(stack, inclusive = false) {
    const oldBPIndex = stack.findIndex((item) => item.lex === "BP");

    if (oldBPIndex === -1) {
      return []; // 'Old_BP' not found
    }

    const startIndex = inclusive ? oldBPIndex : oldBPIndex + 1;
    const poppedItems = stack.splice(startIndex);
    return poppedItems;
  }

  findBPPointer(targetLexeme, bpLexeme = "BP") {
    // Check if the targetLexeme is in the stack
    const targetIndex = this.stack.findIndex(
      (item) => item.lex === targetLexeme
    );
    if (targetIndex !== -1) {
      // If the targetLexeme is in the stack, run the method
      // Find BP index (current activation frame)
      const bpIndex = this.stack.findIndex((item) => item.lex === bpLexeme);
      if (bpIndex === -1) {
        console.log(`"${bpLexeme}" not found in stack`);
        return 0;
      }

      let sum = 0;
      let found = false;

      // PHASE 1: First search upward (called procedures, positive sum)
      for (let i = bpIndex + 1; i < this.stack.length; i++) {
        sum += this.stack[i].size; // Count all frames traversed

        if (this.stack[i].lex === targetLexeme) {
          found = true;
          break;
        }
      }

      sum = `_bp-${sum}`;

      if (found) return sum;

      // Reset sum if not found upward
      sum = 0;

      // PHASE 2: Then search downward (outer scopes, negative sum)
      for (let i = bpIndex - 1; i >= 0; i--) {
        sum += this.stack[i].size; // Count all frames traversed

        if (this.stack[i].lex === targetLexeme) {
          found = true;
          break;
        }
      }

      if (!found) {
        console.log(`Target lexeme "${targetLexeme}" not found in stack`);
        return 0;
      }

      sum = `_bp+${sum}`;

      return sum;
    } else {
      // If the targetLexeme is not in the stack, return the targetLexeme
      return targetLexeme;
    }
  }

  GetTypeMark(lex) {
    lex = this.removeHyphen(lex);

    // First try to convert to number
    const num = Number(lex);

    // Check if it's a valid number (not NaN)
    if (!isNaN(num)) {
      // Check if it's a float (has decimal point and fractional part)
      if (String(lex).includes(".") && !Number.isInteger(num)) {
        return { lex, typeMark: "realT" };
      } else {
        return { lex, typeMark: "integerT" };
      }
    }
    // If not a number, look up in hash table
    else {
      let lookup = this.HashTable.lookup(lex);
      lookup.typeMark == "value" || lookup.typeMark == "integerT"
        ? (lookup.typeMark = "integerT")
        : (lookup.typeMark = "realT");
      return { lex, typeMark: lookup.typeMark };
    }
  }

  removeHyphen(str) {
    // Check if the string contains a hyphen
    const containsHyphen = str.includes("-");

    // Remove all hyphens from the string
    let resultString = str;
    if (containsHyphen) {
      resultString = str.replace(/-/g, "");
    }

    return resultString;
  }

  removeUnderScore(str) {
    return str.replace("_", "");
  }

  Emit(tac, dest, source1, op, source2) {
    //Pushes TAC messages into .tac file
    let message = `${tac}`;
    this.TAC.push(message);
    // source2 = this.removeUnderScore(source2);
    if (dest) {
      dest = this.removeUnderScore(dest);
      source1 = this.removeUnderScore(source1);
      source2 && (source2 = this.removeUnderScore(source2));
      console.log(dest, source1);
      

      this.Mov(dest, source1, op= null, source2=null);
    }
  }

  Mov(dest, source1, op = null, source2 = null) {
    if (op !== null && source2 !== null) {
      // Handle arithmetic operations
      let containsBP = this.containsBP(dest);
      containsBP ? (dest = `[${dest}]`) : null;
      containsBP = this.containsBP(source1);
      containsBP ? (source1 = `[${source1}]`) : null;
      containsBP = this.containsBP(source2);
      containsBP ? (source2 = `[${source2}]`) : null;

      if (op == "+" || op == "-") {
        let result = `mov ax, ${source1}\n`;
        result += `add ax, ${source2}\n`;
        result += `mov ${dest}, ax\n`;
        this.ASM += result;
      }
      if (op == "*" || op == "/") {
        let result = `mov ax, ${source1}\n`;
        result += `mov bx, ${source2}\n`;
        result += `imul bx\n`;
        result += `mov ${dest}, ax\n`;
        this.ASM += result;
      }
    } else {
      // Handle simple assignment
      let containsBP = this.containsBP(dest);
      let containsBPSource = this.containsBP(source1);

      let result = "";
      if (containsBPSource) {
        result += `mov ax, [${source1}]\n`;
      } else {
        result += `mov ax, ${source1}\n`;
      }

      if (containsBP) {
        result += `mov [${dest}], ax\n`;
      } else {
        result += `mov ${dest}, ax\n`;
      }

      this.ASM += result;
    }
  }

  containsBP(str) {
    return str.includes("bp");
  }

  getStackData(lexeme) {
    // Find the node in the stack that matches the lexeme
    const node = this.stack.find((item) => item.lex === lexeme);
    if (this.IsNumber(lexeme)) {
      return lexeme;
    }

    if (!node) {
      console.log(`Lexeme "${lexeme}" not found in stack`);
      return null;
    }

    // Return an object with all the node's properties
    return {
      lexeme: node.lex,
      size: node.size,
      value: node.value || 0,
      // Get the BP pointer for this variable
      bpPointer: this.findBPPointer(lexeme),
      // Get the type information from the hash table
      typeInfo: this.HashTable.lookup(lexeme),
    };
  }

  updateStackValue(lexeme, newValue) {
    // Find the node in the stack that matches the lexeme
    const nodeIndex = this.stack.findIndex((item) => item.lex === lexeme);

    if (nodeIndex === -1) {
      console.log(`Lexeme "${lexeme}" not found in stack`);
      return false;
    }

    // Get the node's type information
    const typeInfo = this.HashTable.lookup(lexeme);

    // Convert the value based on the type
    let convertedValue;
    if (typeInfo.typeMark === "integerT" || typeInfo.typeMark === "value") {
      convertedValue = parseInt(newValue);
    } else if (
      typeInfo.typeMark === "realT" ||
      typeInfo.typeMark === "valueR"
    ) {
      convertedValue = parseFloat(newValue);
    } else {
      convertedValue = newValue;
    }

    // Update the node's value
    this.stack[nodeIndex].value = convertedValue;

    // Generate TAC for the update
    const bpPointer = this.findBPPointer(lexeme);
    let tac = `mov [${bpPointer}], ${convertedValue}`;
    this.Emit(tac);

    return true;
  }

  //
  // Assignment 8 methods

  IOStat() {
    //  IOStat -> InStat  || OutStat
    if (this.getCurrentToken().token == "getT") {
      let inStat = this.InStat();
    } else {
      let outStat = this.OutStat();
      console.log(this.OutputMessages);
    }
  }

  InStat() {
    // InStat -> get ( IdList )
    this.Match("getT");
    this.Match("LparenT");
    let idList = this.IdList();
    console.log(idList);

    //Generate TAC for output
    idList.forEach((item) => {
      let BP_pos = this.findBPPointer(item.lexeme);
      console.log(this.Message);

      // console.log(`The position of ${item.lexeme} is ${BP_pos} `);

      this.updateStackValue(item.lexeme, this.userInput);
      console.log(
        this.stack.map((item) => {
          console.log(item);
        })
      );

      let tac = `rdi ${BP_pos}`;
      this.Emit(tac);
      this.ASM += `call readint \nmov [${BP_pos}], bx`;
    });

    this.Match("RparenT");
  }

  IdList() {
    //  IdList -> idT IdListTail
    let list = [];
    let idt = this.Match("idT");
    list.push(idt);

    let idListTail = this.IdListTail(list);
    return idListTail;
  }

  IdListTail(list) {
    //  IdListTail -> , idT IdListTail  || return
    if (this.getCurrentToken().token == "commaT") {
      this.Match("commaT");
      let idt = this.Match("idT");
      list.push(idt);

      let idListTail = this.IdListTail(list);
      return idListTail;
    } else {
      return list;
    }
  }

  OutStat() {
    // Out_Stat -> put(Write_List) | putln(Write_List)

    const token = this.getCurrentToken();
    let BP_pos;

    if (token.token === "putT" || token.token === "putLnT") {
      this.Match(token.token);
      this.Match("LparenT");
      const writeList = this.WriteList();

      //Generate TAC for output
      if (token.token === "putLnT") {
        writeList.forEach((item) => {
          BP_pos = this.findBPPointer(item[0]);
          console.log(BP_pos);
        });
      }

      this.Match("RparenT");

      // Generate TAC for output
      let S_var = `_S${this.SvarCount}`;
      this.SvarCount++;

      let tac = token.token === "putT" ? `wrs ${S_var}` : "wri" + BP_pos + "\n";
      this.Emit(tac);
      if (token.token === "putLnT") {
        tac = "wrln";
        this.Emit(tac);
        this.ASM += `mov dx, [${BP_pos}] \ncall writeint \n call writeLn \n`;

        let value = this.getStackData(writeList[0][0]);
        this.messVal = value;
        window.alert(this.Message + " " + value.value);
      } else {
        this.ASM += `mov dx, offset ${S_var} \ncall writeStr\n `;

        this.userInput = prompt(this.Message);
        this.OutputMessages.push(S_var + " DB " + this.Message + `,\"$\"`);
      }
      console.log("User entered:", this.messVal); // userInput contains what the user typed

      return this.Message;
    }
    return false;
  }

  WriteList() {
    // Write_List -> Write_Token Write_List_Tail
    let list = [];
    const writeToken = this.WriteToken();
    if (!writeToken) return [];

    list.push(writeToken);

    const writeListTail = this.WriteListTail(list);
    return [writeListTail];
  }

  WriteListTail(list) {
    // Write_List_Tail -> , Write_Token Write_List_Tail | ε

    if (this.getCurrentToken().token === "commaT") {
      this.Match("commaT");
      const writeToken = this.WriteToken();
      if (!writeToken) return [];
      list.push(writeToken);

      const writeListTail = this.WriteListTail(list);
      return [writeListTail];
    }
    return list;
  }

  WriteToken() {
    // Write_Token -> idt | numt | literal
    const token = this.getCurrentToken();

    if (token.token === "idT") {
      const idt = this.Match("idT");
      return idt.lexeme;
    } else if (token.token === "value" || token.token === "valueR") {
      const numt = this.Match(token.token);
      return numt.lexeme;
    } else if (token.token === "doubleQuotesT") {
      return this.extractStringLiteral();
    }

    return null;
  }

  extractStringLiteral() {
    // Handles string literals enclosed in double quotes
    let stringContent = "";

    // Match opening double quote
    this.Match("doubleQuotesT");

    // Get the content between quotes
    let string = this.Match("literalT");
    this.Message = string;

    // Match closing double quote
    this.Match("doubleQuotesT");

    // Return the string with quotes
    return `"${stringContent}"`;
  }
}

export default SyntaxAnalyzer2;
