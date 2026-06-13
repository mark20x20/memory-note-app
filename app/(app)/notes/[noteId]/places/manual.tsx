// Phase 12.5E: 手動場所入力画面
// Phase 12.5E-2: 遷移元は必ず places/[placeGroupId] からのみ（placeGroupId なし不可）
// Route: /(app)/notes/[noteId]/places/manual?placeGroupId=xxx
//
// 候補に適切な場所がない場合に、ユーザーが任意の場所名とカテゴリを入力する。
// updatePlaceGroupManually callable を使って保存する。
// placeGroupId が指定された場合は既存グループを更新する。

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { updatePlaceGroupManuallyCallable } from '@/features/placeIntelligence/api/placeFunctionsClient';
import type { PlaceCategory } from '@/features/map/types';

// ── カテゴリ定義 ──────────────────────────────────────────────────────────────

type CategoryOption = {
  value: PlaceCategory;
  label: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'restaurant', label: 'レストラン' },
  { value: 'cafe', label: 'カフェ' },
  { value: 'tourist_attraction', label: '観光地' },
  { value: 'station', label: '駅' },
  { value: 'hotel', label: 'ホテル' },
  { value: 'shopping', label: 'ショッピング' },
  { value: 'park', label: '公園' },
  { value: 'museum', label: '美術館・博物館' },
  { value: 'area', label: 'エリア' },
  { value: 'unknown', label: 'その他' },
];

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function ManualPlaceScreen() {
  const { noteId, placeGroupId } = useLocalSearchParams<{
    noteId: string;
    placeGroupId?: string;
  }>();

  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('unknown');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = label.trim();
    if (!trimmed) {
      Alert.alert('入力エラー', '場所名を入力してください。');
      return;
    }
    if (!noteId || !placeGroupId) {
      Alert.alert('エラー', '保存先の場所グループが指定されていません。');
      return;
    }

    setSaving(true);
    try {
      await updatePlaceGroupManuallyCallable({
        noteId,
        placeGroupId,
        label: trimmed,
        category,
      });
      Alert.alert('保存しました', `「${trimmed}」を訪れた場所として保存しました。`, [
        {
          text: 'OK',
          onPress: () => {
            // places一覧に戻る
            router.dismiss(2);
          },
        },
      ]);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : '保存に失敗しました';
      Alert.alert('エラー', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="場所を手動入力" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── 説明 ── */}
        <View style={styles.section}>
          <Text style={styles.descText}>
            候補に正しい場所がない場合は、場所名を直接入力してください。
          </Text>
        </View>

        {/* ── 場所名入力 ── */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>場所名</Text>
          <TextInput
            style={styles.textInput}
            placeholder="例: 自由が丘のカフェ"
            placeholderTextColor={colors.textTertiary}
            value={label}
            onChangeText={setLabel}
            autoFocus
            returnKeyType="done"
            maxLength={100}
          />
          <Text style={styles.charCount}>{label.length} / 100</Text>
        </View>

        {/* ── カテゴリ選択 ── */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>カテゴリ</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.categoryChip,
                  category === opt.value && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(opt.value)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === opt.value && styles.categoryChipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 保存ボタン ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>保存する</Text>
            )}
          </TouchableOpacity>
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
  descText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // フィールド
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  charCount: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  // カテゴリ
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  categoryChipSelected: {
    borderColor: colors.mapAccent,
    backgroundColor: colors.mapAccentLight,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: colors.mapAccent,
    fontWeight: '600',
  },
  // 保存ボタン
  saveButton: {
    backgroundColor: colors.mapAccent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
