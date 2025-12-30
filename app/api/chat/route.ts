import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Apni .env file mein key zaroor daalna
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // OpenAI Chat Completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Ya gpt-4-turbo
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant talking to a user. You will strictly respond in Arabic. Keep your answers concise and natural for a conversation.",
        },
        { role: "user", content: text },
      ],
    });

    const reply = completion.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}