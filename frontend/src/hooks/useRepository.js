/**
 * Custom hook for repository data fetching and polling.
 */

import { useCallback, useEffect, useRef } from "react";
import useAppStore from "../store/appStore";
import { repoAPI, fileAPI } from "../api/client";

export function useRepository() {
    const { activeRepo, setActiveRepo, setFiles, setFileTree, updateRepoStatus, setAnalysisStatus, setAnalysisProgress } = useAppStore();
    const pollRef = useRef(null);

    const submitRepo = useCallback(
        async (repoUrl, githubPat) => {
            const res = await repoAPI.analyze({ repo_url: repoUrl, github_pat: githubPat || undefined });
            setActiveRepo(res.data);
            setAnalysisStatus(res.data.status);
            return res.data;
        },
        [setActiveRepo, setAnalysisStatus]
    );

    const loadRepo = useCallback(
        async (repoId) => {
            const res = await repoAPI.get(repoId);
            setActiveRepo(res.data);
            setAnalysisStatus(res.data.status);
            if (res.data.status === "ready") {
                const filesRes = await fileAPI.list(repoId);
                setFiles(filesRes.data);
                const treeRes = await fileAPI.tree(repoId);
                setFileTree(treeRes.data);
            }
            return res.data;
        },
        [setActiveRepo, setFiles, setFileTree, setAnalysisStatus]
    );

    // Poll for analysis status
    const startPolling = useCallback(
        (repoId) => {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(async () => {
                try {
                    const res = await repoAPI.get(repoId);
                    updateRepoStatus(repoId, res.data);
                    setAnalysisStatus(res.data.status);
                    setAnalysisProgress({
                        total: res.data.total_files,
                        indexed: res.data.indexed_files,
                    });
                    if (res.data.status === "ready" || res.data.status === "error") {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                        if (res.data.status === "ready") {
                            const filesRes = await fileAPI.list(repoId);
                            setFiles(filesRes.data);
                            const treeRes = await fileAPI.tree(repoId);
                            setFileTree(treeRes.data);
                        }
                    }
                } catch (e) {
                    console.error("Poll error:", e);
                }
            }, 3000);
        },
        [updateRepoStatus, setAnalysisStatus, setAnalysisProgress, setFiles, setFileTree]
    );

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    return { submitRepo, loadRepo, startPolling, stopPolling, activeRepo };
}
