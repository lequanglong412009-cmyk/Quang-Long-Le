import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  orderBy, 
  setDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Document, UserProfile, AccessRequest } from '../types';

export const MARKEPLTACE_COLLECTIONS = {
  DOCUMENTS: 'documents',
  DOC_FILES: 'documentFiles',
  USERS: 'users',
  PURCHASES: 'purchases',
  REQUESTS: 'accessRequests',
  GLOBAL_STATS: 'globalStats'
};

// --- Documentation Service ---

export async function getDocuments(filters?: { category?: string; status?: string }) {
  let q = query(collection(db, MARKEPLTACE_COLLECTIONS.DOCUMENTS), orderBy('createdAt', 'desc'));
  
  if (filters?.category && filters.category !== 'All') {
    q = query(q, where('category', '==', filters.category));
  }
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Document));
}

export async function getDocumentById(id: string) {
  const docRef = doc(db, MARKEPLTACE_COLLECTIONS.DOCUMENTS, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Document;
}

export async function getSecureFileUrl(id: string) {
  const isPurchased = await checkPurchase(id);
  if (!isPurchased) throw new Error('Cần được Admin phê duyệt để tải file');

  const fileRef = doc(db, MARKEPLTACE_COLLECTIONS.DOC_FILES, id);
  const snap = await getDoc(fileRef);
  if (!snap.exists()) return null;
  return snap.data().fileUrl as string;
}

// --- Purchase Service ---

export async function submitAccessRequest(documentData: Document) {
  const user = auth.currentUser;
  if (!user) throw new Error('Vui lòng đăng nhập');

  const requestId = `${user.uid}_${documentData.id}`;
  console.log('marketplaceService: Submitting access request to path:', MARKEPLTACE_COLLECTIONS.REQUESTS, '/', requestId);
  const requestRef = doc(db, MARKEPLTACE_COLLECTIONS.REQUESTS, requestId);
  
  await setDoc(requestRef, {
    userId: user.uid,
    userEmail: user.email,
    documentId: documentData.id,
    documentTitle: documentData.title,
    status: 'pending',
    requestedAt: serverTimestamp()
  });
}

export async function checkRequestStatus(docId: string) {
  const user = auth.currentUser;
  if (!user) return null;
  const requestRef = doc(db, MARKEPLTACE_COLLECTIONS.REQUESTS, `${user.uid}_${docId}`);
  const snap = await getDoc(requestRef);
  if (!snap.exists()) return null;
  return snap.data().status as string;
}

export async function checkPurchase(docId: string) {
  const user = auth.currentUser;
  if (!user) return false;
  const purchaseRef = doc(db, MARKEPLTACE_COLLECTIONS.PURCHASES, `${user.uid}_${docId}`);
  const snap = await getDoc(purchaseRef);
  return snap.exists();
}

// --- User Service ---

export async function getProfile(uid: string) {
  const userRef = doc(db, MARKEPLTACE_COLLECTIONS.USERS, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function createProfile(uid: string, email: string, displayName: string) {
  const userRef = doc(db, MARKEPLTACE_COLLECTIONS.USERS, uid);
  const profile: UserProfile = {
    uid,
    email,
    displayName,
    isAdmin: email === 'tailieuhay53@gmail.com',
    purchasedDocs: [],
    createdAt: serverTimestamp() as unknown as Date
  };
  await setDoc(userRef, profile);
  
  // Increment global users count
  const statsRef = doc(db, MARKEPLTACE_COLLECTIONS.GLOBAL_STATS, 'main');
  await setDoc(statsRef, { totalUsers: increment(1) }, { merge: true });

  return profile;
}

export async function grantAccess(userId: string, documentId: string) {
  const purchaseId = `${userId}_${documentId}`;
  
  // 1. Mark request as approved if it exists
  const requestRef = doc(db, MARKEPLTACE_COLLECTIONS.REQUESTS, purchaseId);
  await setDoc(requestRef, { status: 'approved' }, { merge: true });

  const purchaseRef = doc(db, MARKEPLTACE_COLLECTIONS.PURCHASES, purchaseId);
  
  // Set purchase record
  await setDoc(purchaseRef, {
    userId: userId,
    documentId: documentId,
    pricePaid: 0, // Manual grant
    purchasedAt: serverTimestamp()
  });

  // Update user profile
  const userRef = doc(db, MARKEPLTACE_COLLECTIONS.USERS, userId);
  const profile = await getProfile(userId);
  if (profile) {
    await updateDoc(userRef, {
      purchasedDocs: (profile.purchasedDocs || []).concat(documentId)
    });
  }

  // Increment sales count (document)
  const docRef = doc(db, MARKEPLTACE_COLLECTIONS.DOCUMENTS, documentId);
  await updateDoc(docRef, {
    salesCount: increment(1)
  });

  // Increment global sales
  const statsRef = doc(db, MARKEPLTACE_COLLECTIONS.GLOBAL_STATS, 'main');
  await setDoc(statsRef, { totalSales: increment(1) }, { merge: true });
}

export async function rejectAccess(userId: string, documentId: string) {
  const requestId = `${userId}_${documentId}`;
  const requestRef = doc(db, MARKEPLTACE_COLLECTIONS.REQUESTS, requestId);
  await updateDoc(requestRef, { status: 'rejected' });
}

// --- Admin Service ---

export async function uploadDocument(data: Omit<Document, 'id' | 'createdAt' | 'salesCount'>, fileUrl: string) {
  const docRef = await addDoc(collection(db, MARKEPLTACE_COLLECTIONS.DOCUMENTS), {
    ...data,
    salesCount: 0,
    createdAt: serverTimestamp()
  });

  // Secure URL stored separately
  await setDoc(doc(db, MARKEPLTACE_COLLECTIONS.DOC_FILES, docRef.id), {
    fileUrl
  });

  // Increment global docs count
  const statsRef = doc(db, MARKEPLTACE_COLLECTIONS.GLOBAL_STATS, 'main');
  await setDoc(statsRef, { totalDocs: increment(1) }, { merge: true });

  return docRef.id;
}

export async function updateDocument(docId: string, data: Partial<Document>, fileUrl?: string) {
  const docRef = doc(db, MARKEPLTACE_COLLECTIONS.DOCUMENTS, docId);
  await updateDoc(docRef, data);

  if (fileUrl) {
    await setDoc(doc(db, MARKEPLTACE_COLLECTIONS.DOC_FILES, docId), { fileUrl }, { merge: true });
  }
}

export async function deleteDocument(docId: string) {
  await deleteDoc(doc(db, MARKEPLTACE_COLLECTIONS.DOCUMENTS, docId));
  await deleteDoc(doc(db, MARKEPLTACE_COLLECTIONS.DOC_FILES, docId));
}

export async function getDocumentFileUrl(docId: string) {
  const fileRef = doc(db, MARKEPLTACE_COLLECTIONS.DOC_FILES, docId);
  const snap = await getDoc(fileRef);
  if (!snap.exists()) return null;
  return snap.data().fileUrl as string;
}

export async function getPendingRequests(): Promise<AccessRequest[]> {
  const q = query(
    collection(db, MARKEPLTACE_COLLECTIONS.REQUESTS),
    where('status', '==', 'pending'),
    orderBy('requestedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessRequest));
}

export async function trackSiteVisit() {
  // Simple session-based tracking to avoid overcounting refreshes
  const sessionKey = 'site_visited_session';
  if (sessionStorage.getItem(sessionKey)) return;

  const statsRef = doc(db, MARKEPLTACE_COLLECTIONS.GLOBAL_STATS, 'main');
  try {
    await updateDoc(statsRef, {
      totalViews: increment(1)
    });
    sessionStorage.setItem(sessionKey, 'true');
  } catch {
    // If doc doesn't exist, create it
    await setDoc(statsRef, { totalViews: 1 }, { merge: true });
    sessionStorage.setItem(sessionKey, 'true');
  }
}

export async function getGlobalStats() {
  const globalSnap = await getDoc(doc(db, MARKEPLTACE_COLLECTIONS.GLOBAL_STATS, 'main'));
  
  if (!globalSnap.exists()) {
    return {
      totalDocs: 0,
      totalUsers: 0,
      totalSales: 0,
      totalViews: 0
    };
  }

  const data = globalSnap.data();
  return {
    totalDocs: data.totalDocs || 0,
    totalUsers: data.totalUsers || 0,
    totalSales: data.totalSales || 0,
    totalViews: data.totalViews || 0
  };
}

export async function trackDownload(docId: string) {
  const statsRef = doc(db, MARKEPLTACE_COLLECTIONS.GLOBAL_STATS, 'main');
  const docRef = doc(db, MARKEPLTACE_COLLECTIONS.DOCUMENTS, docId);
  
  try {
    await Promise.all([
      updateDoc(statsRef, {
        totalSales: increment(1)
      }),
      updateDoc(docRef, {
        salesCount: increment(1)
      })
    ]);
  } catch {
    // Fallback if global doc doesn't exist
    await setDoc(statsRef, { totalSales: 1 }, { merge: true });
    await updateDoc(docRef, {
      salesCount: increment(1)
    });
  }
}
