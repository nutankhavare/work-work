import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

interface HeaderProps {
  title: string;
  buttonText?: string;
  buttonLink: string;
  buttonColor?: string; // optional Tailwind color class
}

const PageHeaderBack: React.FC<HeaderProps> = ({ title, buttonText = "", buttonLink = "#" }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center gap-2 ">
        {buttonLink && (
          <Link
            to={buttonLink}
            className={`flex items-center font-bold rounded-lg text-md transition-colors uppercase`}
          >
            <FaArrowLeft size={25} /> {buttonText}
          </Link>
        )}

        <Link to={buttonLink} className="text-md font-bold text-purple-950 uppercase">
          {title}
        </Link>
      </div>
    </div>
  );
};

export default PageHeaderBack;
