// Phase 9: AI Diary Generation via Cloud Functions
// generateMemoryDiary — Callable Function (Firebase Functions v2)
//
// セキュリティ方針:
// - OpenAI APIキーは Secret Manager で管理 (OPENAI_API_KEY)
// - 写真画像は送らない。メタデータのみ使用
// - Vision API 不使用
// - ログに APIキー・日記全文・メモ全文を出力しない

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();

// ── Secret Manager からAPIキーを参照 ────────────────────────────────────────
const openaiApiKey = defineSecret('OPENAI_API_KEY');

// ── 型定義 ─────────────────────────────────────────────────────────────────

type DiaryContext = {
  title: string;
  memo: string;
  noteType: string;
  photoCount: number;
  takenAtList: string[];
  locationGroupCount: number;
};

type PhotoData = {
  latitude?: number | null;
  longitude?: number | null;
  takenAt?: string | null;
  sortOrder?: number;
};

// ── 場所グループ数の計算（Phase 8 と同じアルゴリズム）────────────────────────
const PLACE_GROUP_THRESHOLD = 0.002; // 約220m

function countLocationGroups(photos: PhotoData[]): number {
  type Group = { lat: number; lng: number };
  const groups: Group[] = [];

  for (const p of photos) {
    const lat = typeof p.latitude === 'number' ? p.latitude : null;
    const lng = typeof p.longitude === 'number' ? p.longitude : null;
    if (lat === null || lng === null) continue;

    const existing = groups.find(
      (g) =>
        Math.abs(g.lat - lat) <= PLACE_GROUP_THRESHOLD &&
        Math.abs(g.lng - lng) <= PLACE_GROUP_THRESHOLD
    );
    if (existing) {
      existing.lat = (existing.lat + lat) / 2;
      existing.lng = (existing.lng + lng) / 2;
    } else {
      groups.push({ lat, lng });
    }
  }

  return groups.length;
}

// ── OpenAI プロンプト ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `あなたは「思い出日記ライター」です。
ユーザーが入力したノートのメタデータ（タイトル・メモ・撮影日時・写真枚数・場所の数）をもとに、
短い思い出日記（100〜200文字）を日本語で書いてください。

ルール:
- メタデータに書かれていない具体的な場所名・人名・出来事を創作しないこと
- 天気・会話内容・料理の味など、入力に存在しない情報を断言しないこと
- 写真の見た目・被写体の詳細を推測しないこと（画像は受け取っていない）
- ポジティブで温かいトーンを保つ
- 出力は日記本文のみ。前置き・説明文・タイトルは不要
- 100〜200文字に収める`;

function buildUserPrompt(ctx: DiaryContext): string {
  const lines: string[] = [];

  lines.push(`【ノートタイトル】${ctx.title}`);

  if (ctx.memo) {
    const truncatedMemo =
      ctx.memo.length > 200 ? ctx.memo.slice(0, 200) + '…' : ctx.memo;
    lines.push(`【メモ】${truncatedMemo}`);
  }

  lines.push(
    `【ノートの種類】${ctx.noteType === 'shared' ? '共有ノート（複数人で作成）' : '個人ノート'}`
  );
  lines.push(`【写真の枚数】${ctx.photoCount}枚`);

  if (ctx.takenAtList.length > 0) {
    const sorted = [...ctx.takenAtList].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first === last) {
      lines.push(`【撮影日】${first}`);
    } else {
      lines.push(`【撮影期間】${first} 〜 ${last}`);
    }
  }

  if (ctx.locationGroupCount > 0) {
    lines.push(`【訪れた場所の数（おおよそ）】${ctx.locationGroupCount}ヶ所`);
  }

  lines.push('');
  lines.push('上記の情報をもとに、短い思い出日記を書いてください。');

  return lines.join('\n');
}

// ── Callable Function ─────────────────────────────────────────────────────────

export const generateMemoryDiary = onCall(
  { region: 'asia-northeast1', secrets: [openaiApiKey] },
  async (request) => {
    // 1. 認証チェック
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    // 2. noteId バリデーション
    const data = request.data as { noteId?: unknown };
    if (typeof data.noteId !== 'string' || data.noteId.trim() === '') {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    const noteId = data.noteId.trim();

    const db = admin.firestore();
    const noteRef = db.doc(`memory_notes/${noteId}`);

    // 3. Firestore からノートを取得
    const noteSnap = await noteRef.get();
    if (!noteSnap.exists) {
      throw new HttpsError('not-found', 'ノートが見つかりません');
    }
    const noteData = noteSnap.data()!;

    // 4. owner / member 権限確認
    const ownerId = noteData.ownerId as string;
    const members = noteData.members as Record<string, string> | undefined;
    const isOwner = ownerId === uid;
    const isMember = members != null && uid in members;
    if (!isOwner && !isMember) {
      throw new HttpsError(
        'permission-denied',
        'このノートへのアクセス権限がありません'
      );
    }

    // 5. 写真メタデータを取得
    const photosSnap = await db
      .collection(`memory_notes/${noteId}/photos`)
      .orderBy('sortOrder', 'asc')
      .get();

    const photos: PhotoData[] = photosSnap.docs.map((d) => d.data() as PhotoData);

    // 6. generating 中の重複生成を拒否
    const currentStatus = noteData.aiDiaryStatus as string | undefined;
    if (currentStatus === 'generating') {
      throw new HttpsError(
        'already-exists',
        'AI生成が進行中です。しばらくお待ちください'
      );
    }

    // 7. aiDiaryStatus: 'generating' を保存
    await noteRef.update({
      aiDiaryStatus: 'generating',
      aiDiaryUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      // 8. DiaryContext を組み立てる
      const takenAtList = photos
        .map((p) => p.takenAt)
        .filter((t): t is string => typeof t === 'string' && t.length > 0)
        .slice(0, 10);

      const locationGroupCount = countLocationGroups(photos);

      const ctx: DiaryContext = {
        title: String(noteData.title ?? ''),
        memo: String(noteData.memo ?? ''),
        noteType: String(noteData.noteType ?? 'personal'),
        photoCount:
          typeof noteData.photoCount === 'number'
            ? noteData.photoCount
            : photos.length,
        takenAtList,
        locationGroupCount,
      };

      // 9. OpenAI API 呼び出し
      const apiKey = openaiApiKey.value();
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY が設定されていません');
      }

      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(ctx) },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiDiary = completion.choices[0]?.message?.content?.trim() ?? '';

      // 10. 成功: Firestore に保存
      await noteRef.update({
        aiDiary,
        aiDiaryStatus: 'completed',
        aiDiaryGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        aiDiaryUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ログ: noteId と uid 末尾4文字のみ
      console.log(
        `[generateMemoryDiary] noteId=${noteId} uid=***${uid.slice(-4)} status=completed`
      );

      return { success: true, aiDiary };
    } catch (e) {
      // 11. 失敗: ステータスを failed に更新
      const errorCode =
        e instanceof HttpsError ? e.code : 'unknown';
      console.error(
        `[generateMemoryDiary] noteId=${noteId} uid=***${uid.slice(-4)} status=failed errorCode=${errorCode}`
      );

      await noteRef.update({
        aiDiaryStatus: 'failed',
        aiDiaryError: 'AI日記の生成に失敗しました。もう一度お試しください。',
        aiDiaryUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // HttpsError はそのまま再スロー（クライアントへ伝播させる）
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('internal', 'AI生成に失敗しました');
    }
  }
);
