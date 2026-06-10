// Phase 1 で Firestore の app_settings から取得する
// Phase 0 はデフォルト値を返す

export interface SettingsData {
  privacyPolicyUrl: string;
  termsUrl: string;
  supportEmail: string;
  appVersion: string;
}

export function useSettingsData(): SettingsData {
  return {
    privacyPolicyUrl: '',
    termsUrl: '',
    supportEmail: '',
    appVersion: '1.0.0',
  };
}
