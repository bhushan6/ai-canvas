import { OpenAIChatNodeType } from "@/lib/types";
import { Handle, NodeProps, Position, useReactFlow } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { v4 as uuidv4 } from "uuid";

export const OpenAIChatNode: React.FC<NodeProps<OpenAIChatNodeType>> = ({
  data,
  selected,
  id,
}) => {
  const { isLoading, prompt, outputText } = data;

  // const [localPrompt, setPrompt] = useState("");

  const { updateNodeData } = useReactFlow();

  const { messages, sendMessage } = useChat({
    id,
    generateId: uuidv4,
    transport: new DefaultChatTransport({
      api: "/api/chat/openai",
      prepareSendMessagesRequest(request) {
        return {
          body: {
            id: request.id,
            message: request.messages.at(-1),
            ...request.body,
          },
        };
      },
    }),
    onError: (error) => {
      console.error("Chat error:", error);
      updateNodeData(id, { isLoading: false });
    },
    onFinish: (response) => {
      console.log("Chat finished:", response);
      const assistantMessages = response.message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
      updateNodeData(id, { isLoading: false, outputText: assistantMessages });
    },
  });

  const assistantMessages = messages.filter(
    (message) => message.role === "assistant",
  );

  const lastMessage = assistantMessages.at(-1);

  console.log(outputText);

  return (
    <NodeWrapper selected={selected}>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <Sparkles />
          Open AI Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            if (!prompt) return;
            e.preventDefault();
            sendMessage({ text: prompt });
            updateNodeData(id, {
              isLoading: true,
              prompt,
              outputText: undefined,
            });
          }}
        >
          <Label htmlFor={`prompt-${id}`}>Prompt</Label>
          <Textarea
            id={`prompt-${id}`}
            value={prompt}
            onChange={(e) => {
              updateNodeData(id, { prompt: e.target.value });
            }}
            className="px-2 h-25"
          />
          <Label>Model</Label>

          <Button type="submit" disabled={data.isLoading}>
            {data.isLoading ? "Generating..." : "Generate"}
          </Button>
        </form>
      </CardContent>
      <CardContent>
        {outputText ? (
          <div className="text-sm">{outputText}</div>
        ) : lastMessage ? (
          <div>
            {lastMessage.parts.map((part, index) => {
              if (part.type !== "text") return null;
              return (
                <span key={index} className="text-sm">
                  {part.text}
                </span>
              );
            })}
          </div>
        ) : null}
      </CardContent>

      <Handle type="source" position={Position.Right} id="openai-output" />
    </NodeWrapper>
  );
};
