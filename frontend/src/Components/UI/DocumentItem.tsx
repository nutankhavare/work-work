import { tenantAsset } from "../../Services/ApiService";

interface DocumentItemProps {
  label: string;
  path: string;
  updatedAt?: string;
}

const DocumentItem = ({ label, path, updatedAt }: DocumentItemProps) => {
  const fileUrl = path.startsWith("http") ? path : `${tenantAsset}${path}`;

  // Get file extension
  const getFileExtension = (filePath: string): string => {
    return filePath.split(".").pop()?.toLowerCase() || "";
  };

  const fileExtension = getFileExtension(path);

  // Determine file type
  const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(fileExtension);
  const isPDF = fileExtension === "pdf";
  const isDoc = ["doc", "docx"].includes(fileExtension);
  const isExcel = ["xls", "xlsx", "csv"].includes(fileExtension);
  const isOther = !isImage && !isPDF && !isDoc && !isExcel;

  // Get icon based on file type
  const getFileIcon = () => {
    if (isPDF) return "📄";
    if (isDoc) return "📝";
    if (isExcel) return "📊";
    return "📎";
  };

  // Get file type label
  const getFileTypeLabel = () => {
    if (isPDF) return "PDF";
    if (isDoc) return "DOC";
    if (isExcel) return "EXCEL";
    if (isImage) return "IMAGE";
    return fileExtension.toUpperCase();
  };

  return (
    <div className="p-3 bg-gray-50 mx-w-xs rounded border border-gray-200 hover:border-purple-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600 uppercase">{label}</p>
        <span className="text-xs font-bold text-purple-600 uppercase">{getFileTypeLabel()}</span>
      </div>

      {/* Image Preview */}
      {isImage && (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={fileUrl}
            alt={label}
            className="w-full h-40 object-cover rounded border border-gray-300 hover:opacity-90 transition-opacity"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
            }}
          />
        </a>
      )}

      {/* PDF Preview */}
      {isPDF && (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
          <div className="w-full h-40 flex flex-col items-center justify-center hover:bg-blue-100 transition-colors">
            <span className="text-5xl mb-2">📄</span>
            <span className="text-xs font-semibold text-black uppercase">View PDF</span>
          </div>
        </a>
      )}

      {/* Document Preview (Word, Excel, etc.) */}
      {(isDoc || isExcel) && (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
          <div
            className={`w-full h-40 rounded border flex flex-col items-center justify-center hover:opacity-90 transition-opacity ${
              isDoc ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
            }`}
          >
            <span className="text-5xl mb-2">{getFileIcon()}</span>
            <span
              className={`text-xs font-semibold uppercase ${
                isDoc ? "text-blue-700" : "text-green-700"
              }`}
            >
              View {getFileTypeLabel()}
            </span>
          </div>
        </a>
      )}

      {/* Other File Types */}
      {isOther && (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
          <div className="w-full h-40 bg-gray-100 rounded border border-gray-300 flex flex-col items-center justify-center hover:bg-gray-200 transition-colors">
            <span className="text-5xl mb-2">📎</span>
            <span className="text-xs font-semibold text-gray-700 uppercase">View File</span>
          </div>
        </a>
      )}

      {updatedAt && (
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Synced
          </span>
          <span className="text-[9px] font-bold text-gray-400">
            {new Date(updatedAt).toLocaleString([], {
              hour: "2-digit",
              minute: "2-digit",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default DocumentItem;
