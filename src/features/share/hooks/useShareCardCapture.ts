// Phase 12: useShareCardCapture — 共有カードのキャプチャ・保存・共有フック
// react-native-view-shot でビューを画像として取得し、
// expo-media-library で端末保存、expo-sharing でOS共有シートを開く。

import { useRef, useState, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export interface UseShareCardCaptureResult {
  /** ShareCardPreview の View に渡す ref */
  cardRef: React.RefObject<View | null>;
  /** 端末の写真ライブラリに保存する */
  captureAndSave: () => Promise<void>;
  /** OS共有シートを開く */
  captureAndShare: () => Promise<void>;
  isCapturing: boolean;
  error: string | null;
  clearError: () => void;
  /** 最後に成功した保存メッセージ */
  successMessage: string | null;
  clearSuccess: () => void;
}

export function useShareCardCapture(): UseShareCardCaptureResult {
  const cardRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /** カードをキャプチャして一時ファイルのURIを返す */
  const capture = useCallback(async (): Promise<string> => {
    if (!cardRef.current) {
      throw new Error('カードビューが見つかりません');
    }
    const uri = await captureRef(cardRef, {
      format: 'jpg',
      quality: 0.92,
    });
    return uri;
  }, []);

  const captureAndSave = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // 権限リクエスト
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('写真ライブラリへのアクセスを許可してください');
        return;
      }

      const uri = await capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      setSuccessMessage('写真ライブラリに保存しました');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '不明なエラー';
      setError(`保存に失敗しました: ${msg}`);
    } finally {
      setIsCapturing(false);
    }
  }, [capture]);

  const captureAndShare = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('共有できません', 'このデバイスでは共有機能が利用できません。');
        return;
      }

      const uri = await capture();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: '思い出カードを共有',
        UTI: 'public.jpeg',
      });
    } catch (e) {
      // ユーザーが共有をキャンセルした場合はエラーを出さない
      const msg = e instanceof Error ? e.message : '';
      if (!msg.includes('cancel') && !msg.includes('Cancel')) {
        setError('共有に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [capture]);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
    cardRef,
    captureAndSave,
    captureAndShare,
    isCapturing,
    error,
    clearError,
    successMessage,
    clearSuccess,
  };
}
