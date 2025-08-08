import { Stack } from "./lib/stacks";
import { CodeGenerationModel } from "./lib/models";
import { UIExtractionResult } from "./services/extractionService";

export enum EditorTheme {
  ESPRESSO = "espresso",
  COBALT = "cobalt",
}

export interface Settings {
  openAiApiKey: string | null;
  openAiBaseURL: string | null;
  screenshotOneApiKey: string | null;
  isImageGenerationEnabled: boolean;
  editorTheme: EditorTheme;
  generatedCodeConfig: Stack;
  codeGenerationModel: CodeGenerationModel;
  // Only relevant for hosted version
  isTermOfServiceAccepted: boolean;
  anthropicApiKey: string | null; // Added property for anthropic API key
}

export enum AppState {
  INITIAL = "INITIAL",
  CODING = "CODING",
  CODE_READY = "CODE_READY",
}

export enum ScreenRecorderState {
  INITIAL = "initial",
  RECORDING = "recording",
  FINISHED = "finished",
}

export interface PromptContent {
  text: string;
  images: string[]; // Array of data URLs
  additionalFiles?: any[]; // Additional files like CSS, assets, etc.
}

export interface SerializedFile {
  id: string;
  category: string;
  dataUrl?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface CodeGenerationParams {
  generationType: "create" | "update";
  inputMode: "image" | "video" | "text";
  prompt: PromptContent;
  history?: PromptContent[];
  isImportedFromCode?: boolean;
  additionalFiles?: SerializedFile[]; // Additional files like CSS, assets, etc.
  extractionResult?: UIExtractionResult; // Structured UI analysis from extraction phase
}

export type FullGenerationSettings = CodeGenerationParams & Settings;
