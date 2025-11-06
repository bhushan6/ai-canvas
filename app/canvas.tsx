"use client";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  DefaultEdgeOptions,
  Connection,
} from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { CombineImageNodeData, NodeData, PromptToImageData } from "@/lib/types";
import PromptToImageNode from "./nodes/prompt-to-image";
import SimpleImageNode from "./nodes/simple-image";
import CombineImageNode from "./nodes/combine-image";
import EditImageNode from "./nodes/edit-image";

import "@xyflow/react/dist/style.css";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ImageIcon, ImageUpIcon, Merge } from "lucide-react";
import { fileToBase64 } from "@/lib/utils";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { OpenAIChatNode } from "./nodes/openai-chat";

const initialNodes: Node<NodeData>[] = [
  // {
  //   id: uuidv4(),
  //   type: "openaiChat",
  //   position: { x: 100, y: 100 },
  //   data: {
  //     isLoading: false,
  //     prompt: "",
  //   },
  // },
];
const initialEdges: Edge[] = [];

export function Canvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      promptToImage: PromptToImageNode,
      simpleImage: SimpleImageNode,
      combineImage: CombineImageNode,
      editImage: EditImageNode,
      openaiChat: OpenAIChatNode,
    }),
    [],
  );

  const defaultEdgeOptions: DefaultEdgeOptions = useMemo(
    () => ({
      animated: true,
    }),
    [],
  );

  const nodesWithUpdaters = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
      },
    }));
  }, [nodes]);

  const inputRef = useRef<HTMLInputElement>(null);

  const [showToolbar, setShowToolbar] = useState(false);

  const currentSelectedNodes = useRef<Node[]>([]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imagePart = await fileToBase64(file);
        const imageUrl = `data:${imagePart.mimeType};base64,${imagePart.data}`;
        const newNode = {
          id: uuidv4(),
          type: "simpleImage",
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: {
            image: imageUrl,
            isLoading: false,
            userUploaded: true,
          },
        };
        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error("Error converting file to base64:", error);
        alert("Failed to load image.");
      }
    }
  };

  useEffect(() => {
    setNodes([
      {
        id: uuidv4(),
        type: "openaiChat",
        position: { x: 100, y: 100 },
        data: {
          isLoading: false,
          prompt: "",
          // outputText:
          //   "Dogs, known for their unwavering loyalty and affection, have been humans' companions for thousands of years. They come in various breeds, each with unique traits and charm, from the energetic Border Collie to the gentle Golden Retriever. Dogs offer not only companionship but also security and assistance, as seen in roles like service and therapy animals. Their keen senses and intelligence make them adept at tasks like search and rescue. A dog's enthusiastic greeting after a long day can uplift spirits, highlighting their role in improving mental well-being. Truly, dogs enrich lives with their unconditional love and joyful presence.",
        },
      },
    ]);
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <ContextMenu>
        <ContextMenuTrigger>
          <ReactFlow
            nodes={nodesWithUpdaters}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onSelectionChange={({ nodes }) => {
              currentSelectedNodes.current = nodes;
              const allAreImageNodes = nodes.every(
                (node) => node.type === "simpleImage",
              );
              if (!allAreImageNodes || nodes.length < 2) {
                setShowToolbar(false);
                return;
              }
              setShowToolbar(true);
            }}
            // fitView
          >
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem
            inset
            onClick={(e) => {
              console.log(e.clientX, e.clientY);
              const data: PromptToImageData = {
                prompt: "",
                image: null,
                isLoading: false,
              };

              const newNode: Node<NodeData> = {
                id: uuidv4(),
                type: "promptToImage",
                position: { x: e.clientX, y: e.clientY },
                //@ts-expect-error: ignore for now
                data,
              };
              setNodes((nds) => nds.concat(newNode));
            }}
          >
            <ImageIcon />
            Generate Image
          </ContextMenuItem>
          <ContextMenuItem
            inset
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            <ImageUpIcon />
            Import Image
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {showToolbar && (
        <Menubar className="absolute z-10 bottom-0 left-1/2 my-5 -translate-x-1/2">
          <MenubarMenu>
            <MenubarTrigger
              className="flex gap-2 justify-center items-center"
              onClick={() => {
                const selectedNodes = currentSelectedNodes.current;

                const averageYPosition =
                  selectedNodes.reduce(
                    (acc, node) => acc + node.position.y,
                    0,
                  ) / selectedNodes.length;
                const averageXPosition =
                  selectedNodes.reduce(
                    (acc, node) => acc + node.position.x,
                    0,
                  ) / selectedNodes.length;

                const combileNodeData: CombineImageNodeData = {
                  id: uuidv4(),
                  type: "combineImage",
                  data: { image: null, isLoading: false, prompt: "" },
                  position: { x: averageXPosition + 400, y: averageYPosition },
                };
                setNodes((nds) => nds.concat(combileNodeData));

                setEdges((eds) => {
                  const newEdges: Edge[] = [];
                  selectedNodes.forEach((node) => {
                    newEdges.push({
                      id: uuidv4(),
                      source: node.id,
                      target: combileNodeData.id,
                    });
                  });
                  return eds.concat(newEdges);
                });
              }}
            >
              <Merge size={14} /> Combine
            </MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )}
    </div>
  );
}
