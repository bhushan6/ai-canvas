import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ImagePart } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fileToBase64 = (file: File): Promise<ImagePart> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      resolve({ data: base64Data, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

export function getDebugParamFromCurrentUrl(): string | null {
  // Get the query string part of the current URL (e.g., "?debug=true&user=123")
  const queryString = window.location.search;

  // Create a URLSearchParams object from the query string
  const params = new URLSearchParams(queryString);

  // Get the value of the 'debug' parameter
  const debugValue = params.get("debug");

  return debugValue;
}
