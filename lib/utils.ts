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

export /**
 * Downloads an image from a URL or a Base64 data URL.
 *
 * @param source The image URL (e.g., 'https://...') or a Base64 data URL (e.g., 'data:image/png;base64,...').
 * @param fileName The desired filename for the downloaded image (e.g., 'my-photo.jpg').
 * @returns A Promise that resolves when the download is attempted.
 */
async function downloadImage(
  source: string,
  fileName: string = "downloaded-image.png",
): Promise<{ success: boolean }> {
  const isBase64 = source.startsWith("data:");

  try {
    let blob: Blob;

    if (isBase64) {
      // 1. Handle Base64 Data URL
      const parts = source.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const base64Data = parts.length > 1 ? parts[1] : parts[0]; // Get the actual base64 part

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else {
      // 2. Handle Regular URL (requires CORS or same-origin)
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Get the image data as a Blob
      blob = await response.blob();
    }

    // 3. Create a temporary download link and trigger the download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = fileName; // Set the desired file name
    document.body.appendChild(link);
    link.click(); // Programmatically click the link to start the download
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl); // Clean up the temporary URL
    return { success: true };
  } catch (error) {
    console.error("Error during image download:", error);
    // alert(
    //   `Download failed. This is often due to CORS policy for external URLs.`,
    // );
    return { success: false };
  }
}
