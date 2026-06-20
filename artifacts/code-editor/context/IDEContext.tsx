import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { THEMES, type IDEColors, type ThemeType } from "@/constants/colors";

export type SupportedLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "java"
  | "bash"
  | "html"
  | "css"
  | "json"
  | "text";

export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
  python: ".py",
  javascript: ".js",
  typescript: ".ts",
  java: ".java",
  bash: ".sh",
  html: ".html",
  css: ".css",
  json: ".json",
  text: ".txt",
};

export const LANGUAGE_FROM_EXT: Record<string, SupportedLanguage> = {
  ".py": "python",
  ".js": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".jsx": "javascript",
  ".java": "java",
  ".sh": "bash",
  ".html": "html",
  ".css": "css",
  ".json": "json",
  ".txt": "text",
  ".md": "text",
};

export interface FileItem {
  id: string;
  name: string;
  content: string;
  language: SupportedLanguage;
  path: string;
  modified: boolean;
}

export interface Project {
  id: string;
  name: string;
  files: FileItem[];
  createdAt: number;
}

export type ActivePanel = "files" | "editor" | "terminal" | "git" | "settings";

export interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "info";
  text: string;
}

const STORAGE_KEYS = {
  PROJECTS: "ide_projects",
  CURRENT_PROJECT: "ide_current_project",
  THEME: "ide_theme",
  GITHUB_TOKEN: "ide_github_token",
  GITHUB_USERNAME: "ide_github_username",
  FONT_SIZE: "ide_font_size",
};

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface IDEContextType {
  // State
  projects: Project[];
  currentProject: Project | null;
  openFiles: FileItem[];
  activeFile: FileItem | null;
  activePanel: ActivePanel;
  terminalOpen: boolean;
  terminalHistory: TerminalLine[];
  theme: ThemeType;
  colors: IDEColors;
  githubToken: string;
  githubUsername: string;
  fontSize: number;
  loading: boolean;

  // Project actions
  createProject: (name: string) => void;
  deleteProject: (id: string) => void;
  selectProject: (project: Project) => void;

  // File actions
  createFile: (name: string, language: SupportedLanguage) => FileItem | null;
  deleteFile: (id: string) => void;
  openFile: (file: FileItem) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  saveFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;

  // Panel actions
  setActivePanel: (panel: ActivePanel) => void;
  toggleTerminal: () => void;

  // Terminal
  addTerminalLine: (line: Omit<TerminalLine, "id">) => void;
  clearTerminal: () => void;

  // Settings
  setTheme: (theme: ThemeType) => void;
  setGithubToken: (token: string) => void;
  setGithubUsername: (username: string) => void;
  setFontSize: (size: number) => void;
}

const IDEContext = createContext<IDEContextType | null>(null);

