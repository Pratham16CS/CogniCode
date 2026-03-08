/**
 * EditorPane — single Monaco editor wrapper.
 */

import Editor from "@monaco-editor/react";

const langMap = {
    python: "python",
    javascript: "javascript",
    typescript: "typescript",
    java: "java",
    c: "c",
    cpp: "cpp",
    html: "html",
    css: "css",
    go: "go",
    rust: "rust",
    json: "json",
    yaml: "yaml",
    markdown: "markdown",
    shell: "shell",
    sql: "sql",
};

export default function EditorPane({
    value,
    language,
    readOnly = false,
    onChange,
    label,
    labelColor = "#6366f1",
    onMount,
}) {
    const monacoLang = langMap[language] || "plaintext";

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#050f23]">
            <div
                className="flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] font-sans font-semibold border-b border-accent/20 bg-[#0a1428]/95 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.2)] z-10"
                style={{ color: labelColor }}
            >
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: labelColor }}
                />
                {label}
                {readOnly && (
                    <span className="ml-auto text-text-muted text-[10px] uppercase tracking-wider">
                        Read Only
                    </span>
                )}
            </div>
            <div className="flex-1">
                <Editor
                    theme="vs-dark"
                    language={monacoLang}
                    value={value || "// Select a file from the sidebar"}
                    onChange={onChange}
                    onMount={onMount}
                    options={{
                        readOnly,
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        automaticLayout: true,
                        padding: { top: 8, bottom: 8 },
                        renderLineHighlight: "gutter",
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        fontFamily: "'Space Mono', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        fontLigatures: true,
                    }}
                />
            </div>
        </div>
    );
}
