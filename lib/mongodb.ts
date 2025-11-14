import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let clientPromise: Promise<MongoClient>;

declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

if (!globalThis._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  globalThis._mongoClientPromise = client.connect();
}

clientPromise = globalThis._mongoClientPromise;

export default clientPromise;
