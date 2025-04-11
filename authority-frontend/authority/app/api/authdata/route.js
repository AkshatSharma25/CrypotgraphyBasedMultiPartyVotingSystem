import { NextResponse } from "next/server";

let storedData = "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow requests from any origin
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({"message":"hello"}, { status: 200, headers: corsHeaders });
}

export async function POST(req) {
  try {
    console.log("Request received");
    const { value } = await req.json();
    // console.log(value);
    if (!value) {
      return NextResponse.json({ message: "Value is required" }, { status: 400, headers: corsHeaders });
    }
    storedData = value;
    // console.log(value);
    return NextResponse.json({ message: "Value stored successfully" }, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400, headers: corsHeaders });
  }
}

export async function GET() {
  return NextResponse.json({ storedValue: storedData }, { status: 200, headers: corsHeaders });
}
