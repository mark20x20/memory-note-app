import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

const FEATURES = [
  {
    id: 1,
    emoji: '📷',
    title: '写真を選ぶだけ',
    description: '旅やおでかけの写真をまとめてアップロードできます。',
  },
  {
    id: 2,
    emoji: '🗺️',
    title: '場所と流れを自動整理',
    description:
      '写真の時間や位置情報から、その日の動きを思い出として並べます。',
  },
  {
    id: 3,
    emoji: '✏️',
    title: 'AI日記で振り返る',
    description: '写真とメモから、自然な日記の下書きを作れます。',
  },
  {
    id: 4,
    emoji: '👨‍👩‍👧',
    title: '家族や友達と共有',
    description: '思い出ノートを一緒に見たり、編集したりできます。',
  },
];

export default function OnboardingScreen() {
  const handleStart = () => {
    router.replace('/(auth)/login');
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📔</Text>
          <Text style={styles.heroTitle}>写真から、旅の記憶を一冊に。</Text>
          <Text style={styles.heroSubtitle}>
            撮った写真を選ぶだけで、場所・時間・思い出をやさしく整理します。
          </Text>
        </View>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.id} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleStart}>
            <Text style={styles.ctaButtonText}>思い出ノートをはじめる</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>あとで見る</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Hero
  hero: {
    backgroundColor: '#FFF9F4',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 32,
  },
  heroEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Features
  featureList: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FDE7E2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  ctaButton: {
    backgroundColor: '#F26B5B',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
});
