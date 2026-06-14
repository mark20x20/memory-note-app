// Phase 12.5H-7A: Premium Status Hook
//
// Firestore users/{uid}/entitlements/premium をリアルタイム監視し、
// isPremiumUser フラグを返す。
// - active === true かつ expiresAt が未来（または未設定）のとき isPremiumUser = true
// - Cloud Functions Admin SDK のみ entitlements に書き込める（Firestore Rules で保証）

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/core/firebase/client';

export type PremiumStatus = {
  isPremiumUser: boolean;
  loading: boolean;
};

export function usePremiumStatus(uid: string | null): PremiumStatus {
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) {
      setIsPremiumUser(false);
      setLoading(false);
      return;
    }

    const entitlementRef = doc(db, 'users', uid, 'entitlements', 'premium');

    const unsubscribe = onSnapshot(
      entitlementRef,
      (snap) => {
        if (!snap.exists()) {
          setIsPremiumUser(false);
        } else {
          const data = snap.data();
          const active = data?.active === true;
          const expiresAt = data?.expiresAt;
          const notExpired = !expiresAt || expiresAt.toDate() > new Date();
          setIsPremiumUser(active && notExpired);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[usePremiumStatus] onSnapshot error:', err);
        setIsPremiumUser(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { isPremiumUser, loading };
}
