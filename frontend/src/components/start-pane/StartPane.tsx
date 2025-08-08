import React, { useState } from "react";
import InteractiveFileUpload, { CategorizedFile } from "../InteractiveFileUpload";
import FilePreview from "../FilePreview";
import ProcessButton from "../ProcessButton";
// import { UrlInputSection } from "../UrlInputSection";
// import ImportCodeSection from "../ImportCodeSection";
// import { Settings } from "../../types";
// import { Stack } from "../../lib/stacks";

interface Props {
  doCreate: (images: string[], inputMode: "image" | "video") => void;
  // TODO: Temporarily commented out - focusing on image-to-code functionality
  // importFromCode: (code: string, stack: Stack) => void;
  // settings: Settings;
}

const StartPane: React.FC<Props> = ({ doCreate }) => {
  const [files, setFiles] = useState<CategorizedFile[]>([]);

  const handleProcessFiles = (filesToProcess: CategorizedFile[]) => {
    // Extract input images for processing
    const inputFiles = filesToProcess.filter(file => file.category === "input");
    
    if (inputFiles.length === 0) {
      return; // Should not happen due to validation, but safety check
    }

    // For now, we'll process the first input image (to maintain compatibility)
    // TODO: In the future, handle multiple inputs, styles, and assets
    const firstInput = inputFiles[0];
    const images = [firstInput.dataUrl!];
    const inputMode = firstInput.file.type.startsWith("video") ? "video" : "image";
    
    doCreate(images, inputMode);
  };
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      {/* Header Section */}
      <div className="text-center mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Transform Your Screenshots into Code
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Upload screenshots, mockups, or videos and convert them into clean, production-ready code.
        </p>
      </div>

      {/* Upload Section */}
      <div className="w-full max-w-4xl">
        <InteractiveFileUpload files={files} onFilesChange={setFiles} />
      </div>

      {/* File Preview Section */}
      <FilePreview files={files} onFilesChange={setFiles} />

      {/* Process Button Section */}
      <ProcessButton files={files} onProcess={handleProcessFiles} />

      {/* Features Section - Only show when no files uploaded to save space */}
      {files.length === 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-lg">🖼️</span>
            </div>
            <h3 className="font-medium text-gray-800 mb-1 text-sm">Upload Screenshots</h3>
            <p className="text-xs text-gray-600">
              Drag and drop any screenshot or design mockup to get started
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-lg">⚡</span>
            </div>
            <h3 className="font-medium text-gray-800 mb-1 text-sm">AI Processing</h3>
            <p className="text-xs text-gray-600">
              Advanced AI analyzes your image and generates clean, semantic code
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 text-lg">💻</span>
            </div>
            <h3 className="font-medium text-gray-800 mb-1 text-sm">Ready to Use</h3>
            <p className="text-xs text-gray-600">
              Get production-ready HTML, CSS, and JavaScript code instantly
            </p>
          </div>
        </div>
      )}

      {/* TODO: Temporarily commented out - focusing on image-to-code functionality */}
      {/* <UrlInputSection
        doCreate={doCreate}
        screenshotOneApiKey={settings.screenshotOneApiKey}
      />
      <ImportCodeSection importFromCode={importFromCode} /> */}
    </div>
  );
};

export default StartPane;
