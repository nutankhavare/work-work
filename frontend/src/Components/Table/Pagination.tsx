import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  perPage?: number;
}

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemName = "items",
  perPage = 10,
}: PaginationProps) => {
  // Calculate "Showing X – Y of Z" range
  const from = Math.min((currentPage - 1) * perPage + 1, totalItems);
  const to = Math.min(currentPage * perPage, totalItems);

  // Build page number array with ellipsis
  const buildPages = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const pages = buildPages();

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 bg-[#fafbff] border-t border-[#f1f5f9]">
      {/* Left — Showing info */}
      <span className="text-[12px] font-[700] text-[#94a3b8]">
        Showing{" "}
        <span className="font-[900] text-[#475569]">
          {totalItems === 0 ? 0 : from}–{to}
        </span>{" "}
        of <span className="font-[900] text-[#475569]">{totalItems}</span> {itemName}
      </span>

      {/* Right — Page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-[30px] h-[30px] rounded-[8px] border-[1.5px] border-[#e2e8f0] bg-white text-[#64748b] flex items-center justify-center hover:border-[#7c3aed] hover:text-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="w-[30px] h-[30px] flex items-center justify-center text-[12px] font-[700] text-[#94a3b8]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[30px] h-[30px] px-[6px] rounded-[8px] border-[1.5px] text-[12px] font-[800] flex items-center justify-center transition-all font-[Manrope,sans-serif] ${
                p === currentPage
                  ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-[0_2px_8px_rgba(124,58,237,0.28)]"
                  : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#7c3aed] hover:text-[#7c3aed]"
              }`}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-[30px] h-[30px] rounded-[8px] border-[1.5px] border-[#e2e8f0] bg-white text-[#64748b] flex items-center justify-center hover:border-[#7c3aed] hover:text-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
