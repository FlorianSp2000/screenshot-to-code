import { useEffect, useRef, useState } from "react";
import { generateCode } from "./generateCode";
import SettingsDialog from "./components/settings/SettingsDialog";
import { AppState, CodeGenerationParams, EditorTheme, Settings, SerializedFile } from "./types";
import { IS_RUNNING_ON_CLOUD } from "./config";
import { PicoBadge } from "./components/messages/PicoBadge";
import { OnboardingNote } from "./components/messages/OnboardingNote";
import { usePersistedState } from "./hooks/usePersistedState";
import TermsOfServiceDialog from "./components/TermsOfServiceDialog";
import { USER_CLOSE_WEB_SOCKET_CODE } from "./constants";
import { extractHistory } from "./components/history/utils";
import toast from "react-hot-toast";
import { Stack } from "./lib/stacks";
import { CodeGenerationModel } from "./lib/models";
import useBrowserTabIndicator from "./hooks/useBrowserTabIndicator";
// import TipLink from "./components/messages/TipLink";
import { useAppStore, StatusUpdate, ThinkingStep } from "./store/app-store";
import { extractUIStructure, UIExtractionResult } from "./services/extractionService";
import { useProjectStore } from "./store/project-store";
import Sidebar from "./components/sidebar/Sidebar";
import PreviewPane from "./components/preview/PreviewPane";
import DeprecationMessage from "./components/messages/DeprecationMessage";
// import { GenerationSettings } from "./components/settings/GenerationSettings";
import StartPane from "./components/start-pane/StartPane";
import { Commit } from "./components/commits/types";
import { createCommit } from "./components/commits/utils";
import { FaHome, FaEdit } from "react-icons/fa";
import { TypingQueueProvider } from "./context/TypingQueueContext";
import { conversationService } from "./services/conversationService";
// import GenerateFromText from "./components/generate-from-text/GenerateFromText";

