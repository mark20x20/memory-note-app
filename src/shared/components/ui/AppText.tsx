import { Text, TextProps } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button'
  // UI-1 spec variants
  | 'display'
  | 'screenTitle'
  | 'cardTitle'
  | 'bodyMd'
  | 'micro';

type Color = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: Color;
}

const colorMap: Record<Color, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  inverse: colors.textInverse,
  error: colors.error,
};

export function AppText({
  variant = 'body',
  color = 'primary',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[typography[variant], { color: colorMap[color] }, style]}
      {...props}
    />
  );
}
