import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  userCode?: string;
  accountId: string;
  accountCode?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (firebaseUser: User) => {
    try {
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      let profileSnap;
      try {
        profileSnap = await getDoc(profileRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'profiles/' + firebaseUser.uid);
        return;
      }

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        const accountRef = doc(db, 'accounts', data.account_id);
        let accountSnap;
        try {
          accountSnap = await getDoc(accountRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'accounts/' + data.account_id);
          return;
        }
        
        setUser({
          id: firebaseUser.uid,
          email: data.email,
          fullName: data.full_name,
          userCode: data.user_code,
          accountId: data.account_id,
          accountCode: accountSnap.exists() ? accountSnap.data().account_code : '',
        });
      } else {
        // First time login - create default account and profile
        const newAccountId = 'acc_' + Math.random().toString(36).substr(2, 9);
        const accountRef = doc(db, 'accounts', newAccountId);
        
        try {
          await setDoc(accountRef, {
            account_code: 'ACC-' + Math.floor(Math.random() * 100000),
            created_at: new Date().toISOString(),
            name: 'My Account',
            plan_type: 'premium',
            status: 'active',
            updated_at: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'accounts/' + newAccountId);
        }

        try {
          await setDoc(profileRef, {
            account_id: newAccountId,
            avatar_url: firebaseUser.photoURL || '',
            created_at: new Date().toISOString(),
            email: firebaseUser.email || '',
            full_name: firebaseUser.displayName || firebaseUser.email || 'User',
            updated_at: new Date().toISOString(),
            user_code: 'USR-' + Math.floor(Math.random() * 100000).toString() // Make sure it's string
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'profiles/' + firebaseUser.uid);
        }

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'User',
          accountId: newAccountId,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return {
    user,
    loading,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  };
};
