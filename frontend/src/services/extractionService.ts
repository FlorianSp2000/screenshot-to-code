import { WS_BACKEND_URL } from "../config";

export interface UIExtractionResult {
  metadata: {
    viewport: { width: number; height: number };
    platform: "web" | "mobile" | "desktop";
    theme: "light" | "dark" | "auto";
  };
  layout: {
    type: "grid" | "flex" | "absolute" | "flow";
    components: Array<{
      id: string;
      type: "button" | "input" | "text" | "image" | "nav" | "container" | "form" | "list";
      bounds: { x: number; y: number; width: number; height: number };
      parent_id: string | null;
      children: string[];
      properties: {
        text?: string;
        placeholder?: string;
        src?: string;
        href?: string;
        required?: boolean;
        disabled?: boolean;
      };
      styles: {
        backgroundColor?: string;
        color?: string;
        fontSize?: string;
        fontFamily?: string;
        border?: string;
        padding?: string;
        margin?: string;
      };
      data_binding: {
        likely_endpoint?: string;
        data_type?: string;
        crud_operations: string[];
      };
    }>;
  };
  navigation: {
    primary_nav: string[];
    breadcrumbs: string[];
    page_relationships: Array<{
      from: string;
      to: string;
      trigger: string;
    }>;
  };
  forms: Array<{
    id: string;
    action: string;
    method: "POST" | "GET" | "PUT" | "DELETE";
    fields: Array<{
      name: string;
      type: "text" | "email" | "password" | "select" | "checkbox" | "radio" | "file";
      validation?: string;
      options?: string[];
    }>;
  }>;
}

const EXTRACTION_PROMPT_TEMPLATE = `Analyze this UI screenshot and extract key structural information as JSON:

{
  "metadata": {
    "platform": "web|mobile|desktop",
    "theme": "light|dark|auto"
  },
  "layout": {
    "type": "grid|flex|flow",
    "components": [
      {
        "id": "unique_id",
        "type": "button|input|text|image|nav|container|form|list|header|footer",
        "text": "visible text content",
        "placeholder": "input placeholder if any",
        "interactions": ["click", "hover", "focus", "submit"],
        "hierarchy_level": 1,
        "parent_id": "parent_id|null"
      }
    ]
  },
  "navigation": {
    "primary_nav": ["item1", "item2"],
    "secondary_nav": ["sub_item1"]
  },
  "forms": [
    {
      "id": "form_id", 
      "fields": [
        {
          "type": "text|email|password|select|checkbox|radio",
          "name": "field_name",
          "required": boolean
        }
      ]
    }
  ],
  "interactive_elements": [
    {
      "type": "button|link|input",
      "text": "label or content",
      "action": "click|submit|navigate"
    }
  ]
}

Focus on:
- Component hierarchy and relationships  
- Interactive elements (clickable, hoverable)
- Navigation structure
- Form fields and inputs
- Visible text content

Return only valid JSON.`;

export interface ExtractionCallbacks {
  onProgress: (message: string) => void;
  onJsonStream?: (partialJson: string) => void; // New callback for streaming JSON to preview
  onComplete: (result: UIExtractionResult) => void;
  onError: (error: string) => void;
}

export async function extractUIStructure(
  imageData: string,
  additionalFiles: any[],
  settings: any, // User settings from the app
  callbacks: ExtractionCallbacks
): Promise<void> {
  try {
    // Don't show initializing message - start with first meaningful progress

    // Use the same generate-code endpoint but with extraction-specific parameters
    const wsUrl = `${WS_BACKEND_URL}/generate-code`;
    const ws = new WebSocket(wsUrl);
    
    let accumulatedContent = ""; // Track streaming content
    let hasShownFirstProgress = false; // Track if we've shown initial progress

    ws.onopen = () => {
      // Show initial progress message immediately
      callbacks.onProgress("Processing image...");
      
      // Create extraction parameters using the same format as code generation
      const extractionParams = {
        // Use extraction mode to differentiate from code generation
        isExtractionMode: true,
        generationType: "create",
        inputMode: "image",
        prompt: {
          text: EXTRACTION_PROMPT_TEMPLATE,
          images: [imageData]
        },
        additionalFiles: additionalFiles || [],
        // Use the same settings as regular code generation
        ...settings,
        // Override with extraction-specific settings
        temperature: 0.1, // Low temperature for consistent structured output
      };

      console.log("Sending extraction parameters:", {
        ...extractionParams,
        prompt: {
          text: `${extractionParams.prompt.text.substring(0, 100)}...`,
          images: [`[Image data: ${imageData.substring(0, 50)}...]`]
        }
      });

      ws.send(JSON.stringify(extractionParams));
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        console.log("Extraction response:", response.type, response.value?.substring(0, 100));
        
        if (response.type === "chunk") {
          // Accumulate streaming content
          accumulatedContent += response.value;
          
          // Stream partial JSON to preview window
          if (callbacks.onJsonStream) {
            callbacks.onJsonStream(accumulatedContent);
          }
          
          // Show progress message when streaming starts
          if (!hasShownFirstProgress && accumulatedContent.length > 10) {
            callbacks.onProgress("Extracting structured image information...");
            hasShownFirstProgress = true;
          }
          
          // Only show milestone progress messages, not every chunk
          let shouldShowProgress = false;
          let progressMessage = "";
          
          if (accumulatedContent.includes('"components"') && !progressMessage) {
            progressMessage = "Identifying UI components...";
            shouldShowProgress = true;
          }
          if (accumulatedContent.includes('"interactive_elements"') && !progressMessage) {
            progressMessage = "Detecting interactive elements...";
            shouldShowProgress = true;
          }
          
          if (shouldShowProgress && progressMessage) {
            callbacks.onProgress(progressMessage);
          }
          
          // Try to parse accumulated content as complete JSON
          try {
            const extractedData = JSON.parse(accumulatedContent) as UIExtractionResult;
            callbacks.onComplete(extractedData);
          } catch (jsonError) {
            // Not complete JSON yet, continue streaming
          }
        } else if (response.type === "setCode") {
          // The complete extraction result
          try {
            const extractedData = JSON.parse(response.value) as UIExtractionResult;
            callbacks.onComplete(extractedData);
          } catch (jsonError) {
            console.error("Failed to parse extraction JSON:", jsonError);
            callbacks.onError("Failed to parse extraction results");
          }
        } else if (response.type === "error") {
          console.error("Extraction error:", response.value);
          callbacks.onError(`Extraction failed: ${response.value}`);
        } else if (response.type === "variantError") {
          console.error("Extraction variant error:", response.value);
          callbacks.onError(`Extraction error: ${response.value}`);
        }
      } catch (error) {
        console.error("Error parsing extraction response:", error);
        callbacks.onError("Failed to parse extraction results");
      }
    };

    ws.onerror = (error) => {
      console.error("Extraction WebSocket error:", error);
      callbacks.onError("Connection error during extraction");
    };

    ws.onclose = (event) => {
      console.log("Extraction WebSocket closed:", event.code, event.reason);
      if (event.code !== 1000) {
        callbacks.onError("Extraction service disconnected unexpectedly");
      }
    };

  } catch (error) {
    console.error("Failed to start extraction:", error);
    callbacks.onError("Failed to initialize extraction service");
  }
}