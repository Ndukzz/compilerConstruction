//To-Do: The depthData is accessed in the syntaxResults and the lexical analysis results should be replaced with the tables of the depthsData
//create a component to properly handle the data
//first abstract the component to seperate theme by depth and then create tables or rows to properly display the data

import React, { useState } from "react";

import LexicalAnalyzer from "./components/LexicalAnalyzer";
import SyntaxAnalyzer from "./components/SyntaxAnalyzer";
import styles from "./compiler.module.css";

function App() {
  const [fileContent, setFileContent] = useState("");
  const [analysisResults, setAnalysisResults] = useState([]);
  const [syntaxResults, setSyntaxResults] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [tokenCount, setTokenCount ] = useState(0)

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
      console.log(syntaxResults);
    }
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
          <div className={`${styles.panelContent} ${styles.scrollableContent}`}>
            {analysisResults.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th>count</th>
                    <th>Lexeme</th>
                    <th>Token</th>
                    <th>Attribute</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResults.map((result, index) => (
                    <tr key={index} className={styles.tableRow}>
                      <td>{++index}</td>
                      <td>{result.lexeme}</td>
                      <td className={styles.tokenCell}>
                        {result.token || "-"}
                      </td>
                      <td className={styles.attributeCell}>
                        {result.attribute || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyMessage}>
                No analysis results yet...
              </div>
            )}
          </div>
        </div>

        {/* Syntax Analysis Results */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Syntax Analysis Results</div>
          <div className={styles.panelContent}>
            {syntaxResults ? (
              <div>
                <div
                  className={`${styles.syntaxResult} ${
                    syntaxResults.success
                      ? styles.successMessage
                      : styles.errorMessage
                  }`}
                >
                  {syntaxResults.success
                    ? "Syntax Analysis Successful"
                    : "Syntax Analysis Failed"}
                </div>
                {syntaxResults.errors.length > 0 && (
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
      </div>
    </div>
  );
}

export default App;
