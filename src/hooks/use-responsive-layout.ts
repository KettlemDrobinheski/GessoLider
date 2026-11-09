import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWide = width >= 960;

  return {
    isWide,
    maxContentWidth: width >= 1280 ? 1120 : isTablet ? 880 : 640,
    horizontalPadding: width >= 1280 ? 32 : isTablet ? 28 : 20,
  };
}
