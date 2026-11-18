import { ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { tokens } from "../theme/tokens.js";

const { color, space, radius, shadow } = tokens;

const GROUP_MEMBERS = [
  {
    id: "1",
    name: "Chatrine Denora Sihaloho",
    nim: "21120124120005",
  },
  {
    id: "2",
    name: "Hafizh Muhammad Akbar",
    nim: "21120124130098",
  },
  {
    id: "3",
    name: "Awallin Yusuf Ikrar Putra",
    nim: "21120123140045",
  },
  {
    id: "4",
    name: "Henidar Sekar Mayang",
    nim: "21120124120008",
  },
];

export function ProfileScreen() {
  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.headerCard}>
          <View style={styles.groupBadgeIcon}>
            <Ionicons name="people" size={24} color={color.onPrimary} />
          </View>
          <View>
            <Text style={styles.groupTitle}>Kelompok 28</Text>
            <Text style={styles.groupSubtitle}>Anggota Kelompok</Text>
          </View>
        </View>

        <View style={styles.membersList}>
          {GROUP_MEMBERS.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={20} color={color.primary} />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberNim}>{member.nim}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
    backgroundColor: color.bg,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: color.surface,
    padding: space.lg,
    borderRadius: radius.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: color.border,
    boxShadow: shadow.card,
  },
  groupBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderCurve: "continuous",
    backgroundColor: color.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: color.text,
  },
  groupSubtitle: {
    fontSize: 13,
    color: color.text2,
  },
  membersList: {
    gap: space.sm,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: color.surface,
    padding: space.lg,
    borderRadius: radius.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: color.border,
    boxShadow: shadow.card,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: color.text,
  },
  memberNim: {
    fontSize: 13,
    color: color.text2,
    fontVariant: ["tabular-nums"],
  },
});
