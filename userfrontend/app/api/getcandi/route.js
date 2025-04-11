import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://akshat45:sharmakshat19@cluster0.yoirmew.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const dbName = "votingDB";
const collectionName = "candidates";
export async function GET() {
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
  
      const candidates = await collection
        .find()
        .project({ name: 1, party: 1, image: 1, index: 1 }) // Only return these fields
        .toArray();
  
      return NextResponse.json({ candidates }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ message: "Error fetching candidates", error: error.message }, { status: 500 });
    } finally {
      await client.close();
    }
  };
  