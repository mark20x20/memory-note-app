// UI-3A: usePlaceGroups — PlaceGroupDoc をリアルタイム購読する共通フック
// FlowsPanel / PlacesPanel / Flow Detail / Place Detail で使用する

import { useState, useEffect } from 'react';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import type { PlaceGroupDoc } from '@/features/map/types';

export interface UsePlaceGroupsResult {
  groups: PlaceGroupDoc[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * ノートの PlaceGroup 一覧をリアルタイムで購読するフック。
 * noteId が null の場合は groups=[] を返す。
 * 順序は placeGroupRepository 側で sortOrder → startAt → createdAt に従う。
 */
export function usePlaceGroups(noteId: string | null): UsePlaceGroupsResult {
  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!noteId) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsub = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (g) => {
        setGroups(g);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return unsub;
  }, [noteId]);

  return { groups, isLoading, error };
}
