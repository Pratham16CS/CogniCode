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
        <div className="flex flex-col h-full overflow-hidden">
            <div
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border-b border-border"
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
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        fontLigatures: true,
                    }}
                />
            </div>
        </div>
    );
}
