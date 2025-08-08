import React, { useState } from "react";
import { FaCog } from "react-icons/fa";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import OutputSettingsSection from "./OutputSettingsSection";
import { Stack } from "../../lib/stacks";

interface CompactFrameworkSelectorProps {
  selectedStack: Stack;
  onStackChange: (stack: Stack) => void;
  disabled?: boolean;
}

export const CompactFrameworkSelector: React.FC<CompactFrameworkSelectorProps> = ({
  selectedStack,
  onStackChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`
            absolute top-3 right-3 z-20
            w-8 h-8 rounded-full 
            flex items-center justify-center
            transition-all duration-200
            ${disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md'
            }
            backdrop-blur-sm border border-gray-200/50
          `}
          disabled={disabled}
          title="Framework Settings"
          onClick={(e) => e.stopPropagation()}
        >
          <FaCog size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-900">
              Output Framework
            </h4>
            <span className="text-xs text-gray-500">
              Choose your stack
            </span>
          </div>
          
          <OutputSettingsSection
            stack={selectedStack}
            setStack={onStackChange}
            shouldDisableUpdates={disabled}
          />
          
          <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
            This determines how your code will be generated (React, plain HTML, etc.)
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CompactFrameworkSelector;