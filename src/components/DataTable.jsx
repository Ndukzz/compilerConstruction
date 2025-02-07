import React from 'react';
import { useTable } from 'react-table';

const DataTable = ({ data }) => {
    const columns = React.useMemo(
        () => [
            {
                Header: 'Lexeme',
                accessor: 'lexeme', // accessor is the "key" in the data
            },
            {
                Header: 'Token',
                accessor: 'token',
            },
            {
                Header: 'Attribute',
                accessor: 'attribute',
            },
        ],
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data });

    return (
        <table {...getTableProps()} style={{ border: 'solid 1px black', width: '100%', marginTop: '20px' }}>
            <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps()} style={{ border: 'solid 1px black', padding: '10px' }}>
                                {column.render('Header')}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                    prepareRow(row);
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map(cell => (
                                <td {...cell.getCellProps()} style={{ border: 'solid 1px black', padding: '10px' }}>
                                    {cell.render('Cell')}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default DataTable;