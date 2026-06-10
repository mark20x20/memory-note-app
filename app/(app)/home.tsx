import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';

// Phase 0: プレースホルダーデータ。Phase 1 以降で Firestore から取得する
const PLACEHOLDER_NOTES: never[] = [];

export default function HomeScreen() {
  const isEmpty = PLACEHOLDER_NOTES.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>思い出ノート</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            // TODO Phase 2: ノート作成画面へ
          }}
        >
          <Text style={styles.createButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyTitle}>ノートがありません</Text>
          <Text style={styles.emptyDescription}>
            写真を選んで{'\n'}最初の思い出ノートを作りましょう
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              // TODO Phase 2: ノート作成画面へ
            }}
          >
            <Text style={styles.emptyButtonText}>ノートを作る</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={PLACEHOLDER_NOTES}
          keyExtractor={(item: never) => String(item)}
          renderItem={() => null}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
});
