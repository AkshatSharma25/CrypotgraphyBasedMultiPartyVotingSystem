import { NextResponse } from "next/server";

let index = 0; // Store index in memory

export async function GET() {
    index++; // Increment index each time it's requested
    return NextResponse.json({ index }, { status: 200 });
}