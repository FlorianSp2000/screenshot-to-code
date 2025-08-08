import React, { useState } from "react";
import InteractiveFileUpload, { CategorizedFile } from "../InteractiveFileUpload";
import FilePreview from "../FilePreview";
import ProcessButton from "../ProcessButton";
import { SerializedFile, Settings } from "../../types";
// import { UrlInputSection } from "../UrlInputSection";
// import ImportCodeSection from "../ImportCodeSection";

interface Props {
  doCreate: (images: string[], inputMode: "image" | "video", additionalFiles?: SerializedFile[]) => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  // TODO: Temporarily commented out - focusing on image-to-code functionality
  // importFromCode: (code: string, stack: Stack) => void;
}

const StartPane: React.FC<Props> = ({ doCreate, settings, setSettings }) => {
  const [files, setFiles] = useState<CategorizedFile[]>([]);

  const handleProcessFiles = (filesToProcess: CategorizedFile[]) => {
    // Extract input images for processing
    const inputFiles = filesToProcess.filter(file => file.category === "input");
    
    if (inputFiles.length === 0) {
      return; // Should not happen due to validation, but safety check
    }

    // Process all input images (for now, use first one as main image)
    const images = inputFiles.map(file => file.dataUrl!);
    const inputMode = inputFiles[0].file.type.startsWith("video") ? "video" : "image";
    
    // Pass all additional files (styles and assets) to doCreate
    // Only send serializable data, not the File objects
    const additionalFiles = filesToProcess
      .filter(file => file.category !== "input")
      .map(file => ({
        id: file.id,
        category: file.category,
        dataUrl: file.dataUrl,
        fileName: file.file.name,
        fileSize: file.file.size,
        fileType: file.file.type
      }));
    
    doCreate(images, inputMode, additionalFiles);
  };
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: text-shimmer 3s ease-in-out infinite alternate;
        }
        
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes pulse-glow {
          0% {
            box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
            border-color: rgba(102, 126, 234, 0.3);
          }
          100% {
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.6), 0 0 30px rgba(102, 126, 234, 0.4);
            border-color: rgba(102, 126, 234, 0.8);
          }
        }
        
        .drag-expand {
          transform: scale(1.02);
          transition: transform 0.3s ease-in-out;
        }
      `}</style>
      
      {/* Header Section */}
      <div className="text-center mb-8 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text tracking-tight">
          Transform Your Screenshots into Code
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed font-medium max-w-2xl mx-auto">
          Upload screenshots, mockups, or videos and convert them into clean, production-ready code using advanced AI technology.
        </p>
      </div>

      {/* Upload Section */}
      <div className="w-full max-w-4xl">
        <InteractiveFileUpload 
          files={files} 
          onFilesChange={setFiles}
          selectedStack={settings.generatedCodeConfig}
          onStackChange={(stack) => setSettings(prev => ({ ...prev, generatedCodeConfig: stack }))}
        />
      </div>

      {/* File Preview Section */}
      <FilePreview files={files} onFilesChange={setFiles} />

      {/* Process Button Section */}
      <ProcessButton files={files} onProcess={handleProcessFiles} />

      {/* Features Section - Only show when no files uploaded to save space */}
      {files.length === 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-lg">🖼️</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">Upload Screenshots</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Drag and drop any screenshot or design mockup to get started
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-lg">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">AI Processing</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Advanced AI analyzes your image and generates clean, semantic code
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 text-lg">💻</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">Ready to Use</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Get production-ready HTML, CSS, and JavaScript code instantly
            </p>
          </div>
        </div>
      )}

      {/* Powered By Section */}
      <div className="mt-16 mb-8">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4 font-medium">Powered by</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70 hover:opacity-100 transition-opacity duration-300">
            {/* React */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-sm font-medium text-gray-700">React</span>
            </div>
            
            {/* TypeScript */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <span className="text-sm font-medium text-gray-700">TypeScript</span>
            </div>
            
            {/* Python/FastAPI */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">🐍</span>
              </div>
              <span className="text-sm font-medium text-gray-700">FastAPI</span>
            </div>
            
            {/* Anthropic */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">🤖</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Anthropic</span>
            </div>
            
            {/* Tailwind */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TW</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Tailwind</span>
            </div>
            
            {/* OpenAI (alternative) */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-sm font-medium text-gray-700">OpenAI</span>
            </div>
          </div>
        </div>
      </div>

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
