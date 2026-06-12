// Phase 12: SNS Share Card — 共有カードの型定義

export type ShareCardFormat = 'square' | 'portrait' | 'story';

export interface ShareCardFormatConfig {
  /** セレクターに表示する比率テキスト */
  label: string;
  /** width / height の比率 */
  aspectRatio: number;
  /** 説明文 */
  description: string;
}

export const SHARE_CARD_FORMATS: Record<ShareCardFormat, ShareCardFormatConfig> = {
  square: {
    label: '1:1',
    aspectRatio: 1,
    description: 'Instagram・X向け',
  },
  portrait: {
    label: '4:5',
    aspectRatio: 4 / 5,
    description: 'Instagram縦長',
  },
  story: {
    label: '9:16',
    aspectRatio: 9 / 16,
    description: 'ストーリー向け',
  },
};

export const SHARE_CARD_FORMAT_ORDER: ShareCardFormat[] = ['square', 'portrait', 'story'];