function App() {
  const [activeTab, setActiveTab] = useState("desktop");
  const [conversationName, setConversationName] = useState("Jivs");
  const [isEditingName, setIsEditingName] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(442); // 384px + 15% = ~442px
  const [isResizing, setIsResizing] = useState(false);

  // Handle sidebar resizing
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault();
      // Only resize when actually dragging and mouse button is still pressed
      if (e.buttons === 1) { // Left mouse button is pressed
        const newWidth = Math.max(300, Math.min(600, e.clientX)); // Min 300px, Max 600px
        setSidebarWidth(newWidth);
      } else {
        // If mouse button is released, stop resizing
        setIsResizing(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleTabChange = (tab: string) => {
    console.log("App: Tab changed to:", tab);
    console.log("App: Current activeTab before change:", activeTab);
    setActiveTab(tab);
    console.log("App: activeTab set to:", tab);
  };

  // Debug activeTab changes
  useEffect(() => {
    console.log("App: activeTab state changed to:", activeTab);
    console.log("App: Sidebar should be hidden:", activeTab === "split");
  }, [activeTab]);
  
  const {
    // Inputs
    inputMode,
    setInputMode,
    isImportedFromCode,
    setIsImportedFromCode,
    referenceImages,
    setReferenceImages,
    initialPrompt,
    // setInitialPrompt,

    head,
    commits,
    addCommit,
    removeCommit,
    setHead,
    appendCommitCode,
    setCommitCode,
    resetCommits,
    resetHead,
    updateVariantStatus,
    resizeVariants,

    // Outputs
    appendExecutionConsole,
    resetExecutionConsoles,
  } = useProjectStore();

  const {
    disableInSelectAndEditMode,
    setUpdateInstruction,
    updateImages,
    setUpdateImages,
    appState,
    setAppState,
    setCurrentStatus,
    addToStatusHistory,
    addThinkingStep,
    clearStatusHistory,
    setExtractionResult,
    extractionResults,
    setStreamingExtraction,
  } = useAppStore();

  // Helper to create and set status updates + add to conversation
  const updateStatus = (message: string, type: StatusUpdate['type'], isComplete = false, commitId?: string) => {
    console.log("🔔 STATUS UPDATE:", { message, type, isComplete, commitId });
    
    const status: StatusUpdate = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      isComplete,
      type,
      commitId,
    };
    
    console.log("📤 Adding status to history:", status);
    // Always add to history (both complete and in-progress)
    addToStatusHistory(status);
    
    // Add to conversation system
    conversationService.addStatusMessage(message, type as 'extracting' | 'analyzing' | 'generating' | 'complete' | 'error');
    
    // Only keep current status if not complete
    if (!isComplete) {
      console.log("📌 Setting as current status (not complete)");
      setCurrentStatus(status);
    } else {
      console.log("✅ Clearing current status (complete)");
      setCurrentStatus(null);
    }
  };

  // Settings
  const [settings, setSettings] = usePersistedState<Settings>(
    {
      openAiApiKey: null,
      openAiBaseURL: null,
      anthropicApiKey: null,
      screenshotOneApiKey: null,
      isImageGenerationEnabled: true,
      editorTheme: EditorTheme.COBALT,
      generatedCodeConfig: Stack.HTML_TAILWIND,
      codeGenerationModel: CodeGenerationModel.CLAUDE_3_5_SONNET_2024_06_20,
      // Only relevant for hosted version
      isTermOfServiceAccepted: false,
    },
    "setting"
  );

  const wsRef = useRef<WebSocket>(null);

  // Code generation model from local storage or the default value
  const model =
    settings.codeGenerationModel || CodeGenerationModel.GPT_4_VISION;

  const showBetterModelMessage =
    model !== CodeGenerationModel.GPT_4O_2024_05_13 &&
    model !== CodeGenerationModel.CLAUDE_3_5_SONNET_2024_06_20 &&
    appState === AppState.INITIAL;

  const showSelectAndEditFeature =
    (model === CodeGenerationModel.GPT_4O_2024_05_13 ||
      model === CodeGenerationModel.CLAUDE_3_5_SONNET_2024_06_20) &&
    (settings.generatedCodeConfig === Stack.HTML_TAILWIND ||
      settings.generatedCodeConfig === Stack.HTML_CSS);

  // Indicate coding state using the browser tab's favicon and title
  useBrowserTabIndicator(appState === AppState.CODING);

  // When the user already has the settings in local storage, newly added keys
  // do not get added to the settings so if it's falsy, we populate it with the default
  // value
  useEffect(() => {
    if (!settings.generatedCodeConfig) {
      setSettings((prev) => ({
        ...prev,
        generatedCodeConfig: Stack.HTML_TAILWIND,
      }));
    }
  }, [settings.generatedCodeConfig, setSettings]);

  // Functions
  const reset = () => {
    setAppState(AppState.INITIAL);
    setUpdateInstruction("");
    setUpdateImages([]);
    disableInSelectAndEditMode();
    resetExecutionConsoles();
    clearStatusHistory(); // Clear status history on reset

    resetCommits();
    resetHead();

    // Inputs
    setInputMode("image");
    setReferenceImages([]);
    setIsImportedFromCode(false);
    
    // Clear conversation
    conversationService.clearConversation();
  };

  const regenerate = () => {
    if (head === null) {
      toast.error(
        "No current version set. Please contact support via chat or Github."
      );
      throw new Error("Regenerate called with no head");
    }

    // Retrieve the previous command
    const currentCommit = commits[head];
    if (currentCommit.type !== "ai_create") {
      toast.error("Only the first version can be regenerated.");
      return;
    }

    // Re-run the create
    if (inputMode === "image" || inputMode === "video") {
      doCreate(referenceImages, inputMode);
    } else {
      // TODO: Text mode temporarily disabled - focusing on image-to-code functionality
      // doCreateFromText(initialPrompt);
      console.warn("Text mode regeneration is temporarily disabled");
    }
  };

  // Used when the user cancels the code generation
  const cancelCodeGeneration = () => {
    wsRef.current?.close?.(USER_CLOSE_WEB_SOCKET_CODE);
  };

  // Used for code generation failure as well
  const cancelCodeGenerationAndReset = (commit: Commit) => {
    // When the current commit is the first version, reset the entire app state
    if (commit.type === "ai_create") {
      reset();
    } else {
      // Otherwise, remove current commit from commits
      removeCommit(commit.hash);

      // Revert to parent commit
      const parentCommitHash = commit.parentHash;
      if (parentCommitHash) {
        setHead(parentCommitHash);
      } else {
        throw new Error("Parent commit not found");
      }

      setAppState(AppState.CODE_READY);
    }
  };

  // UI Structure extraction before code generation
  async function doUIExtraction(
    imageData: string, 
    additionalFiles: SerializedFile[] = [],
    commitId: string,
    extractionSettings: unknown
  ): Promise<UIExtractionResult> {
    console.log("🔬 doUIExtraction called with:", { commitId, hasImage: !!imageData });
    return new Promise((resolve, reject) => {
      // Show immediate extraction status
      console.log("🚀 About to call updateStatus for 'Starting UI analysis...'");
      updateStatus("Starting UI analysis...", "extracting", false, commitId);
      
      // IMMEDIATELY create a placeholder JSON result to trigger the JSON tag creation
      // This ensures messages become visible right away (similar to how Version tag works)
      const placeholderResult: UIExtractionResult = {
        metadata: { 
          viewport: { width: 1920, height: 1080 },
          platform: "web" as const,
          theme: "auto" as const 
        },
        layout: { 
          type: "flow" as const, 
          components: [] 
        },
        navigation: { 
          primary_nav: [], 
          breadcrumbs: [],
          page_relationships: []
        },
        forms: []
      };
      console.log("🏷️ Creating immediate placeholder JSON tag for commit:", commitId);
      setExtractionResult(commitId, placeholderResult);
      
      extractUIStructure(
        imageData,
        additionalFiles,
        extractionSettings,
        {
          onProgress: (message) => {
            // Show live extraction progress messages
            updateStatus(message, "extracting", false, commitId);
          },
          onJsonStream: (partialJson) => {
            // Stream partial JSON to preview window
            setStreamingExtraction(partialJson);
          },
          onComplete: (result) => {
            // Replace placeholder with actual extraction result
            console.log("🏷️ Replacing placeholder with actual JSON result for commit:", commitId);
            setExtractionResult(commitId, result);
            updateStatus("UI structure extracted successfully", "extracting", true, commitId);
            
            // Add JSON artifact to conversation
            conversationService.addArtifactMessage("JSON Structure", "json", result);
            
            resolve(result);
          },
          onError: (error) => {
            updateStatus(`UI extraction failed: ${error}`, "error", true, commitId);
            setStreamingExtraction(null); // Clear streaming on error
            // Replace placeholder with error indicator
            const errorResult: UIExtractionResult = {
              ...placeholderResult,
              metadata: {
                ...placeholderResult.metadata,
                platform: "web" as const
              },
              layout: {
                ...placeholderResult.layout,
                type: "flow" as const
              }
            };
            setExtractionResult(commitId, errorResult);
            reject(new Error(error));
          }
        }
      );
    });
  }

  async function doGenerateCode(params: CodeGenerationParams) {
    // Reset the execution console
    resetExecutionConsoles();

    // Set the app state to coding during generation
    setAppState(AppState.CODING);

    // Merge settings with params
    const updatedParams = { ...params, ...settings };

    // Create variants dynamically - start with 4 to handle most cases
    // Backend will use however many it needs (typically 3)
    const baseCommitObject = {
      variants: Array(4).fill(null).map(() => ({ code: "" })),
    };

    const commitInputObject =
      params.generationType === "create"
        ? {
            ...baseCommitObject,
            type: "ai_create" as const,
            parentHash: null,
            inputs: {
              ...params.prompt,
              additionalFiles: params.additionalFiles, // Include additional files in create commits
            },
          }
        : {
            ...baseCommitObject,
            type: "ai_edit" as const,
            parentHash: head,
            inputs: params.history
              ? {
                  ...params.history[params.history.length - 1],
                  additionalFiles: params.additionalFiles, // Include additional files in edit commits
                }
              : { text: "", images: [], additionalFiles: params.additionalFiles },
          };

    // Create a new commit and set it as the head
    const commit = createCommit(commitInputObject);
    console.log("🎯 COMMIT CREATION:", { 
      commitHash: commit.hash, 
      type: commit.type,
      hasVariants: commit.variants.length 
    });
    addCommit(commit);
    setHead(commit.hash);
    console.log("📝 Commit added to store and head set");

    try {
      // Step 1: UI Structure Extraction (for create operations with images)
      let extractionResult: UIExtractionResult | undefined = undefined;
      if (params.generationType === "create" && params.prompt.images.length > 0) {
        // For create operations, always extract the UI structure from the primary image
        // (doUIExtraction will handle the initial status update)
        try {
          extractionResult = await doUIExtraction(
            params.prompt.images[0], 
            params.additionalFiles || [], 
            commit.hash,
            settings
          );
        } catch (error) {
          console.warn("UI extraction failed, continuing without structured data:", error);
          updateStatus("Extraction failed - continuing with image analysis", "analyzing", false, commit.hash);
          // Continue with generation even if extraction fails
          extractionResult = undefined;
        }
      } else if (params.generationType === "update" && head) {
        // For update operations, reuse existing extraction results from the original commit
        // Find the original create commit by traversing back through the history
        let currentCommitHash = head;
        let originalCreateCommit = commits[currentCommitHash];
        
        while (originalCreateCommit && originalCreateCommit.type === "ai_edit" && originalCreateCommit.parentHash) {
          currentCommitHash = originalCreateCommit.parentHash;
          originalCreateCommit = commits[currentCommitHash];
        }
        
        // Get extraction result from the original create commit
        if (originalCreateCommit && originalCreateCommit.type === "ai_create") {
          extractionResult = extractionResults.get(currentCommitHash);
        }
      }

      // Step 2: Start code generation with extraction context
      // Note: Status updates will be handled by backend phase updates and token streaming

      // Add extraction result to params for backend - this ensures both original image AND structured data go to backend
      const enhancedParams = {
        ...updatedParams,
        extractionResult, // Pass extraction results to backend (JSON structure)
        // Note: The original image is already in params.prompt.images
      };

      // Debug: Log what we're sending to backend
      console.log("=== SENDING TO CODE GENERATION BACKEND ===");
      console.log("Generation type:", params.generationType);
      console.log("Input mode:", params.inputMode);
      console.log("Extraction result:", extractionResult ? "✅ INCLUDED" : "❌ NONE");
      console.log("Images count:", enhancedParams.prompt?.images?.length || 0);
      console.log("Additional files:", enhancedParams.additionalFiles?.length || 0);
      
      if (extractionResult) {
        console.log("Extraction details:", {
          platform: extractionResult.metadata?.platform,
          layoutType: extractionResult.layout?.type,
          componentsCount: extractionResult.layout?.components?.length || 0,
          formsCount: extractionResult.forms?.length || 0
        });
      }
      console.log("===========================================");
      
      let hasStartedGenerating = false; // Track if we've already set generating status
      let hasBackendPhaseControl = false; // Track if backend is sending phase updates
    
      generateCode(wsRef, enhancedParams, {
      onChange: (token, variantIndex) => {
        appendCommitCode(commit.hash, variantIndex, token);
        // Switch to generating status ONLY once when first token arrives AND backend hasn't taken control
        if (token.trim() && !hasStartedGenerating && !hasBackendPhaseControl) {
          hasStartedGenerating = true;
          const generatingMessage = params.generationType === "create"
            ? "Generating your code..."
            : "Modifying code generation...";
          updateStatus(generatingMessage, "generating", false, commit.hash);
        }
      },
      onSetCode: (code, variantIndex) => {
        setCommitCode(commit.hash, variantIndex, code);
      },
      onStatusUpdate: (line, variantIndex) => appendExecutionConsole(variantIndex, line),
      onVariantComplete: (variantIndex) => {
        console.log(`Variant ${variantIndex} complete event received`);
        updateVariantStatus(commit.hash, variantIndex, "complete");
      },
      onVariantError: (variantIndex, error) => {
        console.error(`Error in variant ${variantIndex}:`, error);
        updateVariantStatus(commit.hash, variantIndex, "error", error);
        updateStatus(`Generation failed: ${error}`, "error", true, commit.hash);
      },
      onVariantCount: (count) => {
        console.log(`Backend is using ${count} variants`);
        resizeVariants(commit.hash, count);
      },
      onThinking: (content, variantIndex) => {
        console.log(`Thinking step from variant ${variantIndex}:`, content);
        const thinkingStep: ThinkingStep = {
          id: Date.now().toString(),
          content,
          timestamp: new Date(),
          commitId: commit.hash,
          type: 'thinking',
        };
        addThinkingStep(thinkingStep);
      },
      onReasoning: (content, variantIndex) => {
        console.log(`Reasoning step from variant ${variantIndex}:`, content);
        const reasoningStep: ThinkingStep = {
          id: Date.now().toString(),
          content,
          timestamp: new Date(),
          commitId: commit.hash,
          type: 'reasoning',
        };
        addThinkingStep(reasoningStep);
      },
      onPhase: (phase, status) => {
        console.log(`Phase update from backend - Phase: ${phase}, Status: ${status}`);
        hasBackendPhaseControl = true; // Mark that backend is sending phase updates
        hasStartedGenerating = true; // Mark that backend has taken control
        
        // Map backend phases to our status types
        let statusType: StatusUpdate['type'] = 'processing';
        if (phase === 'analyzing' || phase === 'analysis') {
          statusType = 'analyzing';
        } else if (phase === 'generating' || phase === 'generation') {
          statusType = 'generating';
        } else if (phase === 'thinking') {
          statusType = 'thinking';
        } else if (phase === 'reasoning') {
          statusType = 'reasoning';
        }
        
        updateStatus(status, statusType, false, commit.hash);
      },
      onCancel: () => {
        cancelCodeGenerationAndReset(commit);
        updateStatus("Generation cancelled", "error", true, commit.hash);
      },
      onComplete: () => {
        setAppState(AppState.CODE_READY);
        const completeMessage = params.generationType === "create"
          ? "Code generation complete!"
          : "Code modification complete!";
        updateStatus(completeMessage, "complete", true, commit.hash);
        
        // Add code artifact to conversation with proper version number
        const currentCommit = head && commits[head] ? commits[head] : null;
        const code = currentCommit?.variants[currentCommit.selectedVariantIndex]?.code || "";
        
        // Count existing code artifacts to determine version number
        const codeArtifactCount = conversationService.getCodeArtifactCount();
        const versionNumber = codeArtifactCount + 1;
        
        const codeArtifactId = conversationService.addArtifactMessage(`Version ${versionNumber}`, "code", { code, commitHash: commit.hash }, true);
        
        // Mark this as the active code artifact
        if (codeArtifactId) {
          conversationService.setActiveCodeArtifact(codeArtifactId);
        }
        
        setCurrentStatus(null); // Clear current status when complete
      },
    });
      
    } catch (error) {
      // Handle extraction or setup errors
      console.error("Error in generation process:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      updateStatus(`Generation failed: ${errorMessage}`, "error", true, commit.hash);
      cancelCodeGenerationAndReset(commit);
    }
  }

  // Initial version creation
  function doCreate(referenceImages: string[], inputMode: "image" | "video", additionalFiles?: SerializedFile[]) {
    // Reset any existing state
    reset();
    
    // Add user message to conversation with all attached files
    const allFiles = [...referenceImages];
    if (additionalFiles) {
      allFiles.push(...additionalFiles.map(file => file.dataUrl!));
    }
    conversationService.addUserMessage("Create this UI from the provided image", allFiles);

    // Set the input states
    setReferenceImages(referenceImages);
    setInputMode(inputMode);

    // Kick off the code generation
    if (referenceImages.length > 0) {
      doGenerateCode({
        generationType: "create",
        inputMode,
        prompt: { text: "", images: [referenceImages[0]] },
        additionalFiles, // Pass additional files to code generation
      });
    }
  }

  // TODO: Temporarily commented out - focusing on image-to-code functionality
  // function doCreateFromText(text: string) {
  //   // Reset any existing state
  //   reset();

  //   setInputMode("text");
  //   setInitialPrompt(text);
  //   doGenerateCode({
  //     generationType: "create",
  //     inputMode: "text",
  //     prompt: { text, images: [] },
  //   });
  // }

  // Subsequent updates
  async function doUpdate(
    updateInstruction: string,
    selectedElement?: HTMLElement
  ) {
    if (updateInstruction.trim() === "") {
      toast.error("Please include some instructions for AI on what to update.");
      return;
    }

    if (head === null) {
      toast.error(
        "No current version set. Contact support or open a Github issue."
      );
      throw new Error("Update called with no head");
    }

    let historyTree;
    try {
      historyTree = extractHistory(head, commits);
    } catch {
      toast.error(
        "Version history is invalid. This shouldn't happen. Please contact support or open a Github issue."
      );
      throw new Error("Invalid version history");
    }

    let modifiedUpdateInstruction = updateInstruction;

    // Send in a reference to the selected element if it exists
    if (selectedElement) {
      modifiedUpdateInstruction =
        updateInstruction +
        " referring to this element specifically: " +
        selectedElement.outerHTML;
    }

    // Add user's follow-up instruction to conversation
    conversationService.addUserMessage(updateInstruction, updateImages.length > 0 ? updateImages : undefined);

    const updatedHistory = [
      ...historyTree,
      { text: modifiedUpdateInstruction, images: updateImages },
    ];

    // For updates with new images, we might want to do extraction too
    // but for now, just pass any existing extraction results
    await doGenerateCode({
      generationType: "update",
      inputMode,
      prompt:
        inputMode === "text"
          ? { text: initialPrompt, images: [] }
          : { text: "", images: [referenceImages[0]] },
      history: updatedHistory,
      isImportedFromCode,
    });

    setUpdateInstruction("");
    setUpdateImages([]);
  }

  const handleTermDialogOpenChange = (open: boolean) => {
    setSettings((s) => ({
      ...s,
      isTermOfServiceAccepted: !open,
    }));
  };

  // function setStack(stack: Stack) {
  //   setSettings((prev) => ({
  //     ...prev,
  //     generatedCodeConfig: stack,
  //   }));
  // }

  // TODO: Temporarily commented out - focusing on image-to-code functionality
  // function importFromCode(code: string, stack: Stack) {
  //   // Reset any existing state
  //   reset();

  //   // Set input state
  //   setIsImportedFromCode(true);

  //   // Set up this project
  //   setStack(stack);

  //   // Create a new commit and set it as the head
  //   const commit = createCommit({
  //     type: "code_create",
  //     parentHash: null,
  //     variants: [{ code }],
  //     inputs: null,
  //   });
  //   addCommit(commit);
  //   setHead(commit.hash);

  //   // Set the app state
  //   setAppState(AppState.CODE_READY);
  // }

  return (
    <TypingQueueProvider>
      <div className="dark:bg-black dark:text-white">
        {IS_RUNNING_ON_CLOUD && <PicoBadge />}
        {IS_RUNNING_ON_CLOUD && (
          <TermsOfServiceDialog
            open={!settings.isTermOfServiceAccepted}
            onOpenChange={handleTermDialogOpenChange}
          />
        )}
      {/* Hide sidebar completely in initial state and split view */}
      {appState !== AppState.INITIAL && (
        <div 
          className={`lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col transition-transform duration-300 ease-in-out ${activeTab === "split" ? "lg:-translate-x-full" : "lg:translate-x-0"}`}
          style={{ width: `${sidebarWidth}px` }}
        >
        <div className="flex grow flex-col gap-y-2 overflow-y-auto bg-white dark:bg-zinc-950 dark:text-white relative">
          {/* Resize handle - larger hit area for easier dragging */}
          <div 
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-200/50 dark:hover:bg-blue-600/30 transition-colors z-50 flex items-center justify-center group"
            onMouseDown={startResizing}
            style={{ 
              background: isResizing ? 'rgba(59, 130, 246, 0.3)' : 'transparent'
            }}
          >
            {/* Visual indicator */}
            <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500 transition-colors rounded-full" />
          </div>
          {/* Conversation Header */}
          <div className="mt-3 mb-6">
            <div className="flex items-center justify-between pb-3 mx-6">
              <div className="flex items-center gap-2 flex-1">
                {isEditingName ? (
                  <input
                    type="text"
                    value={conversationName}
                    onChange={(e) => setConversationName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsEditingName(false);
                      if (e.key === "Escape") {
                        setConversationName("Jivs");
                        setIsEditingName(false);
                      }
                    }}
                    className="text-sm font-medium bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 px-1 py-0.5"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-sm font-medium text-gray-900 dark:text-white">{conversationName}</h1>
                )}
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <FaEdit size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={reset}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center"
                  title="Go to Home"
                >
                  <FaHome />
                </button>
                <SettingsDialog settings={settings} setSettings={setSettings} />
              </div>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700"></div>
          </div>
          {/* Only show generation settings in initial state - but this section is inside the sidebar which is only shown when NOT in initial state, so this condition will never be true */}

          {/* Show auto updated message when older models are choosen */}
          {showBetterModelMessage && (
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <DeprecationMessage />
            </div>
          )}

          {/* Show tip link until coding is complete */}
          {/* {appState !== AppState.CODE_READY && <TipLink />} */}

          {IS_RUNNING_ON_CLOUD && !settings.openAiApiKey && (
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <OnboardingNote />
            </div>
          )}

          {/* TODO: Temporarily commented out - focusing on image-to-code functionality */}
          {/* {appState === AppState.INITIAL && (
            <GenerateFromText doCreateFromText={doCreateFromText} />
          )} */}

          {/* Rest of the sidebar when we're not in the initial state */}
          {(appState === AppState.CODING ||
            appState === AppState.CODE_READY) && (
            <div className="flex-1 flex flex-col min-h-0">
              <Sidebar
                showSelectAndEditFeature={showSelectAndEditFeature}
                doUpdate={doUpdate}
                regenerate={regenerate}
                cancelCodeGeneration={cancelCodeGeneration}
              />
            </div>
          )}
        </div>
        </div>
      )}

      <main 
        style={{ 
          paddingLeft: appState === AppState.INITIAL || activeTab === "split" 
            ? "0" 
            : `${sidebarWidth}px` 
        }}
      >
        {appState === AppState.INITIAL && (
          <StartPane
            doCreate={doCreate}
            settings={settings}
            setSettings={setSettings}
          />
        )}

        {(appState === AppState.CODING || appState === AppState.CODE_READY) && (
          <PreviewPane 
            doUpdate={doUpdate} 
            settings={settings} 
            onTabChange={handleTabChange}
          />
        )}
        </main>
      </div>
    </TypingQueueProvider>
  );
}

export default App;
