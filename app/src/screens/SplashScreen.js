import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { tokens } from "../theme/tokens.js";

const { color, space } = tokens;

export function SplashScreen({ onFinish }) {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    logoOpacity.value = withTiming(1, { duration: 400 });
    textOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));

    const fadeTimer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 300 });
    }, 1800);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [containerOpacity, logoOpacity, logoScale, onFinish, textOpacity]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={[styles.logoBadge, logoAnimatedStyle]}>
        <Ionicons name="pulse" size={40} color={color.onPrimary} />
      </Animated.View>
      <Animated.Text style={[styles.appName, textAnimatedStyle]}>
        LiveTemp
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: space.md,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderCurve: "continuous",
    backgroundColor: color.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: color.text,
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
});
