//To-Do: The depthData is accessed in the syntaxResults and the lexical analysis results should be replaced with the tables of the depthsData
//create a component to properly handle the data
//first abstract the component to seperate theme by depth and then create tables or rows to properly display the data

import React, { useState } from "react";

import LexicalAnalyzer from "./components/LexicalAnalyzer";
import SyntaxAnalyzer from "./components/SyntaxAnalyzer";
import styles from "./compiler.module.css";
import DisplayVars from "./components/DisplayVars";
import DisplayProcs from "./components/DisplayProcs";

function App() {
  const [fileContent, setFileContent] = useState("");
  const [analysisResults, setAnalysisResults] = useState([]);
  const [syntaxResults, setSyntaxResults] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [tokenCount, setTokenCount] = useState(0);
  const [variables, setVariables] = useState([]);
  const [procedures, setProcedures] = useState([]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const text = await file.text();
      setFileContent(text);

      // Perform lexical analysis
      const lexicalAnalyzer = new LexicalAnalyzer({ input: text });
      const lexicalResults = lexicalAnalyzer.parseProgram();
      setAnalysisResults(lexicalResults);

      // Perform syntax analysis
      const syntaxAnalyzer = new SyntaxAnalyzer(lexicalResults);
      const syntaxResults = syntaxAnalyzer.analyze(); //the data:(depthData) is recieved here
      setSyntaxResults(syntaxResults);
      // console.log(syntaxResults);

      const depthData = syntaxResults.depthData;
      const lists = depthData.filter((item) => Array.isArray(item));
      setVariables(lists);
      const objects = depthData.filter(
        (item) => typeof item === "object" && !Array.isArray(item)
      );
      setProcedures(objects);
      // const errors = setErors()
    }
  };

  const showResults = () => {
    console.log({ variables, procedures });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Compiler Construction</h1>

      <div className={styles.fileInput}>
        <label className={styles.fileInputLabel}>
          Choose File
          <input
            type="file"
            className={styles.hiddenInput}
            onChange={handleFileChange}
            accept=".txt,.ada"
          />
        </label>
        <span className={styles.fileName}>{fileName}</span>
      </div>

      <div className={styles.resultsContainer}>
        {/* Lexical Analysis Results should be replaced with a component that properly displays the data*/}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Lexical Analysis Results</div>
          <DisplayVars vars={variables} />
          <DisplayProcs procs={procedures} />
        </div>

        {/* Syntax Analysis Results */}
  
          <div className={styles.panel}>
            <div className={styles.panelHeader}>Syntax Analysis Results</div>
            <div className={styles.panelContent}>
              {syntaxResults ? (
                <div>
                  <div
                    className={`${styles.syntaxResult} ${
                      syntaxResults.success && syntaxResults.EOF 
                        ? styles.successMessage
                        : styles.errorMessage
                    }`}
                  >
                    {console.log(syntaxResults.EOF)}
                    {syntaxResults.EOF
                      ? "Syntax Analysis Successful"
                      : "Syntax Analysis Failed"}
                  </div>
                  {syntaxResults.errors.length > 0 && !syntaxResults.EOF && (
                    <div className={styles.errorList}>
                      
                      <h3>Errors:</h3>
                      <ul>
                        {syntaxResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.emptyMessage}>
                  No syntax analysis results yet...
                </div>
              )}
            </div>
          </div>
       
        {/* <button onClick={showResults}> Show details</button> */}
      </div>
    </div>
  );
}

export default App;
