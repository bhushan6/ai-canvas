import { Node } from "@xyflow/react";

// Corrected specific data types for each node type
export type PromptToImageData = {
  isLoading: boolean;
  image: string | null;
  prompt: string;
};
export type PromptToImageNodeData = Node<PromptToImageData>;

export type SimpleImageData = {
  isLoading: boolean;
  image: string | null;
  userUploaded: boolean;
};
export type SimpleImageNodeData = Node<SimpleImageData>;

export type CombineImageData = {
  isLoading: boolean;
  image: string | null;
  prompt: string;
};
export type CombineImageNodeData = Node<CombineImageData>;

export type EditImageData = {
  isLoading: boolean;
  image: string | null;
  prompt: string;
};
export type EditImageNodeData = Node<EditImageData>;

export type GenerateVideoData = {
  isLoading: boolean;
  videoUrl: string | null;
  prompt: string;
};

export type GenerateVideoNodeData = Node<GenerateVideoData>;

// The union of all possible node types
export type NodeData =
  | PromptToImageNodeData
  | SimpleImageNodeData
  | CombineImageNodeData
  | EditImageNodeData
  | GenerateVideoNodeData;

export interface ImagePart {
  data: string; // base64 encoded string without prefix
  mimeType: string;
}
