import { NextRequest, NextResponse } from "next/server";
import { convertToModelMessages, createGateway, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { postRequestBodySchema, type PostRequestBody } from "./schema";
import { promises as fs } from "fs";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// gateway.

export async function POST(req: Request) {
  console.log("POST request received");
  let requestBody: PostRequestBody;

  try {
    const json = await req.json();
    console.log(json);
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return NextResponse.json({ error: "bad_request:api" }, { status: 400 });
  }
  console.log("JSON parsed successfully");
  const { message } = requestBody;

  // const availableModels = await gateway.getAvailableModels();

  const result = streamText({
    model: "openai/gpt-4o",
    messages: convertToModelMessages([message]),
  });

  return result.toUIMessageStreamResponse();
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Hello World" });
}
