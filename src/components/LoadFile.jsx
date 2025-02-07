import React, { useState } from "react";
import LexicalAnalyzer from "./LexicalAnalyzer";
import Console from "./Console";

const LoadFile = () => {
  const [fileContent, setFileContent] = useState("");
  const [analysisData, setAnalysisData] = useState([]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target.result);
        const lexer = new LexicalAnalyzer(e.target.result);
        const results = lexer.parseProgram();
        setAnalysisData(results);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {/* <pre>{fileContent}</pre> */}
      <Console data={analysisData} />
    </div>
  );
};

export default LoadFile;
