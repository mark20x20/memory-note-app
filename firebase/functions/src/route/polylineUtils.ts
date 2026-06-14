// Phase 12.5H-3: Google Encoded Polyline Algorithm — decode utility
//
// 外部パッケージ（@googlemaps/polyline-codec）の追加を避けるため、
// 軽量な自前実装を採用する。
//
// 参考: https://developers.google.com/maps/documentation/utilities/polylinealgorithm

import type { RouteLatLng } from './types';

/**
 * Google Encoded Polyline Algorithm で符号化された文字列を座標配列に変換する。
 *
 * @param encoded - Google Routes API が返す encodedPolyline 文字列
 * @returns 座標配列 (latitude/longitude)
 */
export function decodePolyline(encoded: string): RouteLatLng[] {
  const result: RouteLatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    // decode latitude
    let shift = 0;
    let result_lat = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result_lat |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = result_lat & 1 ? ~(result_lat >> 1) : result_lat >> 1;
    lat += dlat;

    // decode longitude
    shift = 0;
    let result_lng = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result_lng |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = result_lng & 1 ? ~(result_lng >> 1) : result_lng >> 1;
    lng += dlng;

    result.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return result;
}
