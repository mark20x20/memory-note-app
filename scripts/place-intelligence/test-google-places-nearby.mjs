/**
 * Google Places API (New) — Nearby Search テストスクリプト
 *
 * 目的:
 *   Phase 12.5A の事前検証として、Google Places API (New) の Nearby Search を
 *   複数の座標でテストし、日本語施設名・カテゴリ・精度を確認する。
 *
 * 使い方 (PowerShell):
 *   $env:GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"
 *   node scripts/place-intelligence/test-google-places-nearby.mjs
 *   Remove-Item Env:GOOGLE_PLACES_API_KEY
 *
 * 使い方 (bash / WSL):
 *   GOOGLE_PLACES_API_KEY=YOUR_API_KEY_HERE node scripts/place-intelligence/test-google-places-nearby.mjs
 *
 * 注意:
 *   - APIキーをこのファイルに書かないこと
 *   - APIキーを console.log しないこと
 *   - テスト結果をファイルに自動保存しない（ユーザーが手動でコピーする運用）
 *   - 結果は docs/phase12_5_place_intelligence/provider_tests/02_google_places_test_results_template.md に貼り付けること
 *   - 1回の実行で約5リクエスト発生（$0.05〜$0.10 程度のコスト見込み）
 *
 * 必要要件:
 *   - Node.js 20 以上（標準 fetch を使用）
 *   - 追加パッケージ不要
 */

// ─── 設定 ──────────────────────────────────────────────────────────────

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchNearby';

// 取得するフィールド（コスト制御: Advanced Data SKU 相当）
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.types',
  'places.location',
  'places.rating',
].join(',');

// Nearby Search の設定
const RADIUS_METERS = 200;
const MAX_RESULT_COUNT = 10;
const LANGUAGE_CODE = 'ja';

// ─── テスト座標 ──────────────────────────────────────────────────────────

const TEST_POINTS = [
  {
    id: 'asakusa_sensoji',
    label: '浅草寺周辺',
    latitude: 35.7148,
    longitude: 139.7967,
    expectedKeywords: ['浅草寺', 'Senso', '雷門', '仲見世'],
  },
  {
    id: 'shibuya_station',
    label: '渋谷駅・スクランブル交差点周辺',
    latitude: 35.6595,
    longitude: 139.7005,
    expectedKeywords: ['渋谷', 'Shibuya', 'スクランブル'],
  },
  {
    id: 'kyoto_kinkakuji',
    label: '京都 金閣寺周辺',
    latitude: 35.0394,
    longitude: 135.7292,
    expectedKeywords: ['金閣寺', '鹿苑寺', 'Kinkaku'],
  },
  {
    id: 'arashiyama',
    label: '京都 嵐山周辺',
    latitude: 35.0094,
    longitude: 135.6670,
    expectedKeywords: ['嵐山', 'Arashiyama'],
  },
  {
    id: 'klcc',
    label: 'クアラルンプール KLCC 周辺',
    latitude: 3.1579,
    longitude: 101.7123,
    expectedKeywords: ['Petronas', 'KLCC', 'Suria'],
  },
];

// ─── メイン処理 ──────────────────────────────────────────────────────────

async function main() {
  // APIキーのチェック（値は表示しない）
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.log('');
    console.log('❌ GOOGLE_PLACES_API_KEY が設定されていません。');
    console.log('');
    console.log('使い方 (PowerShell):');
    console.log('  $env:GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"');
    console.log('  node scripts/place-intelligence/test-google-places-nearby.mjs');
    console.log('  Remove-Item Env:GOOGLE_PLACES_API_KEY');
    console.log('');
    console.log('使い方 (bash):');
    console.log('  GOOGLE_PLACES_API_KEY=YOUR_KEY node scripts/place-intelligence/test-google-places-nearby.mjs');
    console.log('');
    console.log('⚠️  APIキーをこのファイルに直接書かないこと。');
    process.exit(1);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Google Places API (New) — Nearby Search テスト');
  console.log(`半径: ${RADIUS_METERS}m | maxResults: ${MAX_RESULT_COUNT} | lang: ${LANGUAGE_CODE}`);
  console.log('='.repeat(60));

  let allPassed = true;

  for (const point of TEST_POINTS) {
    console.log('');
    console.log(`[${point.id}] ${point.label}`);
    console.log(`座標: ${point.latitude}, ${point.longitude}`);

    try {
      const result = await fetchNearbyPlaces(apiKey, point.latitude, point.longitude);

      if (!result.places || result.places.length === 0) {
        console.log('  ⚠️  候補なし（0件）');
        allPassed = false;
        continue;
      }

      // 上位候補を表示
      result.places.slice(0, 5).forEach((place, index) => {
        const name = place.displayName?.text ?? '(名称なし)';
        const types = (place.types ?? []).slice(0, 3).join(', ');
        const rating = place.rating != null ? `★${place.rating.toFixed(1)}` : '評価なし';
        console.log(`  ${index + 1}. ${name} | ${types} | ${rating}`);
      });

      // 期待キーワードのヒット確認
      const allNames = result.places
        .map(p => `${p.displayName?.text ?? ''} ${(p.types ?? []).join(' ')}`)
        .join(' ');

      const hitKeywords = point.expectedKeywords.filter(kw =>
        allNames.toLowerCase().includes(kw.toLowerCase())
      );
      const keywordHit = hitKeywords.length > 0;

      if (keywordHit) {
        console.log(`  ✅ expected keyword hit: true (matched: ${hitKeywords.join(', ')})`);
      } else {
        console.log(`  ❌ expected keyword hit: false (expected: ${point.expectedKeywords.join(', ')})`);
        allPassed = false;
      }

    } catch (err) {
      console.log(`  ❌ エラー: ${err.message}`);
      allPassed = false;
    }

    // レート制限対策: リクエスト間に短い待機
    if (TEST_POINTS.indexOf(point) < TEST_POINTS.length - 1) {
      await sleep(300);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('✅ 全テスト通過');
  } else {
    console.log('⚠️  一部テスト失敗あり — 結果を確認してください');
  }
  console.log('');
  console.log('結果を以下に貼り付けてください:');
  console.log('  docs/phase12_5_place_intelligence/provider_tests/02_google_places_test_results_template.md');
  console.log('='.repeat(60));
  console.log('');
}

// ─── API 呼び出し ─────────────────────────────────────────────────────────

async function fetchNearbyPlaces(apiKey, latitude, longitude) {
  const body = {
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius: RADIUS_METERS,
      },
    },
    maxResultCount: MAX_RESULT_COUNT,
    languageCode: LANGUAGE_CODE,
  };

  const response = await fetch(PLACES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // エラー本文にキーが含まれる可能性があるためそのままは出力しない
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ─── ユーティリティ ───────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── 実行 ────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('予期しないエラー:', err.message);
  process.exit(1);
});
