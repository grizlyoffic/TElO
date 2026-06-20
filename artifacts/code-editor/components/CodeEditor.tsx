import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { type SupportedLanguage, useIDE } from "@/context/IDEContext";

// --- Syntax Tokenizer ---

type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "func"
  | "type"
  | "operator"
  | "default";

interface Token {
  text: string;
  type: TokenType;
}

const PY_KEYWORDS = new Set([
  "def","class","import","from","return","if","elif","else","for","while",
  "in","not","and","or","True","False","None","try","except","finally",
  "with","as","lambda","pass","break","continue","yield","async","await",
  "global","nonlocal","del","raise","assert","is","print","len","range",
  "int","str","float","list","dict","tuple","set","bool","type",
]);

const JS_KEYWORDS = new Set([
  "function","const","let","var","return","if","else","for","while","in",
  "of","import","export","default","class","extends","new","this","typeof",
  "instanceof","try","catch","finally","throw","async","await","true",
  "false","null","undefined","void","delete","switch","case","break",
  "continue","yield","from","static","get","set","console","log","require",
  "module","exports","Promise","Array","Object","String","Number","Boolean",
]);

function tokenizeLine(line: string, lang: SupportedLanguage): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const keywords = lang === "python" ? PY_KEYWORDS : JS_KEYWORDS;

  while (i < line.length) {
    // Comment
    if (lang === "python" && line[i] === "#") {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }
    if (
      (lang === "javascript" || lang === "typescript") &&
      line[i] === "/" &&
      line[i + 1] === "/"
    ) {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }

    // String
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === "\\") j++;
        j++;
      }
      j = Math.min(j + 1, line.length);
      tokens.push({ text: line.slice(i, j), type: "string" });
      i = j;
      continue;
    }

    // Number
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[0-9._xXbBoO]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: "number" });
      i = j;
      continue;
    }

    // Word (keyword, type, or identifier)
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);

      // Check if followed by ( -> function call
      const afterWord = line.slice(j).trimStart();
      if (afterWord.startsWith("(") && !keywords.has(word)) {
        tokens.push({ text: word, type: "func" });
      } else if (keywords.has(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ text: word, type: "type" });
      } else {
        tokens.push({ text: word, type: "default" });
      }
      i = j;
      continue;
    }

    // Operator/punctuation
    tokens.push({ text: line[i], type: "operator" });
    i++;
  }

  return tokens;
}

function tokenizeCode(code: string, lang: SupportedLanguage): Token[][] {
  const lines = code.split("\n");
  // Only tokenize languages we support
  const supported: SupportedLanguage[] = ["python", "javascript", "typescript"];
  if (!supported.includes(lang)) {
    return lines.map((line) => [{ text: line, type: "default" }]);
  }
  return lines.map((line) => tokenizeLine(line, lang));
}

function getTokenColor(type: TokenType, colors: any): string {
  switch (type) {
    case "keyword": return colors.keyword;
    case "string": return colors.string;
    case "comment": return colors.comment;
    case "number": return colors.number;
    case "func": return colors.func;
    case "type": return colors.type;
    case "operator": return colors.operator;
    default: return colors.text;
  }
}

