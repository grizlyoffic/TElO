import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ActivePanel, useIDE } from "@/context/IDEContext";

interface TabItem {
  id: ActivePanel;
  icon: string;
  label: string;
}

const TABS: TabItem[] = [
  { id: "files", icon: "copy", label: "Explorer" },
  { id: "editor", icon: "code", label: "Editor" },
  { id: "terminal", icon: "terminal", label: "Terminal" },
  { id: "git", icon: "git-branch", label: "Git" },
  { id: "settings", icon: "settings", label: "Settings" },
];

export default function ActivityBar() {
  const { activePanel, setActivePanel, colors, openFiles, activeFile } = useIDE();
  const insets = useSafeAreaInsets();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePress = (panel: ActivePanel) => {
    Haptics.selectionAsync();
    setActivePanel(panel);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.activityBar,
          paddingBottom: bottomPad,
          borderTopColor: colors.border,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activePanel === tab.id;
        const hasNotification = tab.id === "editor" && openFiles.some((f) => f.modified);

        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isActive && { borderTopColor: colors.accent, borderTopWidth: 2 },
            ]}
            onPress={() => handlePress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather
                name={tab.icon as any}
                size={22}
                color={isActive ? colors.accent : colors.mutedText}
              />
              {hasNotification && (
                <View style={[styles.badge, { backgroundColor: colors.warning }]} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: "transparent",
  },
  iconWrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
