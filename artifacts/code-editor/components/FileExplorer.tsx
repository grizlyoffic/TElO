import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { type FileItem, type SupportedLanguage, useIDE } from "@/context/IDEContext";
import NewFileModal from "./NewFileModal";

const FILE_ICONS: Record<string, string> = {
  ".py": "layers",
  ".js": "zap",
  ".ts": "zap",
  ".tsx": "zap",
  ".jsx": "zap",
  ".java": "coffee",
  ".sh": "terminal",
  ".html": "globe",
  ".css": "droplet",
  ".json": "database",
  ".md": "file-text",
  ".txt": "file-text",
};

const FILE_COLORS: Record<string, string> = {
  ".py": "#3776ab",
  ".js": "#f7df1e",
  ".ts": "#3178c6",
  ".tsx": "#3178c6",
  ".jsx": "#61dafb",
  ".java": "#ed8b00",
  ".sh": "#4ec9b0",
  ".html": "#e34c26",
  ".css": "#264de4",
  ".json": "#cbcb41",
  ".md": "#083fa1",
};

function getExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : "";
}

function FileIcon({ name, size = 16 }: { name: string; size?: number }) {
  const ext = getExt(name);
  const icon = FILE_ICONS[ext] ?? "file";
  const color = FILE_COLORS[ext] ?? "#858585";
  return <Feather name={icon as any} size={size} color={color} />;
}

export default function FileExplorer() {
  const {
    currentProject,
    openFiles,
    activeFile,
    colors,
    openFile,
    deleteFile,
    createFile,
    createProject,
    setActivePanel,
  } = useIDE();
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const handleFilePress = (file: FileItem) => {
    Haptics.selectionAsync();
    openFile(file);
  };

  const handleLongPress = (file: FileItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(file.name, undefined, [
      { text: "Open", onPress: () => openFile(file) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete file?", `Delete "${file.name}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteFile(file.id) },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleCreateFile = (name: string, language: SupportedLanguage) => {
    const file = createFile(name, language);
    if (file) {
      openFile(file);
    }
    setShowNewFile(false);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProject(newProjectName.trim());
    setNewProjectName("");
    setShowNewProject(false);
  };

  if (!currentProject) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.sidebar }]}>
        {showNewProject ? (
          <View style={styles.newProjectForm}>
            <Text style={[styles.label, { color: colors.text }]}>Project name</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.input },
              ]}
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholder="my-project"
              placeholderTextColor={colors.mutedText}
              autoFocus
              onSubmitEditing={handleCreateProject}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.accent }]}
                onPress={handleCreateProject}
              >
                <Text style={[styles.btnText, { color: "#fff" }]}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.muted }]}
                onPress={() => setShowNewProject(false)}
              >
                <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Feather name="folder" size={48} color={colors.mutedText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Project Open</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
              Create a project to start coding
            </Text>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowNewProject(true)}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.createBtnText}>New Project</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  const files = currentProject.files;

  return (
    <View style={[styles.container, { backgroundColor: colors.sidebar }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.mutedText }]}>EXPLORER</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowNewFile(true)} style={styles.headerBtn}>
            <Feather name="file-plus" size={16} color={colors.mutedText} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowNewProject(true)}
            style={styles.headerBtn}
          >
            <Feather name="folder-plus" size={16} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Project name */}
      <View style={[styles.projectRow, { borderBottomColor: colors.border }]}>
        <Feather name="chevron-down" size={14} color={colors.mutedText} />
        <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
          {currentProject.name.toUpperCase()}
        </Text>
      </View>

      {/* File list */}
      {files.length === 0 ? (
        <View style={styles.noFiles}>
          <Text style={[styles.noFilesText, { color: colors.mutedText }]}>No files yet</Text>
          <TouchableOpacity
            style={[styles.addFileBtn, { borderColor: colors.border }]}
            onPress={() => setShowNewFile(true)}
          >
            <Feather name="plus" size={14} color={colors.accent} />
            <Text style={[styles.addFileBtnText, { color: colors.accent }]}>New File</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          scrollEnabled={!!files.length}
          renderItem={({ item }) => {
            const isOpen = openFiles.some((f) => f.id === item.id);
            const isActive = activeFile?.id === item.id;
            const isModified = openFiles.find((f) => f.id === item.id)?.modified;
            return (
              <TouchableOpacity
                style={[
                  styles.fileRow,
                  isActive && { backgroundColor: colors.selection },
                ]}
                onPress={() => handleFilePress(item)}
                onLongPress={() => handleLongPress(item)}
                activeOpacity={0.7}
              >
                <FileIcon name={item.name} />
                <Text
                  style={[
                    styles.fileName,
                    { color: isOpen ? colors.text : colors.mutedText },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {isModified && (
                  <View style={[styles.modDot, { backgroundColor: colors.accent }]} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <NewFileModal
        visible={showNewFile}
        onClose={() => setShowNewFile(false)}
        onCreate={handleCreateFile}
      />

      {showNewProject && (
        <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.newProjectForm, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>New Project</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.input },
              ]}
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholder="project-name"
              placeholderTextColor={colors.mutedText}
              autoFocus
              onSubmitEditing={handleCreateProject}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.accent }]}
                onPress={handleCreateProject}
              >
                <Text style={[styles.btnText, { color: "#fff" }]}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.muted }]}
                onPress={() => setShowNewProject(false)}
              >
                <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  headerActions: { flexDirection: "row", gap: 12 },
  headerBtn: { padding: 2 },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  projectName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    flex: 1,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 7,
    gap: 8,
  },
  fileName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  modDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  noFiles: {
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  noFilesText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  addFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
  },
  addFileBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  newProjectForm: {
    width: "85%",
    padding: 20,
    borderRadius: 8,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  btnRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
  },
  btnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
