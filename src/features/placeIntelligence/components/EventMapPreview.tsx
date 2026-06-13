// Phase 12.5G-3: 訪問イベント地図 — ノート詳細の地図セクション用コンポーネント
//
// PlaceGroupDoc の位置情報を使い、訪問イベントピンを地図上に表示する。
// PlaceGroup がない場合は photoLocations を使う（Phase 8 MapPreview と同等）。

import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { router } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import type { PlaceGroupDoc, PhotoLocation } from '@/features/map/types';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';

// ── 型 ─────────────────────────────────────────────────────────────────────────

type Props = {
  noteId: string;
  /** フォールバック用の写真位置情報（PlaceGroup がない場合に使う） */
  photoLocations?: PhotoLocation[];
  height?: number;
};

// ── ヘルパー ──────────────────────────────────────────────────────────────────

const DEFAULT_DELTA = 0.02;

function calcRegion(
  locs: { latitude: number; longitude: number }[]
): Region | null {
  if (locs.length === 0) return null;
  const lats = locs.map((l) => l.latitude);
  const lngs = locs.map((l) => l.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.5, DEFAULT_DELTA / 2);
  const padLng = Math.max((maxLng - minLng) * 0.5, DEFAULT_DELTA / 2);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: maxLat - minLat + padLat,
    longitudeDelta: maxLng - minLng + padLng,
  };
}

/** 訪問イベント番号ピン */
function EventPinView({ number, confirmed }: { number: number; confirmed: boolean }) {
  return (
    <View style={pinStyles.wrapper}>
      <View style={[pinStyles.badge, confirmed ? pinStyles.badgeConfirmed : pinStyles.badgePending]}>
        <Text style={[pinStyles.text, confirmed ? pinStyles.textConfirmed : pinStyles.textPending]}>
          #{number}
        </Text>
      </View>
      <View style={[pinStyles.stem, confirmed ? pinStyles.stemConfirmed : pinStyles.stemPending]} />
    </View>
  );
}

const BADGE_W = 28;
const BADGE_H = 22;
const STEM_H = 6;

const pinStyles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  badge: {
    width: BADGE_W,
    height: BADGE_H,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeConfirmed: {
    backgroundColor: colors.mapAccent,
  },
  badgePending: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
  },
  text: { fontSize: 10, fontWeight: '700' },
  textConfirmed: { color: colors.white },
  textPending: { color: colors.mapAccent },
  stem: {
    width: 0,
    height: 0,
    borderLeftWidth: STEM_H / 2,
    borderRightWidth: STEM_H / 2,
    borderTopWidth: STEM_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  stemConfirmed: { borderTopColor: colors.mapAccent },
  stemPending: { borderTopColor: colors.mapAccent },
});

// ── コンポーネント ────────────────────────────────────────────────────────────

export function EventMapPreview({ noteId, photoLocations = [], height = 180 }: Props) {
  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubRef.current = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (next) => setGroups(next),
      () => {}
    );
    return () => unsubRef.current?.();
  }, [noteId]);

  // PlaceGroup があればそれを使い、なければ写真位置情報を使う
  const useGroups = groups.length > 0;
  const locs = useGroups
    ? groups.map((g) => ({ latitude: g.latitude, longitude: g.longitude }))
    : photoLocations.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  const region = calcRegion(locs);

  if (!region) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>位置情報がありません</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.mapContainer, { height }]}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          showsUserLocation={false}
          showsCompass={false}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {useGroups
            ? groups.map((g, idx) => (
                <Marker
                  key={g.id}
                  coordinate={{ latitude: g.latitude, longitude: g.longitude }}
                  title={`#${idx + 1} ${g.label}`}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <EventPinView number={idx + 1} confirmed={g.userConfirmed} />
                </Marker>
              ))
            : photoLocations.map((p) => (
                <Marker
                  key={p.photoId}
                  coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                  pinColor={colors.mapAccent}
                />
              ))}
        </MapView>
      </View>

      {/* 「地図で見る」リンク */}
      <TouchableOpacity
        style={styles.mapLink}
        onPress={() => router.push(`/(app)/notes/${noteId}/map`)}
      >
        <Text style={styles.mapLinkText}>地図で見る</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  mapContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mapAccentLight,
  },
  placeholder: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mapAccentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: colors.mapAccent,
  },
  mapLink: {
    alignSelf: 'flex-end',
  },
  mapLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
  },
});
