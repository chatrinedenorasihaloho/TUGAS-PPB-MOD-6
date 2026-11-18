import { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MonitoringScreen } from "./src/screens/MonitoringScreen.js";
import { ControlScreen } from "./src/screens/ControlScreen.js";
import { ProfileScreen } from "./src/screens/ProfileScreen.js";
import { SplashScreen } from "./src/screens/SplashScreen.js";
import { assertConfig } from "./src/services/config.js";
import { tokens } from "./src/theme/tokens.js";

const Tab = createBottomTabNavigator();
const { color } = tokens;

enableScreens(true);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    assertConfig();
  }, []);

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: color.bg,
      card: color.surface,
      text: color.text,
      border: color.border,
      primary: color.primary,
    },
  };

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: true,
            headerTitle: "LiveTemp",
            headerTitleAlign: "left",
            headerTintColor: color.text,
            headerStyle: {
              backgroundColor: color.surface,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            },
            headerTitleStyle: {
              fontWeight: "600",
              fontSize: 17,
              // ponytail: system monospace, no custom font dep
              fontFamily: "monospace",
              letterSpacing: -0.5,
            },
            tabBarActiveTintColor: color.primary,
            tabBarInactiveTintColor: color.text2,
            tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
            tabBarStyle: {
              backgroundColor: color.surface,
              borderTopWidth: 1,
              borderTopColor: color.border,
            },
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ color: iconColor }) => {
              let iconName = "pulse";
              if (route.name === "Control") {
                iconName = "options";
              } else if (route.name === "Profile") {
                iconName = "people";
              }
              return <Ionicons name={iconName} size={24} color={iconColor} />;
            },
          })}
        >
          <Tab.Screen name="Monitoring" component={MonitoringScreen} />
          <Tab.Screen name="Control" component={ControlScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
