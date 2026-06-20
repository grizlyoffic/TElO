import { Feather } from "@expo/vector-icons";
import { useExecuteCode } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type SupportedLanguage, useIDE } from "@/context/IDEContext";

const EXEC_LANGS: SupportedLanguage[] = ["python", "javascript", "bash", "java"];

function getExecLang(lang: SupportedLanguage): "python" | "node" | "bash" | "java" {
  if (lang === "javascript" || lang === "typescript") return "node";
  if (lang === "python") return "python";
  if (lang === "java") return "java";
  return "bash";
}

export default function TerminalPanel() {
  const {
    terminalHistory,
    addTerminalLine,
    clearTerminal,
    colors,
    activeFile,
    toggleTerminal,
  } = useIDE();
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const mutation = useExecuteCode();

  const handleRun = async () => {
    const cmd = command.trim();
    if (!cmd) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addTerminalLine({ type: "input", text: `$ ${cmd}` });
    setCommandHistory((prev) => [cmd, ...prev.slice(0, 49)]);
    setHistIdx(-1);
    setCommand("");

    // Determine language
    let lang: "python" | "node" | "bash" | "java" = "bash";
    let code = cmd;

    if (cmd.startsWith("python ") || cmd.startsWith("python3 ")) {
      // Run active file if it's python
      if (activeFile?.language === "python") {
        lang = "python";
        code = activeFile.content;
      } else {
        lang = "bash";
      }
    } else if (cmd.startsWith("node ")) {
      if (activeFile?.language === "javascript" || activeFile?.language === "typescript") {
        lang = "node";
        code = activeFile.content;
      } else {
        lang = "bash";
      }
    } else if (cmd === "run" && activeFile) {
      // Run current file
      lang = getExecLang(activeFile.language);
      code = activeFile.content;
    } else {
      // Treat as bash
      lang = "bash";
      code = cmd;
    }

    try {
      const result = await mutation.mutateAsync({ code, language: lang });
      if (result.stdout) {
        addTerminalLine({ type: "output", text: result.stdout.trimEnd() });
      }
      if (result.stderr) {
        addTerminalLine({ type: "error", text: result.stderr.trimEnd() });
      }
      if (!result.stdout && !result.stderr) {
        addTerminalLine({ type: "output", text: `Exited with code ${result.exitCode}` });
      }
    } catch (err: any) {
      addTerminalLine({
        type: "error",
        text: "Error: Could not reach execution server. Make sure the API server is running.",
      });
    }

    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  };

  const handleRunCurrentFile = () => {
    if (!activeFile) return;
    setCommand("run");
    setTimeout(() => handleRun(), 0);
  };

  const handleKeyUp = () => {
    if (commandHistory.length === 0) return;
    const newIdx = Math.min(histIdx + 1, commandHistory.length - 1);
    setHistIdx(newIdx);
    setCommand(commandHistory[newIdx] ?? "");
  };

  const bottomPad = Platform.OS === "web" ? 0 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.terminalBg }]}>
      {/* Header */}
      <View style={[styles.header, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Feather name="terminal" size={14} color={colors.terminalPrompt} />
          <Text style={[styles.headerTitle, { color: colors.terminalPrompt }]}>TERMINAL</Text>
        </View>
        <View style={styles.headerActions}>
          {activeFile && EXEC_LANGS.includes(activeFile.language) && (
            <TouchableOpacity style={styles.runBtn} onPress={handleRunCurrentFile}>
              <Feather name="play" size={13} color={colors.success} />
              <Text style={[styles.runBtnText, { color: colors.success }]}>Run</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={clearTerminal} style={styles.iconBtn}>
            <Feather name="trash-2" size={13} color={colors.mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTerminal} style={styles.iconBtn}>
            <Feather name="chevron-down" size={14} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Output */}
      <FlatList
        ref={listRef}
        data={terminalHistory}
        keyExtractor={(item) => item.id}
        style={styles.output}
        contentContainerStyle={styles.outputContent}
        renderItem={({ item }) => (
          <Text
            style={[
              styles.termLine,
              {
                color:
                  item.type === "error"
                    ? colors.terminalError
                    : item.type === "input"
                    ? colors.terminalPrompt
                    : item.type === "info"
                    ? colors.mutedText
                    : colors.terminalText,
              },
            ]}
          >
            {item.text}
          </Text>
        )}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd?.({ animated: false })
        }
      />

      {/* Loading indicator */}
      {mutation.isPending && (
        <View style={[styles.loadingRow, { borderTopColor: colors.border }]}>
          <Feather name="loader" size={12} color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>Running...</Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
        <View
          style={[
            styles.inputRow,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.terminalBg,
            },
          ]}
        >
          <Text style={[styles.prompt, { color: colors.terminalPrompt }]}>$</Text>
          <TextInput
            style={[styles.input, { color: colors.terminalText }]}
            value={command}
            onChangeText={setCommand}
            placeholder="Enter command or type 'run' to execute file..."
            placeholderTextColor={colors.mutedText}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            onSubmitEditing={handleRun}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={handleKeyUp} style={styles.iconBtn}>
            <Feather name="chevron-up" size={16} color={colors.mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRun} style={[styles.sendBtn, { backgroundColor: colors.accent }]}>
            <Feather name="send" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  runBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "rgba(78,201,176,0.15)",
  },
  runBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  iconBtn: { padding: 4 },
  output: { flex: 1 },
  outputContent: {
    padding: 10,
    gap: 2,
  },
  termLine: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopWidth: 1,
  },
  loadingText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  prompt: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "bold" as const,
  },
  input: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 13,
    paddingVertical: 2,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
