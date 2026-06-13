// Phase 12.5B: Place Intelligence — PlaceGroup / PlaceCandidate Repository
// Firestore: memory_notes/{noteId}/place_groups/{placeGroupId}
//            memory_notes/{noteId}/place_groups/{placeGroupId}/candidates/{candidateId}

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/core/firebase/client';
import type { PlaceGroupDoc, PlaceCandidateDoc } from '@/features/map/types';

// ── 型エイリアス ─────────────────────────────────────────────────────────────

type PlaceGroupInput = Omit<PlaceGroupDoc, 'id' | 'createdAt' | 'updatedAt'>;
type PlaceGroupUpdate = Partial<Omit<PlaceGroupDoc, 'id' | 'noteId' | 'createdAt' | 'updatedAt'>>;

// ── Repository ────────────────────────────────────────────────────────────────

export const placeGroupRepository = {
  /**
   * ノートの PlaceGroup 一覧をリアルタイムで監視する。
   * Phase 12.5G-1: sortOrder → startAt → createdAt の優先順でソートする。
   * Firestore 複合インデックスを避けるため、クライアント側でソートする。
   */
  subscribePlaceGroupsByNoteId(
    noteId: string,
    onNext: (groups: PlaceGroupDoc[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!db) {
      onNext([]);
      return () => {};
    }
    const colRef = collection(db, 'memory_notes', noteId, 'place_groups');
    // createdAt でフェッチして後でクライアントソート
    const q = query(colRef, orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlaceGroupDoc));
        // sortOrder → startAt → createdAt の優先順でソート
        groups.sort((a, b) => {
          const orderA = a.sortOrder ?? Infinity;
          const orderB = b.sortOrder ?? Infinity;
          if (orderA !== orderB) return orderA - orderB;
          // startAt で比較
          const saA = a.startAt;
          const saB = b.startAt;
          const tA = saA && typeof (saA as { toMillis?: () => number }).toMillis === 'function'
            ? (saA as { toMillis: () => number }).toMillis()
            : null;
          const tB = saB && typeof (saB as { toMillis?: () => number }).toMillis === 'function'
            ? (saB as { toMillis: () => number }).toMillis()
            : null;
          if (tA !== null && tB !== null) return tA - tB;
          if (tA !== null) return -1;
          if (tB !== null) return 1;
          // createdAt で比較
          const caA = a.createdAt;
          const caB = b.createdAt;
          const ctA = caA && typeof (caA as { toMillis?: () => number }).toMillis === 'function'
            ? (caA as { toMillis: () => number }).toMillis()
            : 0;
          const ctB = caB && typeof (caB as { toMillis?: () => number }).toMillis === 'function'
            ? (caB as { toMillis: () => number }).toMillis()
            : 0;
          return ctA - ctB;
        });
        onNext(groups);
      },
      (err) => {
        onError?.(err);
      }
    );
  },

  /**
   * PlaceGroup を1件取得する。
   */
  async getPlaceGroupById(
    noteId: string,
    placeGroupId: string
  ): Promise<PlaceGroupDoc | null> {
    if (!db) return null;
    const ref = doc(db, 'memory_notes', noteId, 'place_groups', placeGroupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as PlaceGroupDoc;
  },

  /**
   * PlaceGroup に紐づく候補一覧を取得する（distanceMeters 昇順）。
   * Cloud Functions が candidates サブコレクションに書き込んだ後にクライアントが参照する。
   * confidence はユーザー向け順位付けには使わない（表示用の参考値）。
   */
  async getPlaceCandidatesByGroupId(
    noteId: string,
    placeGroupId: string
  ): Promise<PlaceCandidateDoc[]> {
    if (!db) return [];
    const colRef = collection(
      db,
      'memory_notes',
      noteId,
      'place_groups',
      placeGroupId,
      'candidates'
    );
    const q = query(colRef, orderBy('distanceMeters', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlaceCandidateDoc));
  },

  /**
   * PlaceGroup を新規作成する。
   * ID は Firestore が自動採番する。
   * 返り値は作成されたドキュメントの ID。
   */
  async createPlaceGroup(
    noteId: string,
    data: PlaceGroupInput
  ): Promise<string> {
    if (!db) throw new Error('Firestore not configured');
    const colRef = collection(db, 'memory_notes', noteId, 'place_groups');
    const docRef = await addDoc(colRef, {
      ...data,
      noteId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * PlaceGroup を部分更新する。
   * userConfirmed / selectedCandidateId / label / category 等の更新に使用する。
   */
  async updatePlaceGroup(
    noteId: string,
    placeGroupId: string,
    updates: PlaceGroupUpdate
  ): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const ref = doc(db, 'memory_notes', noteId, 'place_groups', placeGroupId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * PlaceGroup を1件削除する（candidates サブコレクションは含まない）。
   * candidates の削除は deletePlaceGroupsForNote または Cloud Functions で行う。
   */
  async deletePlaceGroup(noteId: string, placeGroupId: string): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const ref = doc(db, 'memory_notes', noteId, 'place_groups', placeGroupId);
    await deleteDoc(ref);
  },

  /**
   * ノートに紐づく PlaceGroup を全件削除する。
   * Phase 10 のノート削除連鎖（deleteNote）や Cloud Functions から呼び出す想定。
   *
   * 注意: candidates サブコレクションは Firestore クライアント SDK では
   * 再帰削除できない。candidates の削除は Cloud Functions Admin SDK で行うこと。
   * クライアントからは PlaceGroup ドキュメントのみ削除し、
   * 孤立した candidates は Cloud Functions のクリーンアップジョブで対処する。
   */
  async deletePlaceGroupsForNote(noteId: string): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const colRef = collection(db, 'memory_notes', noteId, 'place_groups');
    const snap = await getDocs(colRef);
    if (snap.empty) return;
    await Promise.all(
      snap.docs.map((d) =>
        deleteDoc(doc(db!, 'memory_notes', noteId, 'place_groups', d.id))
      )
    );
  },
};
