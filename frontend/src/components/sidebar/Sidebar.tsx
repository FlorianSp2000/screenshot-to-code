import { useAppStore } from "../../store/app-store";
import { useProjectStore } from "../../store/project-store";
import { AppState } from "../../types";
// import CodePreview from "../preview/CodePreview";
// import TipLink from "../messages/TipLink";
import SelectAndEditModeToggleButton from "../select-and-edit/SelectAndEditModeToggleButton";
// import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState, useCallback } from "react";
// import HistoryDisplay from "../history/HistoryDisplay";
// import Variants from "../variants/Variants";
import UpdateImageUpload, { UpdateImagePreview } from "../UpdateImageUpload";
import { FaArrowUp, FaUser, FaRobot, FaCode } from "react-icons/fa";

interface SidebarProps {
  showSelectAndEditFeature: boolean;
  doUpdate: (instruction: string) => void;
  regenerate: () => void;
  cancelCodeGeneration: () => void;
}

function Sidebar({
  showSelectAndEditFeature,
  doUpdate,
  // regenerate,
  // cancelCodeGeneration,
}: SidebarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { appState, updateInstruction, setUpdateInstruction, updateImages, setUpdateImages } = useAppStore();

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
// referenceImages, 
  const { inputMode, head, commits, setHead, updateSelectedVariantIndex, referenceImages } = useProjectStore();

  // const viewedCode =
  //   head && commits[head]
  //     ? commits[head].variants[commits[head].selectedVariantIndex].code
  //     : "";

  // Check if the currently selected variant is complete
  const isSelectedVariantComplete =
    head &&
    commits[head] &&
    commits[head].variants[commits[head].selectedVariantIndex].status ===
      "complete";

  // Check if the currently selected variant has an error
  const isSelectedVariantError =
    head &&
    commits[head] &&
    commits[head].variants[commits[head].selectedVariantIndex].status ===
      "error";

  // Get the error message from the selected variant
  const selectedVariantErrorMessage =
    head &&
    commits[head] &&
    commits[head].variants[commits[head].selectedVariantIndex].errorMessage;

  // Focus on the update instruction textarea when a variant is complete
  useEffect(() => {
    if (
      (appState === AppState.CODE_READY || isSelectedVariantComplete) &&
      textareaRef.current
    ) {
      textareaRef.current.focus();
    }
  }, [appState, isSelectedVariantComplete]);

  // Reset error expanded state when variant changes
  useEffect(() => {
    setIsErrorExpanded(false);
  }, [head, commits[head || ""]?.selectedVariantIndex]);

  // Create conversational history from commits
  const createConversationalHistory = () => {
    const history: Array<{
      type: 'user' | 'system';
      content: string;
      timestamp?: Date;
      commitId?: string;
      variantIndex?: number;
      isActive?: boolean;
      hasArtifact?: boolean;
      images?: string[];
    }> = [];

    let versionCounter = 0;

    // Walk through commits in chronological order (oldest first)
    const sortedCommits = Object.entries(commits).sort((a, b) => {
      // Sort by commit hash/ID to maintain chronological order
      return a[0].localeCompare(b[0]);
    });

    sortedCommits.forEach(([commitId, commit]) => {
      // Add user message based on commit type
      if (commit.type === 'ai_create') {
        history.push({
          type: 'user',
          content: 'Create this UI from the provided image',
          timestamp: new Date(),
          images: referenceImages, // Add reference images for initial create
        });
      } else if (commit.type === 'ai_edit' && commit.inputs) {
        // For edit commits, show the actual user input
        const inputs = commit.inputs as any;
        const userText = typeof inputs === 'string' ? inputs : 
                        inputs?.text || 'Modify the design';
        const userImages = typeof inputs === 'object' && inputs?.images ? inputs.images : [];
        history.push({
          type: 'user',
          content: userText,
          timestamp: new Date(),
          images: userImages, // Add any images from the edit inputs
        });
      }

      // Add system responses (only for completed variants)
      if (commit.variants && commit.variants.length > 0) {
        commit.variants.forEach((variant, index) => {
          if (variant.code || variant.status === 'complete') {
            versionCounter++;
            history.push({
              type: 'system',
              content: `Version ${versionCounter}`,
              timestamp: new Date(),
              commitId,
              variantIndex: index,
              isActive: head === commitId && commit.selectedVariantIndex === index,
              hasArtifact: true,
            });
          }
        });
      }
    });

    return history;
  };

  const conversationHistory = createConversationalHistory();

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [conversationHistory.length, appState]);

  return (
    <div className="flex flex-col h-full">
      {/* Conversation History - Scrollable */}
      <div 
        ref={historyScrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {conversationHistory.map((message, index) => (
          <div key={index} className="flex items-start space-x-3">
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
              message.type === 'user' ? 'bg-blue-500' : 'bg-gray-600'
            }`}>
              {message.type === 'user' ? <FaUser size={12} /> : <FaRobot size={12} />}
            </div>
            
            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {message.type === 'user' ? (
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <div className="text-sm text-gray-900">{message.content}</div>
                  {/* Show images below user message if they exist */}
                  {message.images && message.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.images.map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={image}
                          alt={`Reference ${imgIndex + 1}`}
                          className="max-w-32 max-h-24 object-cover rounded border border-gray-200 shadow-sm"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : message.type === 'system' && message.commitId && message.hasArtifact ? (
                <div 
                  className={`inline-block px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    message.isActive 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    if (message.commitId && message.variantIndex !== undefined) {
                      // Switch to the selected commit and variant
                      setHead(message.commitId);
                      updateSelectedVariantIndex(message.commitId, message.variantIndex);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaCode size={12} />
                    {message.content}
                  </div>
                  {message.isActive && (
                    <div className="text-xs text-blue-600 mt-1">Current Version</div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <div className="text-sm text-gray-900">{message.content}</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Show current generation status */}
        {appState === AppState.CODING && !isSelectedVariantComplete && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
              <FaRobot size={12} />
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="text-sm text-gray-700">Generating...</div>
                </div>
                {inputMode === "video" && (
                  <div className="text-xs text-gray-500 mt-2">
                    Video processing can take 3-4 minutes
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show error state */}
        {isSelectedVariantError && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm">
              <FaRobot size={12} />
            </div>
            <div className="flex-1">
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="text-sm text-red-800 font-medium mb-1">
                  Generation failed
                </div>
                {selectedVariantErrorMessage && (
                  <div className="text-xs text-red-700 bg-red-100 border border-red-300 rounded px-2 py-1 font-mono break-words">
                    {selectedVariantErrorMessage.length > 100 && !isErrorExpanded
                      ? `${selectedVariantErrorMessage.slice(0, 100)}...`
                      : selectedVariantErrorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="flex-none p-4 border-t border-gray-200 dark:border-gray-700">
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
          <div className="bg-white dark:bg-gray-950 rounded-lg p-3 relative border border-gray-400 dark:border-gray-600">
            <Textarea
              ref={textareaRef}
              placeholder="paste image or describe your ui here..."
              onChange={(e) => setUpdateInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (updateInstruction.trim()) {
                    doUpdate(updateInstruction);
                  }
                }
              }}
              value={updateInstruction}
              className="flex w-full rounded-md border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] resize-none overflow-hidden"
              style={{ height: 'auto', minHeight: '40px' }}
            />
            
            {/* Input Controls - Separated below textarea */}
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <p></p>
              </div>
              <div className="flex space-x-2 items-center">
                <UpdateImageUpload 
                  updateImages={updateImages} 
                  setUpdateImages={setUpdateImages} 
                />
                <div 
                  className={`p-2 rounded-full transition-colors ${
                    updateInstruction.trim() 
                      ? "bg-black hover:bg-gray-800 cursor-pointer" 
                      : "cursor-not-allowed bg-black/40"
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
          </div>

          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none z-10">
              <p className="text-blue-600 font-medium">Drop images here</p>
            </div>
          )}
        </div>

        {/* Select and Edit Toggle */}
        {showSelectAndEditFeature && (
          <div className="flex justify-center mt-3">
            <SelectAndEditModeToggleButton />
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
