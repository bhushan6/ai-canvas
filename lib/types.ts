import { Node } from "@xyflow/react";

// Data types for each node
export type PromptToImageData = {
  isLoading: boolean;
  image: string | null;
  prompt: string;
};
export type SimpleImageData = {
  isLoading: boolean;
  image: string | null;
  userUploaded: boolean;
};
export type CombineImageData = {
  isLoading: boolean;
  image: string | null;
  prompt: string;
};
export type EditImageData = {
  isLoading: boolean;
  image: string | null;
  prompt: string;
};
export type GenerateVideoData = {
  isLoading: boolean;
  videoUrl: string | null;
  prompt: string;
};
export type OpenAIChatData = {
  isLoading?: boolean;
  prompt?: string;
  outputText?: string;
};
export type TextNodeData = {
  inputText?: string;
};

// Full Node types
export type PromptToImageNodeType = Node<PromptToImageData, "promptToImage">;
export type SimpleImageNodeType = Node<SimpleImageData, "simpleImage">;
export type CombineImageNodeType = Node<CombineImageData, "combineImage">;
export type EditImageNodeType = Node<EditImageData, "editImage">;
export type GenerateVideoNodeType = Node<GenerateVideoData, "generateVideo">;
export type OpenAIChatNodeType = Node<OpenAIChatData, "openAIChat">;
export type TextNodeType = Node<TextNodeData, "text">;

// The union of all possible node types
export type NodeData =
  | PromptToImageNodeType
  | SimpleImageNodeType
  | CombineImageNodeType
  | EditImageNodeType
  | GenerateVideoNodeType
  | OpenAIChatNodeType
  | TextNodeType;

export interface ImagePart {
  data: string; // base64 encoded string without prefix
  mimeType: string;
}
