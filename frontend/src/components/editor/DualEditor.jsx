/**
 * DualEditor — side-by-side view: Original Source (left) | Logic Skeleton (right).
 */

import { useRef, useCallback } from "react";
import EditorPane from "./EditorPane";
import useAppStore from "../../store/appStore";

export default function DualEditor() {
    const { selectedFile, originalContent, skeletonContent, updateSkeletonContent } = useAppStore();
    const skeletonEditorRef = useRef(null);

    const handleSkeletonMount = useCallback((editor) => {
        skeletonEditorRef.current = editor;
    }, []);

    // Expose editor ref for agentic edits
    if (typeof window !== "undefined") {
        window.__cognicode_skeleton_editor = skeletonEditorRef;
    }

    const language = selectedFile?.language || "plaintext";

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left — Original Source (Read-Only) */}
            <div className="flex-1 border-r border-border overflow-hidden">
                <EditorPane
                    value={originalContent}
                    language={language}
                    readOnly={true}
                    label="Original Source"
                    labelColor="#6366f1"
                />
            </div>

            {/* Right — Logic Skeleton (Editable) */}
            <div className="flex-1 overflow-hidden">
                <EditorPane
                    value={skeletonContent}
                    language={language}
                    readOnly={false}
                    onChange={(val) => updateSkeletonContent(val)}
                    onMount={handleSkeletonMount}
                    label="Logic Skeleton"
                    labelColor="#10b981"
                />
            </div>
        </div>
    );
}
