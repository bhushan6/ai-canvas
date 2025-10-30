"use server";
import { GoogleGenAI, Modality } from "@google/genai";
import { ImagePart } from "./types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY not found in environment variables. Please set it up.");
}

function getRandomSizedImageUrl(): string {
  // A predefined list of diverse dimensions (Width x Height)
  const resolutions: [number, number][] = [
    [300, 300], // 1:1 Square
    [800, 450], // 16:9 Landscape
    [400, 600], // 2:3 Portrait
    [1200, 800], // 3:2 Landscape (High-res)
    [700, 700], // 1:1 Square
    [900, 300], // 3:1 Wide Banner
  ];

  // 1. Pick a random resolution from the list
  const randomIndex = Math.floor(Math.random() * resolutions.length);
  const [width, height] = resolutions[randomIndex];

  // 2. Add a 'random' query parameter to ensure a unique image every time (cache busting)
  const randomCacheBuster = Math.random().toString(36).substring(7);

  // The final URL format is: https://picsum.photos/{width}/{height}/?random={cache_buster}
  const url = `https://picsum.photos/${width}/${height}/?random=${randomCacheBuster}`;

  return url;
}

export const generateImageFromPrompt = async (
  prompt: string,
  debug?: boolean,
): Promise<string> => {
  if (debug) {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(getRandomSizedImageUrl());
      }, 3000);
    });
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001", // imagen-4.0-fast-generate-001, imagen-4.0-ultra-generate-001
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
        aspectRatio: "1:1",
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image?.imageBytes;
      if (!base64ImageBytes) {
        throw new Error("No image bytes found");
      }
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image from prompt:", error);
    throw error;
  }
};

export const editOrCombineImage = async (
  prompt: string,
  images: ImagePart[],
  debug?: boolean,
): Promise<string> => {
  if (debug) {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(getRandomSizedImageUrl());
      }, 3000);
    });
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  if (images.length === 0) {
    throw new Error("At least one image is required for editing or combining.");
  }

  try {
    const imageParts = images.map((img) => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType,
      },
    }));

    const textPart = { text: prompt };

    const parts = [...imageParts, textPart];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    if (!response.candidates?.[0]?.content?.parts)
      throw new Error("No image was returned from the edit/combine operation.");
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        if (!base64ImageBytes)
          throw new Error(
            "No image data was returned from the edit/combine operation.",
          );
        const mimeType = part.inlineData.mimeType;
        if (!mimeType)
          throw new Error(
            "No image data was returned from the edit/combine operation.",
          );

        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error("No image was returned from the edit/combine operation.");
  } catch (error) {
    console.error("Error editing or combining image:", error);
    throw error;
  }
};

export const generateVideoFromImageAndPrompt = async (
  prompt: string,
  image: ImagePart,
): Promise<string> => {
  // Re-initialize to ensure the latest API key from the selection dialog is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: prompt,
      image: {
        imageBytes: image.data,
        mimeType: image.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: "1:1",
      },
    });

    // Poll for completion every 10 seconds
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      return `${downloadLink}&key=${process.env.API_KEY}`;
    }

    throw new Error(
      "Video generation completed, but no download link was found.",
    );
  } catch (error) {
    console.error("Error generating video:", error);
    if (
      error instanceof Error &&
      error.message.includes("Requested entity was not found.")
    ) {
      throw new Error(
        "API key may be invalid. Please select a valid key and try again.",
      );
    }
    throw error;
  }
};
