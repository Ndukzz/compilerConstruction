const DisplayProcs = ({ procs }) => {
  // console.log(procs);

  const content = (
    <div>
      <h2 style={{marginLeft: "50px"
      }}>Procedures</h2>
      <table
        style={{
          border: "1px solid black",
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid black", padding: "8px" }}>
              Procedure Name
            </th>
            <th style={{ border: "1px solid black", padding: "8px" }}>
              Parameter Size
            </th>
            <th style={{ border: "1px solid black", padding: "8px" }}>
              Local Size
            </th>
          </tr>
        </thead>
        <tbody>
          {procs.map((proc, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {proc.lexeme}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {proc.sizeOfParams}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {proc.sizeOfLocals}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return procs ? content : null;
};
export default DisplayProcs;
