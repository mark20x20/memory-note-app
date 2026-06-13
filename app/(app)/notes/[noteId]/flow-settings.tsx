// Phase 12.5G-3: フロー分割設定画面
// Route: /(app)/notes/[noteId]/flow-settings
//
// 写真の撮影時間がどのくらい空いたら別フローに分けるかをユーザーが設定できる。
// 10分単位のステッパーと3つのプリセットボタンを提供する。
// 「この設定で再推定」で enrichNotePlaces を forceRefresh: true で呼ぶ。

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { enrichNotePlacesCallable } from '@/features/placeIntelligence/api/placeFunctionsClient';

// ── 定数 ─────────────────────────────────────────────────────────────────────

const MIN_MINUTES = 10;
const MAX_MINUTES = 360;
const STEP_MINUTES = 10;

type Preset = { label: string; minutes: number; desc: string };

const PRESETS: Preset[] = [
  { label: '細かく', minutes: 30,  desc: '30分' },
  { label: '標準',   minutes: 90,  desc: '90分' },
  { label: 'ゆったり', minutes: 180, desc: '180分' },
];

function getDistanceForTimeGap(minutes: number): number {
  if (minutes <= 30) return 50;
  if (minutes <= 90) return 80;
  return 120;
}

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function FlowSettingsScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const [timeGapMinutes, setTimeGapMinutes] = useState(90);
  const [running, setRunning] = useState(false);

  function clamp(v: number): number {
    return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, v));
  }

  function applyPreset(minutes: number) {
    setTimeGapMinutes(minutes);
  }

  async function handleReestimate() {
    if (!noteId) return;
    setRunning(true);
    try {
      const distanceGapMeters = getDistanceForTimeGap(timeGapMinutes);
      await enrichNotePlacesCallable({
        noteId,
        forceRefresh: true,
        grouping: { timeGapMinutes, distanceGapMeters },
      });
      Alert.alert(
        '再推定完了',
        `${timeGapMinutes}分間隔でフローを分割しました。`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : '再推定に失敗しました';
      Alert.alert('エラー', msg);
    } finally {
      setRunning(false);
    }
  }

  const activePreset = PRESETS.find((p) => p.minutes === timeGapMinutes) ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="フロー分割設定" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 説明 ── */}
        <View style={styles.section}>
          <Text style={styles.descTitle}>フロー分割設定</Text>
          <Text style={styles.descBody}>
            写真の撮影時間がどのくらい空いたら、別の流れとして分けるかを設定します。
            旅行・食事・散歩など、シーンに合わせて調整できます。
          </Text>
        </View>

        {/* ── 時間間隔ステッパー ── */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>時間間隔（10分単位）</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepperButton, timeGapMinutes <= MIN_MINUTES && styles.stepperButtonDisabled]}
              onPress={() => setTimeGapMinutes(clamp(timeGapMinutes - STEP_MINUTES))}
              disabled={timeGapMinutes <= MIN_MINUTES}
              activeOpacity={0.7}
            >
              <Text style={[styles.stepperButtonText, timeGapMinutes <= MIN_MINUTES && styles.stepperButtonTextDisabled]}>
                −
              </Text>
            </TouchableOpacity>

            <View style={styles.stepperValue}>
              <Text style={styles.stepperValueNumber}>{timeGapMinutes}</Text>
              <Text style={styles.stepperValueUnit}>分</Text>
            </View>

            <TouchableOpacity
              style={[styles.stepperButton, timeGapMinutes >= MAX_MINUTES && styles.stepperButtonDisabled]}
              onPress={() => setTimeGapMinutes(clamp(timeGapMinutes + STEP_MINUTES))}
              disabled={timeGapMinutes >= MAX_MINUTES}
              activeOpacity={0.7}
            >
              <Text style={[styles.stepperButtonText, timeGapMinutes >= MAX_MINUTES && styles.stepperButtonTextDisabled]}>
                ＋
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.stepperHint}>
            {timeGapMinutes}分以上間隔が空いた写真を別のフローに分けます
          </Text>
        </View>

        {/* ── プリセット ── */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>プリセット</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((p) => {
              const selected = activePreset?.minutes === p.minutes;
              return (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.presetChip, selected && styles.presetChipSelected]}
                  onPress={() => applyPreset(p.minutes)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetLabel, selected && styles.presetLabelSelected]}>
                    {p.label}
                  </Text>
                  <Text style={[styles.presetDesc, selected && styles.presetDescSelected]}>
                    {p.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 補足説明 ── */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>距離間隔について</Text>
            <Text style={styles.infoBody}>
              距離間隔は時間間隔に連動して自動設定されます。
              {'\n'}細かく: 50m / 標準: 80m / ゆったり: 120m
            </Text>
          </View>
        </View>

        {/* ── 再推定ボタン ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.primaryButton, running && styles.primaryButtonDisabled]}
            onPress={handleReestimate}
            disabled={running}
          >
            {running ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>この設定で再推定</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.warningText}>
            ※ 再推定すると既存のフロー分割がリセットされます
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 48,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  // 説明
  descTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  descBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // フィールドラベル
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  // ステッパー
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepperButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceIvory,
  },
  stepperButtonText: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.mapAccent,
    lineHeight: 26,
  },
  stepperButtonTextDisabled: {
    color: colors.textTertiary,
  },
  stepperValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    minWidth: 80,
    justifyContent: 'center',
  },
  stepperValueNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepperValueUnit: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  stepperHint: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  // プリセット
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: colors.surface,
    gap: 2,
  },
  presetChipSelected: {
    borderColor: colors.mapAccent,
    backgroundColor: colors.mapAccentLight,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetLabelSelected: {
    color: colors.mapAccent,
  },
  presetDesc: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  presetDescSelected: {
    color: colors.mapAccent,
  },
  // 補足カード
  infoCard: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoBody: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  // ボタン
  primaryButton: {
    backgroundColor: colors.mapAccent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  warningText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