// --- Editor Tabs ---
function EditorTabs() {
  const { openFiles, activeFile, closeFile, setActiveFile, colors } = useIDE();
  if (openFiles.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.tabsScroll, { backgroundColor: colors.tab }]}
    >
      {openFiles.map((file) => {
        const isActive = activeFile?.id === file.id;
        return (
          <TouchableOpacity
            key={file.id}
            style={[
              styles.editorTab,
              {
                backgroundColor: isActive ? colors.activeTab : colors.tab,
                borderBottomColor: isActive ? colors.activeTabBorder : "transparent",
              },
            ]}
            onPress={() => setActiveFile(file.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabName,
                { color: isActive ? colors.text : colors.mutedText },
              ]}
              numberOfLines={1}
            >
              {file.name}
              {file.modified ? " \u25CF" : ""}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                closeFile(file.id);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name="x"
                size={12}
                color={isActive ? colors.mutedText : "transparent"}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// --- Main Code Editor ---
export default function CodeEditor() {
  const { activeFile, colors, fontSize, updateFileContent, saveFile, toggleTerminal } = useIDE();
  const [isEditing, setIsEditing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSave = useCallback(() => {
    if (!activeFile) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveFile(activeFile.id);
    setIsEditing(false);
  }, [activeFile, saveFile]);

  if (!activeFile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EditorTabs />
        <View style={styles.welcomeContainer}>
          <Feather name="code" size={64} color={colors.mutedText} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            VS Code Mobile
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.mutedText }]}>
            Open a file from the Explorer to start editing
          </Text>
          <View style={styles.shortcutGrid}>
            {[
              { icon: "copy", label: "Explorer" },
              { icon: "terminal", label: "Terminal" },
              { icon: "git-branch", label: "Git" },
              { icon: "settings", label: "Settings" },
            ].map((item) => (
              <View
                key={item.label}
                style={[styles.shortcutItem, { backgroundColor: colors.card }]}
              >
                <Feather name={item.icon as any} size={20} color={colors.accent} />
                <Text style={[styles.shortcutLabel, { color: colors.mutedText }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const tokenizedLines = tokenizeCode(activeFile.content, activeFile.language);
  const lineCount = activeFile.content.split("\n").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EditorTabs />

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.titleBar, borderBottomColor: colors.border }]}>
        <Text style={[styles.langBadge, { color: colors.mutedText }]}>
          {activeFile.language}
        </Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={toggleTerminal}
          >
            <Feather name="terminal" size={15} color={colors.mutedText} />
          </TouchableOpacity>
          {isEditing ? (
            <TouchableOpacity
              style={[styles.toolbarBtn, { backgroundColor: colors.success + "33" }]}
              onPress={handleSave}
            >
              <Feather name="save" size={15} color={colors.success} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.toolbarBtn, { backgroundColor: colors.accent + "22" }]}
              onPress={() => setIsEditing(true)}
            >
              <Feather name="edit-2" size={15} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Editor Content */}
      {isEditing ? (
        // Edit mode - TextInput
        <View style={styles.editContainer}>
          <ScrollView horizontal style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }}>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    color: colors.text,
                    fontSize,
                    backgroundColor: colors.background,
                    minHeight: Math.max(lineCount * (fontSize * 1.5), 200),
                  },
                ]}
                value={activeFile.content}
                onChangeText={(text) => updateFileContent(activeFile.id, text)}
                multiline
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                textAlignVertical="top"
                scrollEnabled={false}
              />
            </ScrollView>
          </ScrollView>
        </View>
      ) : (
        // Display mode - Syntax highlighted
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          horizontal={false}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.codeBody}>
              {/* Line numbers */}
              <View style={[styles.lineNumbers, { borderRightColor: colors.border }]}>
                {tokenizedLines.map((_, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.lineNum,
                      { color: colors.lineNumber, fontSize: fontSize - 2 },
                    ]}
                  >
                    {i + 1}
                  </Text>
                ))}
              </View>

              {/* Code content */}
              <View style={styles.codeContent}>
                {tokenizedLines.map((lineTokens, i) => (
                  <View key={i} style={[styles.codeLine, { minHeight: fontSize * 1.6 }]}>
                    {lineTokens.map((token, j) => (
                      <Text
                        key={j}
                        style={{
                          color: getTokenColor(token.type, colors),
                          fontSize,
                          fontFamily: "monospace",
                          lineHeight: fontSize * 1.6,
                        }}
                      >
                        {token.text}
                      </Text>
                    ))}
                    {lineTokens.length === 0 && (
                      <Text style={{ fontSize, lineHeight: fontSize * 1.6 }}>{" "}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.statusBar }]}>
        <Text style={styles.statusText}>
          {activeFile.language} | Ln {lineCount} | {activeFile.modified ? "Modified" : "Saved"}
        </Text>
        {isEditing && (
          <Text style={styles.statusText}>-- INSERT --</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsScroll: { maxHeight: 36 },
  editorTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 2,
    minWidth: 100,
  },
  tabName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    maxWidth: 120,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  langBadge: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  toolbarActions: { flexDirection: "row", gap: 8 },
  toolbarBtn: {
    padding: 6,
    borderRadius: 4,
  },
  editContainer: { flex: 1 },
  editInput: {
    fontFamily: "monospace",
    padding: 12,
    textAlignVertical: "top",
  },
  codeBody: {
    flexDirection: "row",
    minWidth: "100%",
  },
  lineNumbers: {
    paddingVertical: 8,
    paddingRight: 10,
    paddingLeft: 8,
    alignItems: "flex-end",
    borderRightWidth: 1,
    minWidth: 44,
  },
  lineNum: {
    fontFamily: "monospace",
    lineHeight: 21,
  },
  codeContent: {
    padding: 8,
    flex: 1,
  },
  codeLine: {
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 12,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  shortcutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
    justifyContent: "center",
  },
  shortcutItem: {
    width: 100,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  shortcutLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
