export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'メールアドレスまたはパスワードが正しくありません。',
  'auth/wrong-password': 'メールアドレスまたはパスワードが正しくありません。',
  'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません。',
  'auth/email-already-in-use': 'このアカウントは既に登録されています。ログインしてください。',
  'auth/weak-password': 'パスワードは6文字以上で入力してください。',
  'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
  'auth/network-request-failed': '通信に失敗しました。ネットワーク接続を確認して再試行してください。',
  'auth/too-many-requests': 'しばらく時間をおいて再試行してください。',
  'auth/user-disabled': 'このアカウントは無効化されています。',
};

export function mapAuthError(e: unknown): AuthError {
  if (e instanceof Error && 'code' in e) {
    const code = (e as { code: string }).code;
    const message = ERROR_MESSAGES[code] ?? 'ログインに失敗しました。入力内容をご確認ください。';
    return new AuthError(message);
  }
  return new AuthError('ログインに失敗しました。入力内容をご確認ください。');
}
