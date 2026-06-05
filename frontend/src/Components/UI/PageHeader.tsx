import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Menu, ArrowLeft } from "lucide-react";

interface HeaderProps {
  title: string;
  icon?: string | React.ReactNode;
  breadcrumb?: string;
  buttonText?: string;
  buttonLink?: string;
  showBackButton?: boolean;
  backButtonLink?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<HeaderProps> = ({
  title,
  icon,
  breadcrumb,
  buttonText = "",
  buttonLink = "",
  showBackButton = false,
  backButtonLink = "/dashboard",
  children,
}) => {
  const navigate = useNavigate();

  const renderIcon = () => {
    if (typeof icon === "string") {
      return (
        <span className="material-symbols-outlined ms" style={{ fontSize: "18px" }}>
          {icon}
        </span>
      );
    }
    return icon;
  };

  return (
    <div className="page-header !h-auto !py-4 md:!h-[72px] md:!py-0 flex flex-row items-center justify-between !px-6 mb-8 gap-4">
      {/* Left side: Title and Breadcrumb */}
      <div className="flex flex-col min-w-0">
        <div className="page-title flex items-center gap-2 truncate">
          {renderIcon()}
          <span className="truncate">{title}</span>
        </div>
        {breadcrumb && (
          <div className="breadcrumb truncate">
            {breadcrumb.split("/").map((item, index, arr) => (
              <React.Fragment key={index}>
                <span
                  className={index === 0 ? "cursor-pointer hover:underline" : ""}
                  onClick={index === 0 ? () => navigate("/dashboard") : undefined}
                >
                  {item.trim()}
                </span>
                {index < arr.length - 1 && <span className="mx-1">/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Hamburger & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle Button - Visible only on mobile/tablet */}
        <button
          className="lg:hidden mobile-toggle flex items-center justify-center shrink-0 w-[42px] h-[42px] bg-white border border-slate-200 rounded-xl shadow-sm active:scale-95 transition-all text-slate-700"
          title="Open Sidebar"
          onClick={() => {
            document.dispatchEvent(new CustomEvent("toggle-sidebar"));
          }}
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>

        {/* Desktop Actions Wrapper */}
        <div className="hidden lg:flex items-center gap-2 flex-wrap">
          {children}

          {showBackButton && (
            <button onClick={() => navigate(backButtonLink)} className="btn btn-secondary">
              <ArrowLeft size={16} strokeWidth={2.5} />
              Back to List
            </button>
          )}

          {buttonLink && buttonText && (
            <Link to={buttonLink} className="btn btn-primary">
              <Plus size={16} strokeWidth={2.5} />
              {buttonText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
