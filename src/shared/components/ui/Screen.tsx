import { View, StyleSheet } from 'react-native';
import type { ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface ScreenProps extends ViewProps {
  safeArea?: boolean;
  padded?: boolean;
  centered?: boolean;
}

export function Screen({
  safeArea = true,
  padded = true,
  centered = false,
  style,
  children,
  ...props
}: ScreenProps) {
  const Wrapper = safeArea ? SafeAreaView : View;

  return (
    <Wrapper style={styles.wrapper}>
      <View
        style={[
          styles.container,
          padded && styles.padded,
          centered && styles.centered,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
