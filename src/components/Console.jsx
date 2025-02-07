import React from 'react';

const Console = ({ data }) => {
  return (
    <div className="console-container">
      <div className="console-header">
        <h3>Lexical Analysis Results</h3>
      </div>
      <div className="console-content">
        {data && data.length > 0 ? (
          <table className="results-table">
            <thead>
              <tr>
                <th>Lexeme</th>
                <th>Token</th>
                <th>Attribute</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item.lexeme}</td>
                  <td>{item.token}</td>
                  <td>{item.attribute || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="console-placeholder">No analysis results yet...</p>
        )}
      </div>
    </div>
  );
};

export default Console; 