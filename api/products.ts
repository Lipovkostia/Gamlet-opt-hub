import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '../lib/mongodb';
import { Product, ProductStatus } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const productsCollection = db.collection('products');

    switch (req.method) {
      case 'GET': {
        const products = await productsCollection.find({}).toArray();
        const formattedProducts = products.map(p => ({ ...p, id: p._id.toString() }));
        res.status(200).json(formattedProducts);
        break;
      }

      case 'POST': {
        const { productData, productsData } = req.body;

        if (productData) { // Single product add
            const newProduct: Omit<Product, 'id'> = {
                ...productData,
                status: ProductStatus.Available,
            };
            const result = await productsCollection.insertOne(newProduct);
            res.status(201).json({ ...newProduct, id: result.insertedId.toString() });

        } else if (productsData) { // Bulk product add
            const newProducts = productsData.map((p: Omit<Product, 'id' | 'status'>) => ({
                ...p,
                status: ProductStatus.Available
            }));
            const result = await productsCollection.insertMany(newProducts);
            const insertedIds = Object.values(result.insertedIds).map(id => id.toString());
            const insertedProducts = newProducts.map((p, i) => ({ ...p, id: insertedIds[i] }));
            res.status(201).json(insertedProducts);

        } else {
            res.status(400).json({ message: 'Invalid request body' });
        }
        break;
      }
      
      case 'PUT': {
        const { id, update } = req.body;
        if (!id || !update) {
            return res.status(400).json({ message: 'Missing product ID or update data.' });
        }
        const result = await productsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: update }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product updated successfully' });
        break;
      }

      case 'DELETE': {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Missing product ID.' });
        }
        const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product deleted successfully.' });
        break;
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error', error: e instanceof Error ? e.message : 'Unknown error' });
  }
}