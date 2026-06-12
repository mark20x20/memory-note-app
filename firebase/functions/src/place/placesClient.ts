// Phase 12.5C: Google Places API (New) Nearby Search クライアント
// Node.js 組み込みの https モジュールを使用。外部パッケージ不要。
// APIキーはこのモジュールに渡さず、呼び出し元で Secret Manager から取得すること。

import * as https from 'https';
import type { GooglePlace, GooglePlacesResponse } from './types';

const NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.types,places.location,places.rating';

// ── 内部: HTTPS POST ヘルパー ────────────────────────────────────────────────────

function httpsPost<T>(
  url: string,
  extraHeaders: Record<string, string>,
  body: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const parsedUrl = new URL(url);

    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...extraHeaders,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      res.on('end', () => {
        const status = res.statusCode ?? 0;
        if (status >= 200 && status < 300) {
          try {
            resolve(JSON.parse(data) as T);
          } catch (e) {
            reject(new Error(`Places API JSON parse error: ${String(e)}`));
          }
        } else {
          reject(new Error(`Places API HTTP ${status}`));
        }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ── 公開 API ──────────────────────────────────────────────────────────────────

/**
 * Google Places API (New) Nearby Search を呼び出す。
 * - FieldMask: id, displayName, formattedAddress, types, location, rating のみ取得
 * - 候補が 0 件の場合は空配列を返す
 * - HTTP エラー / ネットワークエラーは例外をスロー（呼び出し元でハンドリング）
 *
 * @param apiKey   Secret Manager から取得した Google Places API キー
 * @param latitude  グループ代表点の緯度
 * @param longitude グループ代表点の経度
 * @param radiusMeters 検索半径 (m)。デフォルト 200m
 */
export async function searchNearbyPlaces(
  apiKey: string,
  latitude: number,
  longitude: number,
  radiusMeters = 200
): Promise<GooglePlace[]> {
  const requestBody = {
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius: radiusMeters,
      },
    },
    maxResultCount: 10,
    languageCode: 'ja',
  };

  const result = await httpsPost<GooglePlacesResponse>(
    NEARBY_SEARCH_URL,
    {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    requestBody
  );

  return result.places ?? [];
}
