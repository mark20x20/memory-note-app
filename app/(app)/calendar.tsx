// UI-24: Calendar Screen Polish
// 日付から思い出を振り返る画面。
// カレンダーはカスタムグリッドで実装（外部ライブラリ不要）。
// ノートの日付は createdAt を使用（NoteDoc に memoryDate フィールドなし）。
// 既存の useMemoryNotesList / NoteDoc を使用。

import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { useMemoryNotesList } from '@/features/memoryNotes/hooks/useMemoryNotesList';
import { getMemoryDate, toLocalDateKey } from '@/features/memoryNotes/utils/noteDate';
import type { NoteDoc } from '@/core/repositories/noteRepository';

// ── 定数 ──────────────────────────────────────────────────────────────────────

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// ── ヘルパー関数 ───────────────────────────────────────────────────────────────

/**
 * UI-26: memoryDate 優先で日付キーを生成する。
 * 既存ノートは memoryDate がないため createdAt fallback で表示する。
 * 優先順位: memoryDate > createdAt > updatedAt
 */
function noteToDateKey(note: NoteDoc): string | null {
  const date = getMemoryDate(note);
  if (!date) return null;
  return toLocalDateKey(date);
}

/** 月の最初の日の曜日インデックス (0=日) と日数を返す */
function getMonthMeta(year: number, month: number): { firstDay: number; daysInMonth: number } {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

function formatSelectedDateLabel(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dow = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${y}年${m}月${d}日（${dow}）`;
}

// ── メインコンポーネント ──────────────────────────────────────────────────────

export default function CalendarScreen() {
  const today = new Date();
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const { notes, isLoading, error } = useMemoryNotesList();

  // ノートを dateKey でグループ化
  const notesByDate = useMemo(() => {
    const map = new Map<string, NoteDoc[]>();
    for (const note of notes) {
      const key = noteToDateKey(note);
      if (!key) continue;
      const existing = map.get(key) ?? [];
      existing.push(note);
      map.set(key, existing);
    }
    return map;
  }, [notes]);

  // 選択日のノート
  const selectedDateKey = toLocalDateKey(selectedDate);
  const selectedNotes = notesByDate.get(selectedDateKey) ?? [];

  // 今日の dateKey
  const todayKey = toLocalDateKey(today);

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayYear((y) => y - 1);
      setDisplayMonth(11);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayYear((y) => y + 1);
      setDisplayMonth(0);
    } else {
      setDisplayMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setDisplayYear(today.getFullYear());
    setDisplayMonth(today.getMonth());
    setSelectedDate(today);
  };

  const handleSelectDate = (day: number) => {
    setSelectedDate(new Date(displayYear, displayMonth, day));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* カスタムヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>カレンダー</Text>
          <Text style={styles.headerSubtitle}>日付から思い出を振り返る</Text>
        </View>
        <TouchableOpacity style={styles.todayButton} onPress={handleToday} hitSlop={8}>
          <Text style={styles.todayButtonText}>今日</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>読み込みに失敗しました</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* カレンダーカード */}
          <View style={styles.calendarCard}>
            {/* 月ナビゲーション */}
            <View style={styles.monthNav}>
              <TouchableOpacity style={styles.monthArrow} onPress={handlePrevMonth} hitSlop={8}>
                <Text style={styles.monthArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{formatMonthLabel(displayYear, displayMonth)}</Text>
              <TouchableOpacity style={styles.monthArrow} onPress={handleNextMonth} hitSlop={8}>
                <Text style={styles.monthArrowText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* 曜日ヘッダー */}
            <View style={styles.dayHeaders}>
              {DAY_LABELS.map((label, i) => (
                <View key={label} style={styles.dayHeaderCell}>
                  <Text style={[
                    styles.dayHeaderText,
                    i === 0 && styles.dayHeaderSun,
                    i === 6 && styles.dayHeaderSat,
                  ]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {/* 日付グリッド */}
            <CalendarGrid
              year={displayYear}
              month={displayMonth}
              todayKey={todayKey}
              selectedDateKey={selectedDateKey}
              notesByDate={notesByDate}
              onSelectDate={handleSelectDate}
            />
          </View>

          {/* 選択日サマリー */}
          <View style={styles.dateSummary}>
            <Text style={styles.dateSummaryLabel}>{formatSelectedDateLabel(selectedDate)}</Text>
            {selectedNotes.length > 0 ? (
              <Text style={styles.dateSummaryCount}>
                この日に {selectedNotes.length} 件の思い出
              </Text>
            ) : (
              <Text style={styles.dateSummaryEmpty}>この日にはまだ思い出がありません</Text>
            )}
          </View>

          {/* この日の思い出カード */}
          {selectedNotes.length > 0 ? (
            <View style={styles.noteList}>
              <Text style={styles.sectionLabel}>この日の思い出</Text>
              {selectedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onPress={() => router.push(`/(app)/notes/${note.id}/preview` as any)}
                />
              ))}
            </View>
          ) : (
            <EmptyDayState selectedDate={selectedDate} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── CalendarGrid ──────────────────────────────────────────────────────────────

type CalendarGridProps = {
  year: number;
  month: number;
  todayKey: string;
  selectedDateKey: string;
  notesByDate: Map<string, NoteDoc[]>;
  onSelectDate: (day: number) => void;
};

function CalendarGrid({
  year,
  month,
  todayKey,
  selectedDateKey,
  notesByDate,
  onSelectDate,
}: CalendarGridProps) {
  const { firstDay, daysInMonth } = getMonthMeta(year, month);

  // グリッドセル: 前月の空白 + 今月の日付
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // 7列に揃えるため末尾を補完
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.grid}>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.gridRow}>
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} style={styles.gridCell} />;
            }
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDateKey;
            const hasNotes = (notesByDate.get(dateKey)?.length ?? 0) > 0;
            const noteCount = notesByDate.get(dateKey)?.length ?? 0;
            const isSunday = di === 0;
            const isSaturday = di === 6;

            return (
              <TouchableOpacity
                key={di}
                style={styles.gridCell}
                onPress={() => onSelectDate(day)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.dayCircle,
                  isSelected && styles.dayCircleSelected,
                  isToday && !isSelected && styles.dayCircleToday,
                ]}>
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    isToday && !isSelected && styles.dayNumberToday,
                    isSunday && !isSelected && styles.dayNumberSun,
                    isSaturday && !isSelected && styles.dayNumberSat,
                  ]}>
                    {day}
                  </Text>
                </View>
                {hasNotes ? (
                  <View style={styles.dotRow}>
                    {noteCount >= 2 ? (
                      <>
                        <View style={[styles.dot, isSelected && styles.dotSelected]} />
                        <View style={[styles.dot, isSelected && styles.dotSelected]} />
                      </>
                    ) : (
                      <View style={[styles.dot, isSelected && styles.dotSelected]} />
                    )}
                  </View>
                ) : (
                  <View style={styles.dotRow} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ── NoteCard ──────────────────────────────────────────────────────────────────

type NoteCardProps = {
  note: NoteDoc;
  onPress: () => void;
};

function NoteCard({ note, onPress }: NoteCardProps) {
  const title = note.title?.trim() || '無題の思い出';
  const isShared = note.noteType === 'shared';
  const topPlace = note.visitedPlacesSummary?.topPlaceLabels?.[0] ?? null;
  const photoCount = note.photoCount ?? 0;

  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.88}>
      {/* カバー写真エリア */}
      {note.coverPhotoURL ? (
        <Image
          source={{ uri: note.coverPhotoURL }}
          style={styles.noteCover}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noteCoverPlaceholder}>
          <Text style={styles.noteCoverEmoji}>📷</Text>
        </View>
      )}

      {/* 共有バッジ */}
      {isShared ? (
        <View style={styles.sharedBadge}>
          <Text style={styles.sharedBadgeText}>👥 共有</Text>
        </View>
      ) : null}

      {/* カード下部情報 */}
      <View style={styles.noteCardBody}>
        <Text style={styles.noteCardTitle} numberOfLines={2}>{title}</Text>

        <View style={styles.noteCardMeta}>
          {topPlace ? (
            <View style={styles.placeChip}>
              <Text style={styles.placeChipText} numberOfLines={1}>📍 {topPlace}</Text>
            </View>
          ) : null}
          {photoCount > 0 ? (
            <Text style={styles.photoCountText}>📷 {photoCount}枚</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── EmptyDayState ─────────────────────────────────────────────────────────────

function EmptyDayState({ selectedDate }: { selectedDate: Date }) {
  const isToday =
    selectedDate.toDateString() === new Date().toDateString();

  return (
    <View style={styles.emptyDay}>
      <Text style={styles.emptyDayEmoji}>📅</Text>
      <Text style={styles.emptyDayTitle}>
        {isToday ? 'まだ今日の思い出はありません' : 'この日の思い出はまだありません'}
      </Text>
      <Text style={styles.emptyDayDesc}>
        別の日を選ぶか、新しい思い出を作れます
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(app)/create')}
        activeOpacity={0.85}
      >
        <Text style={styles.createButtonText}>📷　思い出ノートを作る</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Custom header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 26,
    lineHeight: 30,
    color: colors.textPrimary,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  todayButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  // Loading / Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  scroll: {
    paddingBottom: 48,
  },

  // Calendar card
  calendarCard: {
    margin: 20,
    marginBottom: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Month navigation
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {
    fontSize: 22,
    lineHeight: 26,
    color: colors.textPrimary,
    fontWeight: '300',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Day headers
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  dayHeaderSun: {
    color: '#F26B5B80',
  },
  dayHeaderSat: {
    color: '#4FA8A180',
  },

  // Grid
  grid: {
    gap: 2,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayNumberSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayNumberSun: {
    color: colors.primary + 'CC',
  },
  dayNumberSat: {
    color: colors.mapAccent + 'CC',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  dotSelected: {
    backgroundColor: colors.textInverse,
    opacity: 0.9,
  },

  // Date summary
  dateSummary: {
    marginTop: 20,
    marginHorizontal: 20,
    paddingBottom: 4,
    gap: 4,
  },
  dateSummaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  dateSummaryCount: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  dateSummaryEmpty: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Note list
  noteList: {
    marginTop: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  // Note card
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteCover: {
    width: '100%',
    height: 140,
    backgroundColor: colors.surfaceIvory,
  },
  noteCoverPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCoverEmoji: {
    fontSize: 32,
    opacity: 0.3,
  },
  sharedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.mapAccent + 'EE',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sharedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textInverse,
  },
  noteCardBody: {
    padding: 14,
    gap: 8,
  },
  noteCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  noteCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  placeChip: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 200,
  },
  placeChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mapAccent,
  },
  photoCountText: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Empty day state
  emptyDay: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyDayEmoji: {
    fontSize: 36,
    opacity: 0.35,
    marginBottom: 4,
  },
  emptyDayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyDayDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 20,
    paddingVertical: 11,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
