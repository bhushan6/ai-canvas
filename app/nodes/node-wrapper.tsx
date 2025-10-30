import React from "react";

interface NodeWrapperProps {
  title: string;
  children: React.ReactNode;
}

const NodeWrapper: React.FC<NodeWrapperProps> = ({ title, children }) => {
  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg shadow-xl w-64">
      <div className="bg-gray-700 p-2 rounded-t-md">
        <h3 className="text-center font-bold text-indigo-300">{title}</h3>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
};

export default NodeWrapper;
