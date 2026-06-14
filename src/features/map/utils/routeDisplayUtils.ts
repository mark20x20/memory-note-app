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
