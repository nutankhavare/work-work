import React from "react";
import { Link } from "react-router-dom";
import { FaEye, FaRegEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode; // optional custom renderer
}

interface DynamicTableProps<T> {
  list: T[];
  columns: TableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  editUrl?: string; // optional: "/roles/edit"
  viewUrl?: string; // optional: "/roles/edit"
}

const Table = <T extends { id: number | string }>({
  list,
  columns,
  // onEdit,
  onDelete,
  editUrl,
  viewUrl,
}: DynamicTableProps<T>) => {
  return (
    <div className="overflow-x-auto rounded-t-lg shadow-sm">
      <table className="min-w-full">
        <thead className="bg-gray-100 text-left">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key.toString()}
                className={`px-6 py-3 text-sm font-bold text-purple-950 uppercase tracking-wider`}
              >
                {col.label}
              </th>
            ))}

            {(viewUrl || editUrl || onDelete) && (
              <th className="px-6 py-3 text-sm font-bold text-purple-950 uppercase tracking-wider text-center">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {list.length > 0 ? (
            list.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-200">
                {columns.map((col) => (
                  <td
                    key={col.key.toString()}
                    className={`px-6 py-4 text-sm text-gray-900 uppercase`}
                  >
                    {col.render
                      ? col.render(item, index)
                      : (item[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}

                {(viewUrl || editUrl || onDelete) && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex justify-center items-center gap-2">
                      {viewUrl && (
                        <Link to={`${viewUrl}/${item.id}`} className="text-blue-600">
                          <FaEye size={24} />
                        </Link>
                      )}
                      {editUrl && (
                        <Link to={`${editUrl}/${item.id}`} className="text-green-900">
                          <FaRegEdit size={24} />
                        </Link>
                      )}

                      {onDelete && (
                        <button className="text-red-600" onClick={() => onDelete(item)}>
                          <RiDeleteBin6Line size={24} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-6 py-10 uppercase text-center text-gray-500"
              >
                No records found..
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
