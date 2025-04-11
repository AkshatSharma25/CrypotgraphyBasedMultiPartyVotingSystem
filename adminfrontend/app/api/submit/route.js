import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://akshat45:sharmakshat19@cluster0.yoirmew.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const dbName = "votingDB";
const collectionName = "candidates";

export async function POST(req) {
    try {
        const { name, party, image, index } = await req.json();
        if (!name || !party || !image || index === undefined) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }

        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const candidate = { name, party, image, index };
        await collection.insertOne(candidate);

        return NextResponse.json({ message: "Candidate stored successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error storing candidate", error: error.message }, { status: 500 });
    } finally {
        await client.close();
    }
}

export async function GET() {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const candidates = await collection.find().toArray();

        return NextResponse.json({ candidates }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching candidates", error: error.message }, { status: 500 });
    } finally {
        await client.close();
    }
}