export function IDEProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFileState] = useState<FileItem | null>(null);
  const [activePanel, setActivePanelState] = useState<ActivePanel>("files");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { id: "1", type: "info", text: "VS Code Mobile Terminal ready. Type commands below." },
  ]);
  const [theme, setThemeState] = useState<ThemeType>("dark");
  const [githubToken, setGithubTokenState] = useState("");
  const [githubUsername, setGithubUsernameState] = useState("");
  const [fontSize, setFontSizeState] = useState(14);
  const [loading, setLoading] = useState(true);

  const colors = THEMES[theme];

  // Load persisted state
  useEffect(() => {
    const load = async () => {
      try {
        const [storedProjects, storedCurrentId, storedTheme, storedToken, storedUsername, storedFontSize] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
            AsyncStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT),
            AsyncStorage.getItem(STORAGE_KEYS.THEME),
            AsyncStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN),
            AsyncStorage.getItem(STORAGE_KEYS.GITHUB_USERNAME),
            AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
          ]);

        let loadedProjects: Project[] = [];
        if (storedProjects) {
          loadedProjects = JSON.parse(storedProjects);
          setProjects(loadedProjects);
        }

        if (storedCurrentId && loadedProjects.length > 0) {
          const proj = loadedProjects.find((p) => p.id === storedCurrentId);
          if (proj) setCurrentProject(proj);
        }

        if (storedTheme) setThemeState(storedTheme as ThemeType);
        if (storedToken) setGithubTokenState(storedToken);
        if (storedUsername) setGithubUsernameState(storedUsername);
        if (storedFontSize) setFontSizeState(Number(storedFontSize));
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const persistProjects = useCallback(async (updated: Project[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
  }, []);

  // Project actions
  const createProject = useCallback(
    (name: string) => {
      const project: Project = {
        id: genId(),
        name,
        files: [],
        createdAt: Date.now(),
      };
      const updated = [...projects, project];
      setProjects(updated);
      setCurrentProject(project);
      setOpenFiles([]);
      setActiveFileState(null);
      persistProjects(updated);
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, project.id);
    },
    [projects, persistProjects]
  );

  const deleteProject = useCallback(
    (id: string) => {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      if (currentProject?.id === id) {
        setCurrentProject(updated[0] ?? null);
        setOpenFiles([]);
        setActiveFileState(null);
      }
      persistProjects(updated);
    },
    [projects, currentProject, persistProjects]
  );

  const selectProject = useCallback(
    (project: Project) => {
      setCurrentProject(project);
      setOpenFiles([]);
      setActiveFileState(null);
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, project.id);
    },
    []
  );

  // File actions
  const createFile = useCallback(
    (name: string, language: SupportedLanguage): FileItem | null => {
      if (!currentProject) return null;
      const ext = LANGUAGE_EXTENSIONS[language];
      const finalName = name.includes(".") ? name : name + ext;
      const file: FileItem = {
        id: genId(),
        name: finalName,
        content: getFileTemplate(language, finalName),
        language,
        path: `/${currentProject.name}/${finalName}`,
        modified: false,
      };
      const updatedProject = {
        ...currentProject,
        files: [...currentProject.files, file],
      };
      const updatedProjects = projects.map((p) =>
        p.id === currentProject.id ? updatedProject : p
      );
      setCurrentProject(updatedProject);
      setProjects(updatedProjects);
      persistProjects(updatedProjects);
      return file;
    },
    [currentProject, projects, persistProjects]
  );

  const deleteFile = useCallback(
    (id: string) => {
      if (!currentProject) return;
      const updatedProject = {
        ...currentProject,
        files: currentProject.files.filter((f) => f.id !== id),
      };
      const updatedProjects = projects.map((p) =>
        p.id === currentProject.id ? updatedProject : p
      );
      setCurrentProject(updatedProject);
      setProjects(updatedProjects);
      setOpenFiles((prev) => prev.filter((f) => f.id !== id));
      setActiveFileState((prev) => (prev?.id === id ? null : prev));
      persistProjects(updatedProjects);
    },
    [currentProject, projects, persistProjects]
  );

  const openFile = useCallback((file: FileItem) => {
    setOpenFiles((prev) => {
      if (prev.find((f) => f.id === file.id)) return prev;
      return [...prev, file];
    });
    setActiveFileState(file);
    setActivePanelState("editor");
  }, []);

  const closeFile = useCallback((id: string) => {
    setOpenFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== id);
      return filtered;
    });
    setActiveFileState((prev) => {
      if (prev?.id !== id) return prev;
      const remaining = openFiles.filter((f) => f.id !== id);
      return remaining[remaining.length - 1] ?? null;
    });
  }, [openFiles]);

  const setActiveFile = useCallback(
    (id: string) => {
      const file = openFiles.find((f) => f.id === id);
      if (file) setActiveFileState(file);
    },
    [openFiles]
  );

  const updateFileContent = useCallback(
    (id: string, content: string) => {
      setOpenFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, content, modified: true } : f))
      );
      setActiveFileState((prev) =>
        prev?.id === id ? { ...prev, content, modified: true } : prev
      );
    },
    []
  );

  const saveFile = useCallback(
    (id: string) => {
      if (!currentProject) return;
      const file = openFiles.find((f) => f.id === id);
      if (!file) return;

      const savedFile = { ...file, modified: false };
      setOpenFiles((prev) => prev.map((f) => (f.id === id ? savedFile : f)));
      setActiveFileState((prev) => (prev?.id === id ? savedFile : prev));

      const updatedProject = {
        ...currentProject,
        files: currentProject.files.map((f) =>
          f.id === id ? savedFile : f
        ),
      };
      const updatedProjects = projects.map((p) =>
        p.id === currentProject.id ? updatedProject : p
      );
      setCurrentProject(updatedProject);
      setProjects(updatedProjects);
      persistProjects(updatedProjects);
    },
    [currentProject, openFiles, projects, persistProjects]
  );

  const renameFile = useCallback(
    (id: string, newName: string) => {
      if (!currentProject) return;
      const updatedProject = {
        ...currentProject,
        files: currentProject.files.map((f) =>
          f.id === id ? { ...f, name: newName } : f
        ),
      };
      const updatedProjects = projects.map((p) =>
        p.id === currentProject.id ? updatedProject : p
      );
      setCurrentProject(updatedProject);
      setProjects(updatedProjects);
      setOpenFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
      );
      setActiveFileState((prev) =>
        prev?.id === id ? { ...prev, name: newName } : prev
      );
      persistProjects(updatedProjects);
    },
    [currentProject, projects, persistProjects]
  );

  const setActivePanel = useCallback((panel: ActivePanel) => {
    setActivePanelState(panel);
  }, []);

  const toggleTerminal = useCallback(() => {
    setTerminalOpen((prev) => !prev);
  }, []);

  const addTerminalLine = useCallback((line: Omit<TerminalLine, "id">) => {
    setTerminalHistory((prev) => [
      ...prev,
      { ...line, id: genId() },
    ]);
  }, []);

  const clearTerminal = useCallback(() => {
    setTerminalHistory([
      { id: genId(), type: "info", text: "Terminal cleared." },
    ]);
  }, []);

  const setTheme = useCallback((t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem(STORAGE_KEYS.THEME, t);
  }, []);

  const setGithubToken = useCallback((token: string) => {
    setGithubTokenState(token);
    AsyncStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
  }, []);

  const setGithubUsername = useCallback((username: string) => {
    setGithubUsernameState(username);
    AsyncStorage.setItem(STORAGE_KEYS.GITHUB_USERNAME, username);
  }, []);

  const setFontSize = useCallback((size: number) => {
    setFontSizeState(size);
    AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(size));
  }, []);

  return (
    <IDEContext.Provider
      value={{
        projects,
        currentProject,
        openFiles,
        activeFile,
        activePanel,
        terminalOpen,
        terminalHistory,
        theme,
        colors,
        githubToken,
        githubUsername,
        fontSize,
        loading,
        createProject,
        deleteProject,
        selectProject,
        createFile,
        deleteFile,
        openFile,
        closeFile,
        setActiveFile,
        updateFileContent,
        saveFile,
        renameFile,
        setActivePanel,
        toggleTerminal,
        addTerminalLine,
        clearTerminal,
        setTheme,
        setGithubToken,
        setGithubUsername,
        setFontSize,
      }}
    >
      {children}
    </IDEContext.Provider>
  );
}

export function useIDE() {
  const ctx = useContext(IDEContext);
  if (!ctx) throw new Error("useIDE must be used within IDEProvider");
  return ctx;
}

function getFileTemplate(language: SupportedLanguage, name: string): string {
  switch (language) {
    case "python":
      return `# ${name}\n\nprint("Hello, World!")\n`;
    case "javascript":
      return `// ${name}\n\nconsole.log("Hello, World!");\n`;
    case "typescript":
      return `// ${name}\n\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);\n`;
    case "java":
      const className = name.replace(".java", "");
      return `public class ${className} {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`;
    case "html":
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>${name}</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n`;
    case "css":
      return `/* ${name} */\n\nbody {\n    font-family: sans-serif;\n    margin: 0;\n    padding: 0;\n}\n`;
    case "json":
      return `{\n  "name": "project",\n  "version": "1.0.0"\n}\n`;
    case "bash":
      return `#!/bin/bash\n\necho "Hello, World!"\n`;
    default:
      return `# ${name}\n`;
  }
}
