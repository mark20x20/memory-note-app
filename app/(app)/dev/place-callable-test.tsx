// Phase 12.5C: 開発用 Place Callable テスト画面
// __DEV__ 時のみ設定画面からアクセスできる。本番 UI は Phase 12.5E で実装する。

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import type { PlaceGroupDoc, PlaceCandidateDoc } from '@/features/map/types';
import {
  enrichNotePlacesCallable,
  getPlaceCandidatesForGroupCallable,
  refreshPlaceCandidatesCallable,
  selectPlaceCandidateCallable,
  type EnrichNotePlacesResult,
  type CallableError,
} from '@/features/placeIntelligence/api/placeFunctionsClient';
import type { Unsubscribe } from 'firebase/firestore';

// ── 型 ───────────────────────────────────────────────────────────────────────

type GroupWithCandidates = {
  group: PlaceGroupDoc;
  candidates: PlaceCandidateDoc[];
  candidatesLoading: boolean;
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PlaceCallableTestScreen() {
  const [noteId, setNoteId] = useState('');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichNotePlacesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupWithCandidates[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // PlaceGroups の Firestore リアルタイム監視
  useEffect(() => {
    if (!noteId.trim()) {
      setGroups([]);
      return;
    }

    setGroupsLoading(true);
    const unsubscribe: Unsubscribe = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId.trim(),
      (incoming) => {
        setGroupsLoading(false);
        setGroups(incoming.map((g) => ({ group: g, candidates: [], candidatesLoading: false })));
      },
      (err) => {
        setGroupsLoading(false);
        console.warn('[PlaceCallableTest] subscribePlaceGroupsByNoteId error:', err.message);
      }
    );

    return () => unsubscribe();
  }, [noteId]);

  // enrichNotePlaces 実行
  const handleEnrich = useCallback(async () => {
    const id = noteId.trim();
    if (!id) {
      Alert.alert('入力エラー', 'noteId を入力してください');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await enrichNotePlacesCallable({ noteId: id, forceRefresh });
      setResult(res);
    } catch (err) {
      const e = err as CallableError;
      setError(`[${e.code}] ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [noteId, forceRefresh]);

  // candidates 読み込み
  const loadCandidates = useCallback(async (index: number, groupId: string) => {
    const id = noteId.trim();
    if (!id) return;

    setGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, candidatesLoading: true } : g))
    );
    try {
      const candidates = await placeGroupRepository.getPlaceCandidatesByGroupId(id, groupId);
      setGroups((prev) =>
        prev.map((g, i) =>
          i === index ? { ...g, candidates, candidatesLoading: false } : g
        )
      );
    } catch (err) {
      console.warn('[PlaceCallableTest] getPlaceCandidatesByGroupId error:', err);
      setGroups((prev) =>
        prev.map((g, i) => (i === index ? { ...g, candidatesLoading: false } : g))
      );
    }
  }, [noteId]);

  // getPlaceCandidatesForGroup callable
  const handleGetCandidates = useCallback(async (groupId: string) => {
    const id = noteId.trim();
    if (!id) return;
    try {
      const res = await getPlaceCandidatesForGroupCallable({ noteId: id, placeGroupId: groupId });
      Alert.alert(
        'getPlaceCandidatesForGroup',
        `cacheHit: ${res.cacheHit}\ncandidates: ${res.candidates.length}件`
      );
    } catch (err) {
      const e = err as CallableError;
      Alert.alert('エラー', `[${e.code}] ${e.message}`);
    }
  }, [noteId]);

  // refreshPlaceCandidates callable
  const handleRefresh = useCallback(async (groupId: string) => {
    const id = noteId.trim();
    if (!id) return;
    try {
      const res = await refreshPlaceCandidatesCallable({ noteId: id, placeGroupId: groupId });
      Alert.alert('refreshPlaceCandidates', `${res.candidatesCount}件更新\n${res.refreshedAt}`);
    } catch (err) {
      const e = err as CallableError;
      Alert.alert('エラー', `[${e.code}] ${e.message}`);
    }
  }, [noteId]);

  // selectPlaceCandidate callable
  const handleSelectCandidate = useCallback(
    async (groupId: string, candidateId: string) => {
      const id = noteId.trim();
      if (!id) return;
      try {
        const res = await selectPlaceCandidateCallable({
          noteId: id,
          placeGroupId: groupId,
          candidateId,
        });
        Alert.alert(
          'selectPlaceCandidate',
          `label: ${res.updatedLabel}\ncategory: ${res.updatedCategory}`
        );
      } catch (err) {
        const e = err as CallableError;
        Alert.alert('エラー', `[${e.code}] ${e.message}`);
      }
    },
    [noteId]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Place Callable Test [DEV]" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Input Section ───────────────────────────────────────── */}
        <Section title="1. noteId を入力">
          <TextInput
            style={styles.input}
            placeholder="noteId を貼り付け"
            placeholderTextColor={colors.textTertiary}
            value={noteId}
            onChangeText={setNoteId}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Row label="forceRefresh">
            <Switch
              value={forceRefresh}
              onValueChange={setForceRefresh}
              trackColor={{ true: colors.primary }}
            />
          </Row>
        </Section>

        {/* ── enrichNotePlaces ────────────────────────────────────── */}
        <Section title="2. enrichNotePlaces">
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleEnrich}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>enrichNotePlaces 実行</Text>
            )}
          </TouchableOpacity>

          {error !== null && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {result !== null && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>結果:</Text>
              <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
            </View>
          )}
        </Section>

        {/* ── PlaceGroups (Firestore) ──────────────────────────────── */}
        <Section title="3. PlaceGroups (Firestore)">
          {groupsLoading && (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
          )}
          {!groupsLoading && groups.length === 0 && noteId.trim() !== '' && (
            <Text style={styles.emptyText}>place_groups がありません</Text>
          )}
          {groups.map((item, index) => (
            <PlaceGroupCard
              key={item.group.id}
              item={item}
              index={index}
              onLoadCandidates={() => loadCandidates(index, item.group.id)}
              onGetCandidates={() => handleGetCandidates(item.group.id)}
              onRefresh={() => handleRefresh(item.group.id)}
              onSelectCandidate={(candidateId) =>
                handleSelectCandidate(item.group.id, candidateId)
              }
            />
          ))}
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── PlaceGroupCard ────────────────────────────────────────────────────────────

type PlaceGroupCardProps = {
  item: GroupWithCandidates;
  index: number;
  onLoadCandidates: () => void;
  onGetCandidates: () => void;
  onRefresh: () => void;
  onSelectCandidate: (candidateId: string) => void;
};

function PlaceGroupCard({
  item,
  index,
  onLoadCandidates,
  onGetCandidates,
  onRefresh,
  onSelectCandidate,
}: PlaceGroupCardProps) {
  const { group, candidates, candidatesLoading } = item;

  return (
    <View style={styles.groupCard}>
      <Text style={styles.groupTitle}>
        PlaceGroup {index + 1}: {group.label}
      </Text>
      <InfoRow label="category" value={group.category} />
      <InfoRow label="confidence" value={group.confidence.toFixed(2)} />
      <InfoRow label="userConfirmed" value={String(group.userConfirmed)} />
      <InfoRow label="photoCount" value={String(group.photoCount)} />
      <InfoRow label="source" value={group.source} />
      <InfoRow label="id" value={group.id} />

      {/* Callable buttons */}
      <View style={styles.groupActions}>
        <SmallButton label="候補取得" onPress={onGetCandidates} />
        <SmallButton label="強制更新" onPress={onRefresh} color={colors.warning} />
        <SmallButton label="Firestore候補" onPress={onLoadCandidates} color={colors.info} />
      </View>

      {/* Candidates */}
      {candidatesLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
      )}
      {candidates.length > 0 && (
        <View style={styles.candidatesSection}>
          <Text style={styles.candidatesTitle}>Candidates ({candidates.length}件, 距離順)</Text>
          {candidates.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              onSelect={() => onSelectCandidate(c.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ── CandidateRow ──────────────────────────────────────────────────────────────

function CandidateRow({
  candidate,
  onSelect,
}: {
  candidate: PlaceCandidateDoc;
  onSelect: () => void;
}) {
  return (
    <View style={styles.candidateRow}>
      <Text style={styles.candidateName}>{candidate.name}</Text>
      {/* distanceMeters 昇順（近い順）— confidence はユーザー向け順位付けに使わない */}
      <InfoRow label="距離 (m)" value={candidate.distanceMeters != null ? String(Math.round(candidate.distanceMeters)) : '-'} />
      <InfoRow label="rating" value={String(candidate.rating ?? '-')} />
      <InfoRow label="confidence (参考)" value={(candidate.confidence ?? 0).toFixed(2)} />
      <SmallButton label="selectPlaceCandidate" onPress={onSelect} />
    </View>
  );
}

// ── 共通部品 ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SmallButton({
  label,
  onPress,
  color = colors.primary,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.smallButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.smallButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  resultBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  resultJson: {
    fontSize: 12,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: 12,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  groupActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    width: 110,
  },
  infoValue: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: 'monospace',
  },
  candidatesSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  candidatesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  candidateRow: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  smallButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  smallButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
