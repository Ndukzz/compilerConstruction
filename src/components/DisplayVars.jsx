import styles from "./DisplayVars.module.css";

const DisplayVars = ({ vars }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>Variables</div>
      <div className={styles.content}>
        {vars.map((element, index) => (
          <div key={index}>
            <h2 className={styles.depthHeader}>Depth {element[0].depth}</h2>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Offset</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {element.map((varItem, varIndex) => (
                  
                  <tr key={varIndex} className={styles.tableRow}>
                    <td>{varItem.lexeme}</td>
                    <td className={styles.typeCell}>{varItem.symToken == "procT" ? "procT": varItem.typeMark}</td>
                    <td className={styles.offsetCell}>{varItem.offset}</td>
                    <td className={styles.sizeCell}>
                      {varItem.symToken == "procT" ? " " : varItem.typeMark === "integerT"
                        ? "2 bytes"
                        : varItem.typeMark === "value"
                        ? "2 bytes"
                        : "4 bytes"}
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisplayVars;
