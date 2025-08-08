// import React from "react";
import { FaRocket, FaExclamationTriangle } from "react-icons/fa";
import { CategorizedFile } from "./InteractiveFileUpload";

interface Props {
  files: CategorizedFile[];
  onProcess: (files: CategorizedFile[]) => void;
}

function ProcessButton({ files, onProcess }: Props) {
  const hasInputImages = files.some(file => file.category === "input");
  const canProcess = files.length > 0 && hasInputImages;
  
  const handleProcess = () => {
    if (canProcess) {
      onProcess(files);
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="text-center">
          {/* Status indicator */}
          <div className="mb-3">
            {canProcess ? (
              <div className="flex items-center justify-center text-green-600">
                <FaRocket className="mr-2" size={16} />
                <span className="font-medium text-sm">Ready to Process</span>
              </div>
            ) : (
              <div className="flex items-center justify-center text-amber-600">
                <FaExclamationTriangle className="mr-2" size={16} />
                <span className="font-medium text-sm">
                  {files.length === 0 
                    ? "Upload files to continue" 
                    : "At least one Input Image required"}
                </span>
              </div>
            )}
          </div>

          {/* File summary */}
          <div className="mb-4 text-sm text-gray-600">
            <div className="flex justify-center space-x-6">
              <div className="text-center">
                <div className="font-medium text-blue-600">
                  {files.filter(f => f.category === "input").length}
                </div>
                <div className="text-xs">Input</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">
                  {files.filter(f => f.category === "style").length}
                </div>
                <div className="text-xs">Styles</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">
                  {files.filter(f => f.category === "asset").length}
                </div>
                <div className="text-xs">Assets</div>
              </div>
            </div>
          </div>

          {/* Process button */}
          <button
            onClick={handleProcess}
            disabled={!canProcess}
            className={`
              px-8 py-3 rounded-lg font-medium text-white transition-all duration-300 relative overflow-hidden
              ${canProcess
                ? "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 hover:shadow-xl transform hover:scale-105 cursor-pointer animate-gradient"
                : "bg-gray-400 cursor-not-allowed opacity-60"
              }
            `}
            style={canProcess ? {
              backgroundSize: '200% 200%',
              animation: 'gradient-animation 3s ease infinite'
            } : {}}
          >
            {canProcess && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
            )}
            <div className="flex items-center justify-center relative z-10">
              <FaRocket className="mr-2" />
              Start Processing
            </div>
          </button>

          {!canProcess && hasInputImages === false && files.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              Select at least one file as "Input Image" to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProcessButton;