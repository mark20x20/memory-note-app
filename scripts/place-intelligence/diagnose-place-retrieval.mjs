/**
 * Place Retrieval Diagnostics Script
 *
 * Nearby Search と Text Search の結果を比較し、
 * Wasabi Plus 山葵日料 | Bukit Jalil が候補に出るかを確認する。
 *
 * 使い方:
 *   $env:GOOGLE_PLACES_API_KEY="your-key"
 *   node scripts/place-intelligence/diagnose-place-retrieval.mjs
 *   Remove-Item Env:GOOGLE_PLACES_API_KEY
 *
 * APIキーはログに出力しない。
 */

import * as https from 'https';

// ── 設定 ───────────────────────────────────────────────────────────────────────

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('[ERROR] 環境変数 GOOGLE_PLACES_API_KEY が設定されていません');
  process.exit(1);
}

// Wasabi Plus 周辺の写真 GPS 座標
const PHOTO_1 = { latitude: 3.0615, longitude: 101.67668, label: 'photo-1' };
const PHOTO_2 = { latitude: 3.0613805, longitude: 101.676605, label: 'photo-2' };

const WASABI_KEYWORDS = ['wasabi', '山葵', 'sushi', 'japanese'];

const NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const TEXT_URL   = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.types,places.location,places.rating';

// ── HTTP helper ────────────────────────────────────────────────────────────────

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        const status = res.statusCode ?? 0;
        if (status >= 200 && status < 300) {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`JSON parse error: ${e}`)); }
        } else {
          reject(new Error(`HTTP ${status}: ${data.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ── 距離計算 ────────────────────────────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── 結果表示 ────────────────────────────────────────────────────────────────────

function matchesWasabi(name) {
  const lower = (name ?? '').toLowerCase();
  return WASABI_KEYWORDS.some((k) => lower.includes(k));
}

function printResult(testName, params, coord, places, error) {
  const divider = '─'.repeat(60);
  console.log(`\n${divider}`);
  console.log(`TEST: ${testName}`);
  console.log(`  coord:        ${coord.label} (${coord.latitude}, ${coord.longitude})`);
  for (const [k, v] of Object.entries(params)) {
    console.log(`  ${k.padEnd(16)}: ${v}`);
  }

  if (error) {
    console.log(`  [ERROR] ${error}`);
    return;
  }

  const count = places.length;
  console.log(`  result count  : ${count}`);
  if (count === 0) {
    console.log('  (no results)');
    return;
  }

  let foundWasabi = false;
  places.forEach((p, i) => {
    const name  = p.displayName?.text ?? '(no name)';
    const loc   = p.location;
    const dist  = loc ? Math.round(haversine(coord.latitude, coord.longitude, loc.latitude, loc.longitude)) : '-';
    const rating = p.rating != null ? p.rating.toFixed(1) : '-';
    const types  = (p.types ?? []).slice(0, 3).join(', ');
    const hit    = matchesWasabi(name);
    if (hit) foundWasabi = true;
    const marker = hit ? '  ★ MATCH' : '';
    console.log(`  [${String(i + 1).padStart(2)}] ${name}${marker}`);
    console.log(`       dist=${dist}m  rating=${rating}  types=${types}`);
  });
  console.log(`  matchedWasabi : ${foundWasabi}`);
}

// ── テストケース定義 ────────────────────────────────────────────────────────────

async function runNearby(testName, coord, radius, languageCode, extras = {}) {
  const body = {
    locationRestriction: {
      circle: { center: { latitude: coord.latitude, longitude: coord.longitude }, radius },
    },
    maxResultCount: 20,
    languageCode,
    rankPreference: 'DISTANCE',
    ...extras,
  };
  const params = { apiType: 'Nearby Search', radius, languageCode, rankPreference: 'DISTANCE', ...extras };
  try {
    const result = await httpsPost(NEARBY_URL, body);
    printResult(testName, params, coord, result.places ?? [], null);
  } catch (e) {
    printResult(testName, params, coord, [], e.message);
  }
}

async function runText(testName, coord, textQuery, languageCode, radiusBias = 1000) {
  const body = {
    textQuery,
    locationBias: {
      circle: { center: { latitude: coord.latitude, longitude: coord.longitude }, radius: radiusBias },
    },
    languageCode,
  };
  const params = { apiType: 'Text Search', textQuery, languageCode, locationBiasRadius: `${radiusBias}m` };
  try {
    const result = await httpsPost(TEXT_URL, body);
    printResult(testName, params, coord, result.places ?? [], null);
  } catch (e) {
    printResult(testName, params, coord, [], e.message);
  }
}

// ── メイン ─────────────────────────────────────────────────────────────────────

console.log('='.repeat(60));
console.log('Place Retrieval Diagnostics');
console.log('Target: Wasabi Plus 山葵日料 | Bukit Jalil');
console.log(`Photo-1: ${PHOTO_1.latitude}, ${PHOTO_1.longitude}`);
console.log(`Photo-2: ${PHOTO_2.latitude}, ${PHOTO_2.longitude}`);
console.log('API key: [REDACTED]');
console.log('='.repeat(60));

// --- Nearby Search パターン ---
await runNearby('T01 Nearby 50m  en  photo-1',  PHOTO_1,  50, 'en');
await runNearby('T02 Nearby 100m en  photo-1',  PHOTO_1, 100, 'en');
await runNearby('T03 Nearby 200m en  photo-1',  PHOTO_1, 200, 'en');
await runNearby('T04 Nearby 500m en  photo-1',  PHOTO_1, 500, 'en');
await runNearby('T05 Nearby 200m ja  photo-1',  PHOTO_1, 200, 'ja');
await runNearby('T06 Nearby 200m en  restaurant+cafe photo-1', PHOTO_1, 200, 'en', {
  includedTypes: ['restaurant', 'cafe'],
});

// --- photo-2 でも確認 ---
await runNearby('T07 Nearby 200m en  photo-2',  PHOTO_2, 200, 'en');
await runNearby('T08 Nearby 500m en  photo-2',  PHOTO_2, 500, 'en');

// --- Text Search パターン ---
await runText('T09 Text "Wasabi Plus Bukit Jalil"           en', PHOTO_1, 'Wasabi Plus Bukit Jalil', 'en');
await runText('T10 Text "Wasabi Plus 山葵日料 Bukit Jalil"  en', PHOTO_1, 'Wasabi Plus 山葵日料 Bukit Jalil', 'en');
await runText('T11 Text "山葵日料 Bukit Jalil"              ja', PHOTO_1, '山葵日料 Bukit Jalil', 'ja');
await runText('T12 Text "Wasabi Plus Bukit Jalil"           en photo-2', PHOTO_2, 'Wasabi Plus Bukit Jalil', 'en');

console.log('\n' + '='.repeat(60));
console.log('Diagnostics complete.');
console.log('★ = matched Wasabi / 山葵');
console.log('='.repeat(60));
