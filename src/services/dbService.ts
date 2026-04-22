import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, EditedImage } from '../types';

export const saveUserProfile = async (profile: UserProfile) => {
  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, {
    ...profile,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() as UserProfile : null;
};

export const saveEditedImage = async (image: Omit<EditedImage, 'id' | 'createdAt'>) => {
  const imagesRef = collection(db, 'images');
  await addDoc(imagesRef, {
    ...image,
    createdAt: new Date().toISOString()
  });
};

export const getUserImageHistory = async (userId: string): Promise<EditedImage[]> => {
  const imagesRef = collection(db, 'images');
  const q = query(
    imagesRef, 
    where('userId', '==', userId), 
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as EditedImage));
};
