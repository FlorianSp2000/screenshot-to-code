import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { FaArrowUp } from "react-icons/fa";
import { CompactFrameworkSelector } from "./settings/CompactFrameworkSelector";
import { Stack } from "../lib/stacks";

// Helper function to convert file to data URL
function fileToDataURL(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // For CSS/SCSS files, read as text and manually create data URL
    if (file.name.endsWith('.css') || file.name.endsWith('.scss') || file.name.endsWith('.sass') || file.type.includes('css')) {
      reader.onload = () => {
        const text = reader.result as string;
        console.log(`[CSS DEBUG] Original text length: ${text.length}`);
        console.log(`[CSS DEBUG] Original text preview: ${text.substring(0, 200)}`);
        
        // Create proper data URL for CSS content
        const dataUrl = `data:text/css;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(text)))}`;
        console.log(`[CSS DEBUG] Created data URL length: ${dataUrl.length}`);
        console.log(`[CSS DEBUG] Data URL prefix: ${dataUrl.substring(0, 100)}`);
        
        resolve(dataUrl);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    } else {
      // For other files (images, etc.), use the standard approach
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    }
  });
}

export type FileCategory = "input" | "style" | "asset";

export type CategorizedFile = {
  id: string;
  file: File;
  preview: string;
  category: FileCategory;
  dataUrl?: string;
};

interface Props {
  files: CategorizedFile[];
  onFilesChange: (files: CategorizedFile[]) => void;
  selectedStack: Stack;
  onStackChange: (stack: Stack) => void;
}

function InteractiveFileUpload({ files, onFilesChange, selectedStack, onStackChange }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 10, // Allow multiple files now
    maxSize: 1024 * 1024 * 20, // 20 MB
    accept: {
      // Image formats
      "image/png": [".png"],
      "image/jpeg": [".jpeg"],
      "image/jpg": [".jpg"],
      "image/webp": [".webp"],
      // Video formats
      "video/quicktime": [".mov"],
      "video/mp4": [".mp4"],
      "video/webm": [".webm"],
      // Style files
      "text/css": [".css"],
      "text/scss": [".scss"],
      "text/sass": [".sass"],
    },
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDrop: async (acceptedFiles) => {
      setIsDragOver(false);
      
      try {
        // Process each file and add to the list
        const newCategorizedFiles = await Promise.all(
          acceptedFiles.map(async (file: File) => {
            const preview = URL.createObjectURL(file);
            const dataUrl = await fileToDataURL(file) as string;
            
            // Auto-categorize based on file type
            let category: FileCategory = "input"; // default
            if (file.type.includes("css") || file.name.endsWith(".scss") || file.name.endsWith(".sass")) {
              category = "style";
            } else if (file.type.startsWith("image")) {
              category = "input"; // Will be changed by user if needed
            }
            
            return {
              id: Math.random().toString(36).substring(7),
              file,
              preview,
              category,
              dataUrl,
            } as CategorizedFile;
          })
        );
        
        // Add new files to existing ones
        onFilesChange([...files, ...newCategorizedFiles]);
      } catch (error) {
        toast.error("Error reading files: " + error);
        console.error("Error reading files:", error);
      }
    },
    onDropRejected: (rejectedFiles) => {
      setIsDragOver(false);
      toast.error(rejectedFiles[0].errors[0].message);
    },
  });

  useEffect(() => {
    return () => {
      // Cleanup object URLs when files change
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        {...getRootProps({ 
          className: `
            relative p-16 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200/50 drag-expand' 
              : isHovering 
                ? 'border-blue-400 bg-gray-100 pulse-glow'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }
          `
        })}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <input {...getInputProps()} />
        
        {/* Framework Selector - positioned in top-right corner */}
        <CompactFrameworkSelector 
          selectedStack={selectedStack}
          onStackChange={onStackChange}
          disabled={isDragOver} // Disable during drag to prevent interference
        />
        
        {/* Background striped pattern - only visible on drag over */}
        {isDragOver && (
          <div 
            className="absolute inset-4 rounded-xl bg-blue-100 opacity-60"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(59, 130, 246, 0.1) 10px,
                rgba(59, 130, 246, 0.1) 20px
              )`
            }}
          />
        )}
        
        {/* Main floating upload box */}
        <div 
          className={`
            relative bg-white rounded-xl p-8 shadow-lg transition-all duration-300
            ${isDragOver 
              ? 'transform translate-x-2 -translate-y-2 shadow-xl border-2 border-dashed border-blue-400' 
              : 'shadow-md'
            }
          `}
        >
          {/* Upload icon */}
          <div className="flex justify-center mb-6">
            <div 
              className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                ${isDragOver 
                  ? 'bg-blue-500 text-white scale-110 shadow-lg' 
                  : isHovering 
                    ? 'bg-blue-100 text-blue-600 scale-105' 
                    : 'bg-gray-100 text-gray-500'
                }
              `}
            >
              <FaArrowUp 
                size={24} 
                className={isHovering && !isDragOver ? 'animate-bounce' : ''}
              />
            </div>
          </div>
          
          {/* Title text */}
          <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
            {isDragOver ? "Drop it like it's hot!" : "Upload Files"}
          </h3>
          
          {/* Instructional text */}
          <p className={`text-center mb-4 transition-colors duration-300 ${
            isDragOver ? 'text-blue-600 font-medium' : 'text-gray-500'
          }`}>
            {isDragOver 
              ? "Release to upload your files!"
              : files.length === 0 
                ? "Drag or drop your files here, or click to browse"
                : `${files.length} file${files.length === 1 ? '' : 's'} uploaded. Add more or categorize below.`
            }
          </p>
          
          {/* Supported formats */}
          <p className="text-sm text-gray-400 text-center">
            Supported formats: PNG, JPG, WebP, MP4, MOV, WebM, CSS, SCSS
          </p>
        </div>
      </div>
    </div>
  );
}

export default InteractiveFileUpload;