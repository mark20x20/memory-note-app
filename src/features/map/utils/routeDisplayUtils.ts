// Phase 12.5H-1: Route Plan Mode — ルート表示ユーティリティ

import type { PremiumRouteTravelMode } from '../types';

/**
 * 移動手段の表示ラベルを返す。
 */
export function getTravelModeLabel(mode: PremiumRouteTravelMode): string {
  switch (mode) {
    case 'walking':
      return '徒歩';
    case 'driving':
      return '車';
    case 'transit':
      return '公共交通';
  }
}

/**
 * プレミアムルートの機能説明を返す。
 * Map画面のPremium案内カードで使用する。
 */
export function getPremiumRouteDescription(mode: PremiumRouteTravelMode): string {
  switch (mode) {
    case 'walking':
      return '徒歩での移動時間や距離を記録できます。';
    case 'driving':
      return '車での移動時間や距離を記録できます。';
    case 'transit':
      return '電車やバスなどの移動ルートを記録できます。';
  }
}

/**
 * 移動時間（秒）を "X分" / "X時間Y分" 形式にフォーマットする。
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

/**
 * 距離（メートル）を "Xm" / "X.Xkm" 形式にフォーマットする。
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 移動手段に対応するPolyline色を返す。
 * - walking: teal (#4FA8A1)
 * - driving: blue (#5B8DD9)
 * - transit: orange (#D97B4F)
 */
export function getRouteColor(mode: PremiumRouteTravelMode): string {
  switch (mode) {
    case 'walking':
      return '#4FA8A1';
    case 'driving':
      return '#5B8DD9';
    case 'transit':
      return '#D97B4F';
  }
}
