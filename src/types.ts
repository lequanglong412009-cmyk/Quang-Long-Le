import { Timestamp } from 'firebase/firestore';

export interface Document {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  fileUrl?: string; // Only reachable if purchased
  previewUrl: string; // Public PDF preview
  thumbnailUrl: string;
  salesCount: number;
  status: 'Hot' | 'Bestseller' | 'New' | 'Regular';
  createdAt: Timestamp | Date | number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  purchasedDocs: string[]; // List of document IDs
  createdAt: Timestamp | Date | number;
}

export interface Purchase {
  id: string;
  userId: string;
  documentId: string;
  pricePaid: number;
  purchasedAt: Timestamp | Date | number;
}

export interface AccessRequest {
  id: string;
  userId: string;
  userEmail: string;
  documentId: string;
  documentTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
}

export type Category = string; // Using string for flexible "Grade | Subject" format
