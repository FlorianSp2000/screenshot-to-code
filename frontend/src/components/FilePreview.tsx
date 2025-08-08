// import React from "react";
import { FaFile, FaImage, FaCss3Alt, FaTrash } from "react-icons/fa";
import { CategorizedFile, FileCategory } from "./InteractiveFileUpload";

interface Props {
  files: CategorizedFile[];
  onFilesChange: (files: CategorizedFile[]) => void;
}

const categoryOptions = [
  { value: "input" as FileCategory, label: "Input Image", description: "Part of the webpage to reconstruct" },
  { value: "style" as FileCategory, label: "Style Reference", description: "CSS/SCSS custom styling reference" },
  { value: "asset" as FileCategory, label: "Background Asset", description: "Asset/artifact for background images" },
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) {
    return <FaImage className="text-blue-500" size={20} />;
  } else if (file.type.includes('css') || file.name.endsWith('.scss') || file.name.endsWith('.sass')) {
    return <FaCss3Alt className="text-green-500" size={20} />;
  } else {
    return <FaFile className="text-gray-500" size={20} />;
  }
};

function FilePreview({ files, onFilesChange }: Props) {
  const updateFileCategory = (fileId: string, category: FileCategory) => {
    const updatedFiles = files.map(file => 
      file.id === fileId ? { ...file, category } : file
    );
    onFilesChange(updatedFiles);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    onFilesChange(updatedFiles);
  };

  if (files.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        Uploaded Files ({files.length})
      </h3>
      
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="bg-white rounded-md border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Left section: File info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* File icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file.file)}
                </div>
                
                {/* File details */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.file.size)}
                  </div>
                </div>
              </div>

              {/* Right section: Category selection and remove button */}
              <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                {/* Category dropdown */}
                <div className="flex flex-col items-end">
                  <select
                    value={file.category}
                    onChange={(e) => updateFileCategory(file.id, e.target.value as FileCategory)}
                    className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-36"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                  title="Remove file"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FilePreview;