import React, { useState, memo, useMemo } from "react";
import {
  Handle,
  Position,
  NodeProps,
  useNodes,
  useEdges,
  useReactFlow,
  useNodeConnections,
} from "@xyflow/react";
import {
  EditImageNodeData,
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
import { cn } from "@/lib/utils";

const EditImageNode: React.FC<NodeProps<EditImageNodeData>> = ({
  id,
  data,
  positionAbsoluteX,
  positionAbsoluteY,
  selected,
}) => {
  const [prompt, setPrompt] = useState(data.prompt || "");
  const nodes = useNodes<NodeData>();
  const edges = useEdges();

  const connections = useNodeConnections({
    id,
    handleType: "target",
  });

  const { updateNodeData, addEdges, addNodes } = useReactFlow();

  const inputImage = useMemo(() => {
    const edge = edges.find((e) => e.target === id);
    if (!edge) return null;
    const sourceNode = nodes.find((n) => n.id === edge.source);
    // Type guard to ensure the source node has an image property
    if (sourceNode && "image" in sourceNode.data && sourceNode.data.image) {
      return sourceNode.data.image;
    }
    return null;
  }, [id, nodes, edges]);

  const handleEdit = async () => {
    if (!prompt || !inputImage) {
      alert("Please provide a prompt and connect an image source.");
      return;
    }
    updateNodeData(id, { isLoading: true });
    try {
      const [header, base64Data] = inputImage.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
      const imagePart: ImagePart = { data: base64Data, mimeType };

      const resultUrl = await editOrCombineImage(prompt, [imagePart]);
      // updateNodeData(id, { image: resultUrl, isLoading: false, prompt });
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
      alert("Failed to edit image.");
      updateNodeData(id, { isLoading: false });
    }
  };

  return (
    <Card
      className={cn(
        `w-80 mx-auto border-stone-500 border-[0.5px] shadow-2xl ${selected ? "border-2" : ""} `,
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="image-input"
        isConnectable={connections.length < 1}
      />
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <Sparkles />
          Edit Image
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
          <Button onClick={handleEdit} disabled={data.isLoading}>
            {data.isLoading ? "Editing..." : "Edit"}
          </Button>
        </form>
      </CardContent>
      <Handle
        type="source"
        className="border-2"
        position={Position.Right}
        id="image-output"
      />
    </Card>
  );
};

export default memo(EditImageNode);
