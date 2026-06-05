interface LoaderProps {
    label?:string;
    size?:number;
}

export const Loader : React.FC<LoaderProps> = ({label="Loading...", size = 48}) =>{
    return (
        <>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full border-b-4 border-purple-800" style={{ width: size, height: size }}></div>
          <span className="ml-4 text-gray-600">{label}</span>
        </div>
        </>
    );
}