// Phase 12.5C: Google Places API (New) Nearby Search クライアント
// Node.js 組み込みの https モジュールを使用。外部パッケージ不要。
// APIキーはこのモジュールに渡さず、呼び出し元で Secret Manager から取得すること。

import * as https from 'https';
import type { GooglePlace, GooglePlacesResponse } from './types';

const NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
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
    rankPreference: 'DISTANCE',
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

/**
 * Google Places API (New) Text Search を呼び出す。
 * Nearby Search で目的の場所が返らない場合の fallback として使用する。
 * 本番 Cloud Functions への組み込みは診断結果を確認してから次フェーズで行う。
 *
 * @param apiKey        Secret Manager から取得した Google Places API キー
 * @param textQuery     検索テキスト（例: "Wasabi Plus Bukit Jalil"）
 * @param latitude      中心点の緯度（locationBias）
 * @param longitude     中心点の経度（locationBias）
 * @param radiusMeters  locationBias の半径 (m)。デフォルト 1000m
 * @param languageCode  レスポンス言語。デフォルト 'ja'
 */
export async function searchTextPlaces(
  apiKey: string,
  textQuery: string,
  latitude: number,
  longitude: number,
  radiusMeters = 1000,
  languageCode = 'ja'
): Promise<GooglePlace[]> {
  const requestBody = {
    textQuery,
    locationBias: {
      circle: {
        center: { latitude, longitude },
        radius: radiusMeters,
      },
    },
    languageCode,
  };

  const result = await httpsPost<GooglePlacesResponse>(
    TEXT_SEARCH_URL,
    {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    requestBody
  );

  return result.places ?? [];
}
