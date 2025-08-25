import React from 'react';

// ResponsiveTable component that switches between table and card view on mobile
function ResponsiveTable({ columns, data, isDarkMode, actions }) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'}`}>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`rounded-lg p-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white shadow'
            }`}
          >
            {columns.map((column) => (
              <div key={column.key} className="mb-3 last:mb-0">
                <div className={`text-xs font-medium uppercase ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {column.label}
                </div>
                <div className={`mt-1 text-sm ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </div>
              </div>
            ))}
            {actions && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {actions(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default ResponsiveTable;