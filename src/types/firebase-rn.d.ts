// Module augmentation: adds getReactNativePersistence to firebase/auth types.
// This function exists in the React Native bundle but not in the browser TypeScript types.
export {};

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): import('firebase/auth').Persistence;
}
