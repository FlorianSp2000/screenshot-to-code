import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useState, useEffect } from "react";
import {
  FaDownload,
  FaDesktop,
  FaMobile,
  FaTabletAlt,
  FaCode,
  FaColumns,
} from "react-icons/fa";
import { BiData } from "react-icons/bi";
import { AppState, Settings } from "../../types";
import CodeTab from "./CodeTab";
// import { Button } from "../ui/button";
import { useAppStore } from "../../store/app-store";
import { useProjectStore } from "../../store/project-store";
import classNames from "classnames";
import { extractHtml } from "./extractHtml";
import PreviewComponent from "./PreviewComponent";
import { downloadCode } from "./download";
import { FaCopy } from "react-icons/fa";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";

interface Props {
  doUpdate: (instruction: string) => void;
  settings: Settings;
  onTabChange?: (tab: string) => void;
}

function PreviewPane({ doUpdate, settings, onTabChange }: Props) {
  const { appState, currentStatus, streamingExtraction, selectedJsonForViewing, setSelectedJsonForViewing } = useAppStore();
  const { inputMode, head, commits, referenceImages } = useProjectStore();
  const [activeTab, setActiveTab] = useState("desktop");
  const [userSelectedTab, setUserSelectedTab] = useState<string | null>(null);
  const [wasGenerating, setWasGenerating] = useState(false);

  const currentCommit = head && commits[head] ? commits[head] : "";
  const currentCode = currentCommit
    ? currentCommit.variants[currentCommit.selectedVariantIndex].code
    : "";

  const previewCode =
    inputMode === "video" && appState === AppState.CODING
      ? extractHtml(currentCode)
      : currentCode;

  // Get JSON for current commit if available
  const getCurrentJsonForViewing = () => {
    if (head && commits[head]) {
      const { extractionResults } = useAppStore.getState();
      const extractionResult = extractionResults.get(head);
      if (extractionResult) {
        return JSON.stringify(extractionResult, null, 2);
      }
    }
    return null;
  };

  // Toggle JSON viewing
  const toggleJsonView = () => {
    if (selectedJsonForViewing) {
      setSelectedJsonForViewing(null);
    } else {
      const currentJson = getCurrentJsonForViewing();
      if (currentJson) {
        setSelectedJsonForViewing(currentJson);
      }
    }
  };

  // Check if JSON is available for current commit
  const isJsonAvailable = getCurrentJsonForViewing() !== null;

  // Auto-switch logic for live coding feedback - now based on status
  useEffect(() => {
    if (currentStatus?.type === "extracting" && !userSelectedTab) {
      // Switch to split view when extraction starts to show streaming JSON
      setActiveTab("split");
    } else if (currentStatus?.type === "generating" && !userSelectedTab) {
      // Switch to code view when generation actually starts
      setActiveTab("code");
      setWasGenerating(true);
    } else if (appState === AppState.CODE_READY && wasGenerating) {
      // Generation completed - auto-switch back to preview if no manual selection
      if (!userSelectedTab) {
        setActiveTab("desktop");
      }
      setWasGenerating(false);
    }
  }, [currentStatus, appState, userSelectedTab, wasGenerating]);

  // Auto-switch to code view when JSON is selected for viewing
  useEffect(() => {
    if (selectedJsonForViewing && !userSelectedTab) {
      setActiveTab("code");
    }
  }, [selectedJsonForViewing, userSelectedTab]);

  // Reset user selection when starting fresh
  useEffect(() => {
    if (appState === AppState.INITIAL) {
      setUserSelectedTab(null);
      setWasGenerating(false);
    }
  }, [appState]);

  const handleTabChange = (value: string) => {
    console.log("PreviewPane: Tab changed to:", value);
    setActiveTab(value);
    setUserSelectedTab(value); // Track manual user selection
    onTabChange?.(value);
  };

  const copyCode = () => {
    copy(previewCode);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div 
          className="sticky top-0 z-30 flex items-center justify-between py-1 px-2 border-b h-10"
          style={{ 
            backgroundColor: 'hsl(0, 0%, 96.1%)',
            borderColor: '#e5e7eb'
          }}
        >
          {/* Left group - Split and Code */}
          <div className="flex items-center">
            <TabsList className="bg-transparent border-0 h-9">
              <TabsTrigger 
                value="split" 
                className="w-9 h-9 p-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none" 
                title="Split View"
                style={{
                  color: activeTab === 'split' ? 'rgb(59, 130, 246)' : 'hsl(0, 0%, 45.1%)'
                }}
              >
                <FaColumns size={16} />
              </TabsTrigger>
              <TabsTrigger 
                value="code" 
                className="w-9 h-9 p-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none" 
                title={selectedJsonForViewing ? "JSON View" : "Code View"}
                style={{
                  color: activeTab === 'code' ? (selectedJsonForViewing ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)') : 'hsl(0, 0%, 45.1%)'
                }}
              >
                <FaCode size={16} />
              </TabsTrigger>
              {/* JSON Toggle Button - only show when JSON is available */}
              {isJsonAvailable && (
                <button
                  onClick={toggleJsonView}
                  className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors duration-200 ml-1 ${
                    selectedJsonForViewing 
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                      : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={selectedJsonForViewing ? "Switch to Code View" : "Switch to JSON View"}
                >
                  <BiData size={16} />
                </button>
              )}
            </TabsList>
          </div>

          {/* Center group - Device views */}
          <div className="flex items-center absolute left-1/2 transform -translate-x-1/2">
            <TabsList className="bg-transparent border-0 h-9">
              <TabsTrigger 
                value="desktop" 
                className="w-9 h-9 p-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none" 
                title="Desktop View"
                style={{
                  color: activeTab === 'desktop' ? 'rgb(59, 130, 246)' : 'hsl(0, 0%, 45.1%)'
                }}
              >
                <FaDesktop size={16} />
              </TabsTrigger>
              <TabsTrigger 
                value="tablet" 
                className="w-9 h-9 p-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none" 
                title="Tablet View"
                style={{
                  color: activeTab === 'tablet' ? 'rgb(59, 130, 246)' : 'hsl(0, 0%, 45.1%)'
                }}
              >
                <FaTabletAlt size={16} />
              </TabsTrigger>
              <TabsTrigger 
                value="mobile" 
                className="w-9 h-9 p-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none" 
                title="Mobile View"
                style={{
                  color: activeTab === 'mobile' ? 'rgb(59, 130, 246)' : 'hsl(0, 0%, 45.1%)'
                }}
              >
                <FaMobile size={16} />
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Right group - Action buttons */}
          <div className="flex items-center">
            {appState === AppState.CODE_READY && (
              <>
                <button
                  onClick={copyCode}
                  className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-1"
                  style={{ color: 'hsl(0, 0%, 45.1%)' }}
                  title="Copy Code"
                >
                  <FaCopy size={16} />
                </button>
                <button
                  onClick={() => downloadCode(previewCode)}
                  className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: 'hsl(0, 0%, 45.1%)' }}
                  title="Download Code"
                >
                  <FaDownload size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        <TabsContent value="desktop">
          <PreviewComponent
            code={previewCode}
            device="desktop"
            doUpdate={doUpdate}
          />
        </TabsContent>
        <TabsContent value="tablet">
          <PreviewComponent
            code={previewCode}
            device="tablet"
            doUpdate={doUpdate}
          />
        </TabsContent>
        <TabsContent value="mobile">
          <PreviewComponent
            code={previewCode}
            device="mobile"
            doUpdate={doUpdate}
          />
        </TabsContent>
        <TabsContent value="code">
          <CodeTab 
            code={selectedJsonForViewing || previewCode} 
            setCode={() => {}} 
            settings={settings}
            isJson={!!selectedJsonForViewing}
          />
        </TabsContent>
        <TabsContent value="split">
          <div className="flex h-full gap-4 p-0">
            {/* Left side - Original image/video - Fixed positioning */}
            <div className="w-1/2 flex flex-col">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center flex-shrink-0">
                Original {inputMode === "video" ? "Video" : "Screenshot"}
              </h3>
              <div className="flex-1 flex items-start justify-center bg-gray-50 dark:bg-gray-900 pt-4" style={{ border: '0 solid #e5e7eb', minHeight: '500px' }}>
                {referenceImages.length > 0 ? (
                  <div className="relative w-full flex items-start justify-center" style={{ minHeight: '400px' }}>
                    {inputMode === "image" && (
                      <img
                        className={classNames("max-w-full object-contain shadow-lg", {
                          "scanning": appState === AppState.CODING || currentStatus?.type === "extracting",
                        })}
                        src={referenceImages[0]}
                        alt="Original Screenshot"
                        style={{ maxHeight: 'calc(100vh - 200px)', maxWidth: '100%' }}
                      />
                    )}
                    {inputMode === "video" && (
                      <video
                        muted
                        autoPlay
                        loop
                        className={classNames("max-w-full object-contain shadow-lg", {
                          "scanning": appState === AppState.CODING || currentStatus?.type === "extracting",
                        })}
                        src={referenceImages[0]}
                        style={{ maxHeight: 'calc(100vh - 200px)', maxWidth: '100%' }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 text-center flex items-center justify-center h-full">
                    No reference image available
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Generated preview, live code, or streaming extraction */}
            <div className="w-1/2 flex flex-col min-h-0">
              <div className="flex items-center justify-center mb-3 flex-shrink-0">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {currentStatus?.type === "extracting" && streamingExtraction ? "Structured Output" 
                   : appState === AppState.CODING ? "Live Code Generation" 
                   : "Generated Code Preview"}
                </h3>
                {(appState === AppState.CODING || (currentStatus?.type === "extracting" && streamingExtraction)) && (
                  <div className="ml-2 flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full counting-animation" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full counting-animation" style={{ animationDelay: '0.3s' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full counting-animation" style={{ animationDelay: '0.6s' }} />
                  </div>
                )}
              </div>
              <div className="flex-1 bg-white dark:bg-gray-900" style={{ border: '0 solid #e5e7eb', minHeight: '500px' }}>
                {currentStatus?.type === "extracting" && streamingExtraction ? (
                  // Show streaming JSON during extraction
                  <div className="w-full h-full p-4 overflow-auto font-mono text-sm bg-gray-50 dark:bg-gray-800">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {streamingExtraction.replace(/^```json\s*/, '').replace(/\s*```$/, '')}
                      <span className="animate-pulse">|</span>
                    </pre>
                  </div>
                ) : appState === AppState.CODING && currentCode ? (
                  // Show live code during generation
                  <div className="w-full h-full p-4 overflow-auto font-mono text-sm bg-gray-50 dark:bg-gray-800">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {currentCode}
                      <span className="animate-pulse">|</span>
                    </pre>
                  </div>
                ) : (
                  // Show HTML preview when complete - better sizing and no rounding
                  <iframe
                    title="Generated Preview"
                    className="w-full h-full border-0"
                    srcDoc={previewCode}
                    style={{ minHeight: '500px', height: 'calc(100vh - 200px)' }}
                  />
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PreviewPane;
