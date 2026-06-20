import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActivityBar from "@/components/ActivityBar";
import CodeEditor from "@/components/CodeEditor";
import FileExplorer from "@/components/FileExplorer";
import GitPanel from "@/components/GitPanel";
import SettingsPanel from "@/components/SettingsPanel";
import TerminalPanel from "@/components/TerminalPanel";
import TitleBar from "@/components/TitleBar";
import { useIDE } from "@/context/IDEContext";

export default function IDEScreen() {
  const { activePanel, terminalOpen, colors, theme } = useIDE();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const isEditorPanel = activePanel === "editor" || activePanel === "files" || activePanel === "git";
  const showTerminal = terminalOpen && isEditorPanel;

  const containerStyle = {
    flex: 1 as const,
    backgroundColor: colors.background,
    paddingTop: insets.top,
  };

  return (
    <View style={containerStyle}>
      {/* Glassmorphism blur overlay for transparent theme */}
      {theme === "transparent" && (
        <BlurView
          intensity={60}
          tint="dark"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      <TitleBar />

      {/* Main content */}
      <View style={styles.content}>
        {/* Panel content */}
        <View style={styles.panelArea}>
          {activePanel === "files" && <FileExplorer />}
          {activePanel === "editor" && <CodeEditor />}
          {activePanel === "terminal" && <TerminalPanel />}
          {activePanel === "git" && <GitPanel />}
          {activePanel === "settings" && <SettingsPanel />}

          {/* Inline terminal (shown alongside editor/files/git) */}
          {showTerminal && activePanel !== "terminal" && (
            <View style={[styles.inlineTerminal, { borderTopColor: colors.border }]}>
              <TerminalPanel />
            </View>
          )}
        </View>
      </View>

      <ActivityBar />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  panelArea: {
    flex: 1,
  },
  inlineTerminal: {
    height: 260,
    borderTopWidth: 1,
  },
});
