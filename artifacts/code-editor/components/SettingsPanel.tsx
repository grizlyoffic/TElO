import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { type ThemeType, useIDE } from "@/context/IDEContext";

const THEME_OPTIONS: { id: ThemeType; label: string; desc: string }[] = [
  { id: "dark", label: "Dark (Default)", desc: "Classic VS Code Dark+ theme" },
  { id: "transparent", label: "Glassmorphism", desc: "Frosted glass with transparency" },
  { id: "light", label: "Light", desc: "VS Code Light theme" },
];

const FONT_SIZES = [11, 12, 13, 14, 16, 18, 20];

export default function SettingsPanel() {
  const { colors, theme, setTheme, fontSize, setFontSize } = useIDE();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.sidebar }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>APPEARANCE</Text>

      {/* Theme */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Color Theme</Text>
        {THEME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.themeRow,
              theme === opt.id && {
                backgroundColor: colors.selection,
                borderRadius: 6,
              },
            ]}
            onPress={() => setTheme(opt.id)}
            activeOpacity={0.7}
          >
            <View style={styles.themeLeft}>
              <View style={[styles.themePreview, getThemePreviewStyle(opt.id)]} />
              <View>
                <Text style={[styles.themeLabel, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.themeDesc, { color: colors.mutedText }]}>{opt.desc}</Text>
              </View>
            </View>
            {theme === opt.id && (
              <Feather name="check" size={16} color={colors.accent} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>EDITOR</Text>

      {/* Font Size */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Font Size</Text>
          <Text style={[styles.currentValue, { color: colors.accent }]}>{fontSize}px</Text>
        </View>
        <View style={styles.fontSizeRow}>
          {FONT_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.fontSizeBtn,
                {
                  backgroundColor:
                    fontSize === size ? colors.accent : colors.muted,
                  borderRadius: 6,
                },
              ]}
              onPress={() => setFontSize(size)}
            >
              <Text
                style={[
                  styles.fontSizeBtnText,
                  { color: fontSize === size ? "#fff" : colors.text },
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>ABOUT</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {[
          { label: "Version", value: "1.0.0" },
          { label: "Platform", value: "React Native / Expo" },
          { label: "Languages", value: "Python, JS, TS, Java, Bash, HTML, CSS" },
        ].map((item) => (
          <View key={item.label} style={[styles.aboutRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.aboutLabel, { color: colors.mutedText }]}>{item.label}</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>KEYBOARD SHORTCUTS</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {[
          { action: "Run file", shortcut: "type 'run' in terminal" },
          { action: "Edit file", shortcut: "tap Edit icon in toolbar" },
          { action: "Save file", shortcut: "tap Save icon in toolbar" },
          { action: "Toggle terminal", shortcut: "tap Terminal icon" },
          { action: "New file", shortcut: "tap + in Explorer" },
          { action: "Delete file", shortcut: "long press file" },
        ].map((item) => (
          <View key={item.action} style={[styles.shortcutRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.shortcutAction, { color: colors.text }]}>{item.action}</Text>
            <Text style={[styles.shortcutKey, { color: colors.mutedText }]}>{item.shortcut}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function getThemePreviewStyle(theme: ThemeType) {
  const previews: Record<ThemeType, { backgroundColor: string; borderColor: string }> = {
    dark: { backgroundColor: "#1e1e1e", borderColor: "#0078d4" },
    transparent: { backgroundColor: "rgba(30,30,30,0.5)", borderColor: "#569cd6" },
    light: { backgroundColor: "#ffffff", borderColor: "#0078d4" },
  };
  return previews[theme];
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 12,
    borderRadius: 8,
    padding: 12,
    gap: 4,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    gap: 12,
  },
  themeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  themePreview: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
  },
  themeLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  themeDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  fontSizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fontSizeBtn: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  aboutLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  aboutValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    maxWidth: "60%",
    textAlign: "right",
  },
  shortcutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  shortcutAction: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  shortcutKey: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    maxWidth: "50%",
    textAlign: "right",
  },
});
