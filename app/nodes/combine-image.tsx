import { useState, memo, useMemo } from "react";
import {
  Handle,
  Position,
  NodeProps,
  useNodes,
  useEdges,
  useReactFlow,
} from "@xyflow/react";
import {
  CombineImageNodeData,
  ImagePart,
  NodeData,
  SimpleImageNodeData,
} from "@/lib/types";
import { editOrCombineImage } from "@/lib/gemini-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { cn, getDebugParamFromCurrentUrl } from "@/lib/utils";
import { NodeWrapper } from "./NodeWrapper";

const CombineImageNode = ({
  id,
  data,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
}: NodeProps<CombineImageNodeData>) => {
  const [prompt, setPrompt] = useState(data.prompt || "");
  const nodes = useNodes<NodeData>();
  const edges = useEdges();

  const { updateNodeData, addEdges, addNodes } = useReactFlow();

  const inputImages = useMemo(() => {
    const inputEdges = edges.filter((e) => e.target === id);
    return inputEdges
      .map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        // Type guard to ensure the source node has an image property
        if (sourceNode && "image" in sourceNode.data && sourceNode.data.image) {
          return sourceNode.data.image;
        }
        return null;
      })
      .filter((img): img is string => !!img);
  }, [id, nodes, edges]);

  const handleCombine = async () => {
    if (!prompt || inputImages.length === 0) {
      alert("Please provide a prompt and connect at least one image source.");
      return;
    }
    updateNodeData(id, { isLoading: true });
    try {
      const imageParts: ImagePart[] = inputImages.map((imgDataUrl) => {
        const [header, base64Data] = imgDataUrl.split(",");
        const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
        return { data: base64Data, mimeType };
      });
      const debugStatus = getDebugParamFromCurrentUrl();
      const resultUrl = await editOrCombineImage(
        prompt,
        imageParts,
        debugStatus === "true",
      );
      updateNodeData(id, { isLoading: false, prompt });
      const imageNodeData = {
        image: resultUrl,
        isLoading: false,
        userUploaded: false,
      } as SimpleImageNodeData["data"];
      const imageNode = {
        id: uuidv4(),
        type: "simpleImage",
        position: { x: positionAbsoluteX + 400, y: positionAbsoluteY },
        data: imageNodeData,
      };
      addNodes(imageNode);
      addEdges({ id: uuidv4(), source: id, target: imageNode.id });
    } catch (error) {
      console.error(error);
      alert("Failed to combine images.");
      updateNodeData(id, { isLoading: false });
    }
  };

  return (
    <NodeWrapper selected={selected}>
      <Handle type="target" position={Position.Left} id="image-input" />
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <Sparkles />
          Combine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Label htmlFor={`prompt-${id}`}>Prompt</Label>
          <Textarea
            id={`prompt-${id}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="px-2 h-25"
          />
          <Label>Model</Label>
          <Select defaultValue={"Nano-Banana"}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Nano-Banana">Google Nano Banana</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={handleCombine} disabled={data.isLoading}>
            {data.isLoading ? "Combining..." : "Combine"}
          </Button>
        </form>
      </CardContent>
      <Handle
        type="source"
        className="border-2"
        position={Position.Right}
        id="image-output"
      />
    </NodeWrapper>
  );
};

export default memo(CombineImageNode);
