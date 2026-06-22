// UI-1: EditTabBar — 5タブ編集シェル用タブバー
// spec: height 44, active bg #FDE7E2, active text #F26B5B, inactive text #7A746D, tab radius 999

import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type TabItem<T extends string> = {
  key: T;
  label: string;
  badge?: string | number;
};

type EditTabBarProps<T extends string> = {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (key: T) => void;
};

export function EditTabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: EditTabBarProps<T>) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.badge != null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#FDE7E2',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
