import React, { memo, useEffect, useState } from "react";
import {
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  useNodeConnections,
} from "@xyflow/react";
import { SimpleImageNodeData } from "@/lib/types";

import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AlertCircleIcon, Download, Edit, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

/**
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

function ImageDisplayCard({ displayImage }: { displayImage: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // This is important if 'displayImage' changes frequently
  React.useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [displayImage]);

  return (
    <>
      {displayImage && !hasError && !isLoaded && (
        <AspectRatio ratio={1} className="flex justify-center items-center">
          <Skeleton className="w-full h-full rounded-sm" />
        </AspectRatio>
      )}
      {hasError && (
        <div className="text-red-700 flex gap-2 justify-center">
          <AlertCircleIcon /> Error while loading image
        </div>
      )}
      {displayImage && (
        <img
          src={displayImage}
          alt="user-uploaded"
          // 5. Set isLoaded to true on successful load
          onLoad={() => {
            setIsLoaded(true);
            setHasError(false);
          }}
          // 6. Set hasError to true on error
          onError={() => {
            setIsLoaded(true); // Treat error as the end of the loading process
            setHasError(true);
          }}
          // 7. Hide the image until it loads (optional: use isLoaded state for opacity transition)
          className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </>
  );
}

const DownloadButton = ({
  displayImage,
  id,
}: {
  displayImage: string;
  id: string;
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  return (
    <Button
      variant={"secondary"}
      className="cursor-pointer shadow-2xl border-[0.5px] border-stone-500"
      onClick={async () => {
        if (!displayImage) return;
        setIsDownloading(true);
        await downloadImage(displayImage, `image-${id}.png`);
        setIsDownloading(false);
      }}
      disabled={isDownloading}
    >
      {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}{" "}
      {isDownloading ? "Downloading..." : "Download"}
    </Button>
  );
};

const SimpleImageNode: React.FC<NodeProps<SimpleImageNodeData>> = ({
  id,
  data,
  positionAbsoluteX,
  positionAbsoluteY,
  selected,
}) => {
  const displayImage = data.image;

  const connections = useNodeConnections({
    id,
    handleType: "target",
  });

  const { deleteElements } = useReactFlow();

  useEffect(() => {
    if (connections.length < 1) {
      deleteElements({ nodes: [{ id }] });
    }
  }, [connections, id, deleteElements]);

  const { addNodes, addEdges } = useReactFlow();

  return (
    <>
      <Card
        className={cn(
          `w-80 mx-auto border-stone-500 border-[0.5px] shadow-2xl ${selected ? "border-2" : ""} my-2`,
        )}
      >
        {!data.userUploaded && (
          <Handle
            type="target"
            position={Position.Left}
            id="image-input"
            isConnectable={connections.length < 1}
          />
        )}
        <CardContent className="flex justify-center items-center">
          {displayImage && <ImageDisplayCard displayImage={displayImage} />}
        </CardContent>
        <Handle type="source" position={Position.Right} id="image-output" />
      </Card>
      <div className="absolute bottom-0 right-2 translate-y-full  flex gap-1 ">
        {displayImage && <DownloadButton displayImage={displayImage} id={id} />}
        <Button
          variant={"secondary"}
          className="cursor-pointer shadow-2xl border-[0.5px] border-stone-500"
          onClick={() => {
            const nodeData = {
              id: uuidv4(),
              type: "editImage",
              position: {
                x: positionAbsoluteX + 400,
                y: positionAbsoluteY,
              },
              data: {
                prompt: "",
                image: null,
                isLoading: false,
              },
            };
            addNodes(nodeData);
            addEdges({
              id: uuidv4(),
              source: id,
              target: nodeData.id,
            });
          }}
        >
          <Edit /> Edit
        </Button>
      </div>
    </>
  );
};

export default memo(SimpleImageNode);
