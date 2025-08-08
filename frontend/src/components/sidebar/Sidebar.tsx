import { useAppStore } from "../../store/app-store";
import SelectAndEditModeToggleButton from "../select-and-edit/SelectAndEditModeToggleButton";
import { useEffect, useRef, useState, useCallback } from "react";
import UpdateImageUpload, { UpdateImagePreview } from "../UpdateImageUpload";
import { FaArrowUp } from "react-icons/fa";
import ConversationView from "../conversation/ConversationView";
import { useConversationStore } from "../../store/conversation-store";

interface SidebarProps {
  showSelectAndEditFeature: boolean;
  doUpdate: (instruction: string) => void;
  regenerate: () => void;
  cancelCodeGeneration: () => void;
}


function Sidebar({
  showSelectAndEditFeature,
  doUpdate,
}: SidebarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { updateInstruction, setUpdateInstruction, updateImages, setUpdateImages } = useAppStore();
  const { messages } = useConversationStore();

  // Auto-resize textarea function
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(48, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  // Adjust height when text changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [updateInstruction, adjustTextareaHeight]);

  // Helper function to convert file to data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'image/png' || file.type === 'image/jpeg'
    );
    
    if (files.length > 0) {
      try {
        const newImagePromises = files.map(file => fileToDataURL(file));
        const newImages = await Promise.all(newImagePromises);
        setUpdateImages([...updateImages, ...newImages]);
      } catch (error) {
        console.error('Error reading files:', error);
      }
    }
  }, [updateImages, setUpdateImages]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (historyScrollRef.current) {
      const scrollElement = historyScrollRef.current;
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }, 10);
    }
  }, [messages.length]); // Scroll when new messages are added

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100/50">
      {/* Custom Styles */}
      <style>{`
        .glassmorphism {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .glassmorphism-dark {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .thread-item {
          transition: all 0.2s ease;
        }
        
        .thread-item:hover {
          transform: translateY(-1px);
        }
        
        @keyframes thread-expand {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .thread-responses {
          animation: thread-expand 0.3s ease-out;
        }
      `}</style>

      {/* Conversation History - Clean & Simple */}
      <div 
        ref={historyScrollRef}
        className="flex-1 overflow-y-auto px-6 py-6"
      >
        <ConversationView />
      </div>

      {/* Bottom Input Area */}
      <div className="flex-none p-6 border-t border-white/30">
        <div 
          className="relative"
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDragging(false);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Image Preview */}
          <UpdateImagePreview 
            updateImages={updateImages} 
            setUpdateImages={setUpdateImages} 
          />
          
          {/* Input Field */}
          <div className="glassmorphism rounded-2xl p-4 relative hover:shadow-lg focus-within:shadow-xl transition-all duration-200">
            <textarea
              ref={textareaRef}
              placeholder="Describe how you'd like to modify the design..."
              onChange={(e) => {
                setUpdateInstruction(e.target.value);
                // Trigger resize on next frame to ensure proper height calculation
                setTimeout(adjustTextareaHeight, 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (updateInstruction.trim()) {
                    doUpdate(updateInstruction);
                  }
                }
              }}
              onInput={adjustTextareaHeight}
              value={updateInstruction}
              className="w-full bg-transparent border-0 resize-none text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-0 text-sm leading-relaxed overflow-hidden"
              style={{ 
                minHeight: '48px',
                maxHeight: '200px' // Prevent it from getting too large
              }}
              rows={1}
            />
            
            {/* Input Controls */}
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center">
                <UpdateImageUpload 
                  updateImages={updateImages} 
                  setUpdateImages={setUpdateImages} 
                />
              </div>
              <div 
                className={`p-3 rounded-full transition-all duration-200 ${
                  updateInstruction.trim() 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105" 
                    : "cursor-not-allowed bg-slate-300"
                }`}
                onClick={() => {
                  if (updateInstruction.trim()) {
                    doUpdate(updateInstruction);
                  }
                }}
              >
                <FaArrowUp className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 glassmorphism border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none z-10">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-blue-700 font-medium">Drop images here</p>
              </div>
            </div>
          )}
        </div>

        {/* Select and Edit Toggle */}
        {showSelectAndEditFeature && (
          <div className="flex justify-center mt-4">
            <SelectAndEditModeToggleButton />
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;