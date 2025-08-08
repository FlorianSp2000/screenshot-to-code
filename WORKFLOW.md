# Agentic UI Extraction + Code Generation Workflow

## Complete Workflow Implementation

### 1. **User Upload Phase** 
- User uploads image file via StartPane or sidebar
- Image stored as data URL in `referenceImages` array
- Additional files (CSS, etc.) stored in `additionalFiles` array

### 2. **UI Extraction Phase** (NEW)
- **When:** Only for `create` operations with images
- **Process:** 
  - `doUIExtraction()` called with primary image + additional files
  - WebSocket connection to `/extract-ui-structure` endpoint
  - Claude analyzes image using structured extraction prompt
  - Returns JSON with:
    - Component hierarchy and layout structure
    - Interactive elements (buttons, inputs, forms)
    - Navigation patterns and data relationships
    - Visual styling and theming information
    - Inferred API endpoints and CRUD operations
- **Status:** "Extracting UI structure..." with orange indicators
- **Storage:** Results stored in `extractionResults` Map by commitId

### 3. **Code Generation Phase** (ENHANCED)
- **Input to Backend:**
  - **Original image** (from `params.prompt.images`)
  - **Structured extraction JSON** (from `extractionResult`)
  - Additional files (CSS, assets)
  - Generation history for updates
- **Process:**
  - Backend receives BOTH the raw image AND the structured analysis
  - Coding agent uses structured data for intelligent generation
  - Streams code back to frontend via WebSocket
- **Status:** "Analyzing extracted structure and generating code..."

### 4. **Live Code Streaming**
- Code tokens streamed in real-time
- Auto-switch to code view during generation
- Live preview with blinking cursor effect

### 5. **Preview Rendering**
- Generated code rendered in iframe
- Auto-switch back to preview when complete
- Version artifacts displayed with icons

### 6. **Modification Workflow**
- **Updates:** Reuse extraction results from original create commit
- **No re-extraction:** Updates use existing structural understanding
- **Context:** Full history + original extraction passed to backend

## Key Implementation Files

### Frontend Architecture:
- **`/services/extractionService.ts`** - UI extraction API and prompt template
- **`/store/app-store.ts`** - State management for extraction results
- **`/components/sidebar/Sidebar.tsx`** - UI for displaying extraction summaries
- **`App.tsx`** - Orchestrates the complete workflow

### Backend Communication:
- **Extraction Endpoint:** `/extract-ui-structure` (WebSocket)
- **Generation Endpoint:** `/generate-code` (WebSocket) 
- **Enhanced Payload:** Original params + `extractionResult` field

## Workflow Status Flow:

```
1. Upload Image
   ↓
2. "Extracting UI structure..." (🟠 Orange)
   ↓
3. "Analyzing extracted structure..." (🔵 Blue) 
   ↓
4. "Generating your code..." (🟣 Purple)
   ↓
5. "Code generation complete!" (🟢 Green)
```

## Data Flow:

```
Image Upload → UI Extraction → Structured JSON + Original Image → Coding Agent → Streamed Code → Preview
```

This agentic approach ensures the AI has both visual understanding (raw image) AND structural understanding (extracted JSON) for optimal code generation.