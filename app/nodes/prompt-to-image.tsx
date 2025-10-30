import React, { useState, memo } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { generateImageFromPrompt } from "@/lib/gemini-service";
import { PromptToImageNodeData, SimpleImageNodeData } from "@/lib/types";
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

const PromptToImageNode: React.FC<NodeProps<PromptToImageNodeData>> = ({
  id,
  data,
  positionAbsoluteX,
  positionAbsoluteY,
  selected,
}) => {
  const [prompt, setPrompt] = useState(data.prompt || "");

  const { updateNodeData, addNodes, addEdges } = useReactFlow();

  const handleGenerate = async () => {
    if (!prompt) return;
    updateNodeData(id, { isLoading: true });
    try {
      const debugStatus = getDebugParamFromCurrentUrl();
      const imageUrl = await generateImageFromPrompt(
        prompt,
        debugStatus === "true",
      );
      updateNodeData(id, { isLoading: false, prompt });
      const imageNodeData = {
        image: imageUrl,
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
      alert("Failed to generate image.");
      updateNodeData(id, { isLoading: false });
    }
  };

  return (
    <>
      <Card
        className={cn(
          `w-80 mx-auto border-stone-500 border-[0.5px] shadow-2xl ${selected ? "border-2" : ""} `,
        )}
      >
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Sparkles />
            Generate Image
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
                  <SelectItem value="Nano-Banana">
                    Google Nano Banana
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button onClick={handleGenerate} disabled={data.isLoading}>
              {data.isLoading ? "Generating..." : "Generate"}
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
    </>
  );
};

export default memo(PromptToImageNode);
