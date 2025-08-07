import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useState } from "react";
import {
  FaDownload,
  FaDesktop,
  FaMobile,
  FaTabletAlt,
  FaCode,
  FaColumns,
} from "react-icons/fa";
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
  const { appState } = useAppStore();
  const { inputMode, head, commits, referenceImages } = useProjectStore();
  const [activeTab, setActiveTab] = useState("desktop");

  const currentCommit = head && commits[head] ? commits[head] : "";
  const currentCode = currentCommit
    ? currentCommit.variants[currentCommit.selectedVariantIndex].code
    : "";

  const previewCode =
    inputMode === "video" && appState === AppState.CODING
      ? extractHtml(currentCode)
      : currentCode;

  const handleTabChange = (value: string) => {
    console.log("PreviewPane: Tab changed to:", value);
    setActiveTab(value);
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
                title="Code View"
                style={{
                  color: activeTab === 'code' ? 'rgb(59, 130, 246)' : 'hsl(0, 0%, 45.1%)'
                }}
              >
                <FaCode size={16} />
              </TabsTrigger>
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
            code={previewCode} 
            setCode={() => {}} 
            settings={settings} 
          />
        </TabsContent>
        <TabsContent value="split">
          <div className="flex h-full gap-4 p-0">
            {/* Left side - Original image/video */}
            <div className="w-1/2 flex flex-col min-h-0">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
                Original {inputMode === "video" ? "Video" : "Screenshot"}
              </h3>
              <div className="flex-1 min-h-0 flex items-center justify-center rounded-md bg-gray-50 dark:bg-gray-900" style={{ border: '0 solid #e5e7eb' }}>
                {referenceImages.length > 0 ? (
                  <div
                    className={classNames("w-full h-full flex items-center justify-center", {
                      "scanning relative": appState === AppState.CODING,
                    })}
                  >
                    {inputMode === "image" && (
                      <img
                        className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                        src={referenceImages[0]}
                        alt="Original Screenshot"
                      />
                    )}
                    {inputMode === "video" && (
                      <video
                        muted
                        autoPlay
                        loop
                        className="w-full h-full object-contain rounded-md shadow-lg"
                        src={referenceImages[0]}
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 text-center">
                    No reference image available
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Generated preview */}
            <div className="w-1/2 flex flex-col min-h-0">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
                Generated Code Preview
              </h3>
              <div className="flex-1 min-h-0 rounded-md bg-white dark:bg-gray-900" style={{ border: '0 solid #e5e7eb' }}>
                <iframe
                  title="Generated Preview"
                  className="w-full h-full rounded-md"
                  srcDoc={previewCode}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PreviewPane;
