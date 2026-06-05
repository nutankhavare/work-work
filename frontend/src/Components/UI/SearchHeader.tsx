import React from "react";
import { Link } from "react-router-dom";
import SearchComponent from "./SearchComponents";

interface HeaderProps {
  title: string;
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
  // --- New props for search functionality ---
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

const SearchHeader: React.FC<HeaderProps> = ({
  title,
  buttonText = "",
  buttonLink = "#",
  buttonColor = "purple",
  showSearch = false,
  onSearch,
  searchPlaceholder,
}) => {
  const bgColor = `bg-${buttonColor}-200`;
  const hoverColor = `hover:bg-${buttonColor}-300`;
  const textColor = `text-${buttonColor}-950`;

  return (
    // This layout is now responsive. It stacks on mobile and is a row on larger screens.
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h1 className="text-md font-bold text-purple-950 uppercase">{title}</h1>

      {/* A new container for action items (search and button) */}
      <div className="flex items-center gap-4">
        {/* Conditionally render the SearchComponent if props are provided */}
        {showSearch && onSearch && (
          <SearchComponent onSearch={onSearch} placeholder={searchPlaceholder} />
        )}

        {/* The existing button logic remains the same */}
        {buttonLink && buttonText && (
          <Link
            to={buttonLink}
            className={`${bgColor} ${textColor} shadow-sm font-bold py-1 px-4 rounded-lg ${hoverColor} transition-colors uppercase whitespace-nowrap`}
          >
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  );
};

export default SearchHeader;
