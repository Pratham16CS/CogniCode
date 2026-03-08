/**
 * Zustand store — global state management for CogniCode.
 * Manages: auth, active repo, file tree, selected file, editor content, chat.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAppStore = create(
    persist(
        (set, get) => ({
            // === Auth ===
            token: null,
            user: null,
            setAuth: (token, user) => set({ token, user }),
            logout: () => set({ token: null, user: null, activeRepo: null, files: [], selectedFile: null }),

            // === Repository ===
            activeRepo: null,
            repos: [],
            setActiveRepo: (repo) => set({ activeRepo: repo, selectedFile: null, files: [] }),
            setRepos: (repos) => set({ repos }),
            updateRepoStatus: (repoId, updates) =>
                set((state) => ({
                    activeRepo:
                        state.activeRepo?.id === repoId
                            ? { ...state.activeRepo, ...updates }
                            : state.activeRepo,
                    repos: state.repos.map((r) =>
                        r.id === repoId ? { ...r, ...updates } : r
                    ),
                })),

            // === Files ===
            files: [],
            fileTree: [],
            selectedFile: null,
            setFiles: (files) => set({ files }),
            setFileTree: (fileTree) => set({ fileTree }),
            setSelectedFile: (file) => set({ selectedFile: file }),

            // === Editor ===
            originalContent: "",
            skeletonContent: "",
            setEditorContent: (original, skeleton) =>
                set({ originalContent: original, skeletonContent: skeleton }),
            updateSkeletonContent: (content) => set({ skeletonContent: content }),

            // === Chat ===
            chatMessages: [],
            isChatLoading: false,
            addChatMessage: (message) =>
                set((state) => ({
                    chatMessages: [...state.chatMessages, message],
                })),
            setChatMessages: (messages) => set({ chatMessages: messages }),
            setChatLoading: (loading) => set({ isChatLoading: loading }),

            // === Analysis ===
            analysisStatus: "idle", // idle | cloning | indexing | ready | error
            analysisProgress: { total: 0, indexed: 0 },
            setAnalysisStatus: (status) => set({ analysisStatus: status }),
            setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
        }),
        {
            name: "cognicode-store",
            partialize: (state) => ({
                token: state.token,
                user: state.user,
            }),
        }
    )
);

export default useAppStore;
