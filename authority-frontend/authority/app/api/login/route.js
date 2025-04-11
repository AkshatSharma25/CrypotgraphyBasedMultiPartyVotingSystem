// app/api/login/route.js
import { NextResponse } from "next/server";
import { adminCred } from "../../../data/adminCred.js"; // Adjust the path as necessary

export async function POST(request) {
    const { username, password } = await request.json();
    console.log(username);

    if (username === adminCred.username && password === adminCred.password) {
        return NextResponse.json({ message: "Login successful" });
    } else {
        return NextResponse.json({ message: "Invalid username or password" }, { status: 401 });
    }
}
