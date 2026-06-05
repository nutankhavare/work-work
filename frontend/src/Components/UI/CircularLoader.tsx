interface LoaderProps {
  label?: string;
}

export const CirclularLoader: React.FC<LoaderProps> = ({ label = "Loading..." }) => {
  return (
    <>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-800"></div>
        <span className="ml-4 text-gray-600">{label}</span>
      </div>
    </>
  );
};
