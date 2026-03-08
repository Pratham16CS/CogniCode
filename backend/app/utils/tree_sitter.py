"""Tree-sitter-free static analysis helpers.

Provides lightweight AST-like analysis using regex patterns for
function/class extraction without the tree-sitter native dependency.
This keeps the MVP zero-dependency on C compilers.
"""

import re
from typing import List, Dict


def extract_code_structure(content: str, language: str) -> Dict:
    """Extract high-level code structure (functions, classes, imports) from source code."""
    structure = {
        "imports": [],
        "classes": [],
        "functions": [],
        "line_count": len(content.split("\n")),
    }

    if language in ("python",):
        structure["imports"] = _extract_python_imports(content)
        structure["classes"] = _extract_python_classes(content)
        structure["functions"] = _extract_python_functions(content)
    elif language in ("javascript", "typescript"):
        structure["imports"] = _extract_js_imports(content)
        structure["classes"] = _extract_js_classes(content)
        structure["functions"] = _extract_js_functions(content)
    elif language in ("java", "kotlin"):
        structure["imports"] = _extract_java_imports(content)
        structure["classes"] = _extract_java_classes(content)
        structure["functions"] = _extract_java_methods(content)
    elif language in ("c", "cpp"):
        structure["imports"] = _extract_c_includes(content)
        structure["functions"] = _extract_c_functions(content)
    elif language in ("go",):
        structure["imports"] = _extract_go_imports(content)
        structure["functions"] = _extract_go_functions(content)
    elif language in ("rust",):
        structure["imports"] = _extract_rust_uses(content)
        structure["functions"] = _extract_rust_functions(content)

    return structure


# --- Python ---
def _extract_python_imports(content: str) -> List[str]:
    pattern = r'^(?:from\s+\S+\s+)?import\s+.+'
    return re.findall(pattern, content, re.MULTILINE)

def _extract_python_classes(content: str) -> List[str]:
    return re.findall(r'^class\s+(\w+)', content, re.MULTILINE)

def _extract_python_functions(content: str) -> List[str]:
    return re.findall(r'^(?:async\s+)?def\s+(\w+)', content, re.MULTILINE)


# --- JavaScript / TypeScript ---
def _extract_js_imports(content: str) -> List[str]:
    return re.findall(r'^import\s+.+', content, re.MULTILINE)

def _extract_js_classes(content: str) -> List[str]:
    return re.findall(r'class\s+(\w+)', content)

def _extract_js_functions(content: str) -> List[str]:
    patterns = [
        r'(?:export\s+)?(?:async\s+)?function\s+(\w+)',
        r'(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(',
        r'(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\w+\s*=>\s*',
    ]
    funcs = []
    for p in patterns:
        funcs.extend(re.findall(p, content))
    return list(set(funcs))


# --- Java ---
def _extract_java_imports(content: str) -> List[str]:
    return re.findall(r'^import\s+.+;', content, re.MULTILINE)

def _extract_java_classes(content: str) -> List[str]:
    return re.findall(r'(?:public|private|protected)?\s*class\s+(\w+)', content)

def _extract_java_methods(content: str) -> List[str]:
    return re.findall(
        r'(?:public|private|protected)\s+(?:static\s+)?(?:\w+\s+)+(\w+)\s*\(', content
    )


# --- C / C++ ---
def _extract_c_includes(content: str) -> List[str]:
    return re.findall(r'^#include\s+[<"].+[>"]', content, re.MULTILINE)

def _extract_c_functions(content: str) -> List[str]:
    return re.findall(r'^\w[\w\s\*]+\s+(\w+)\s*\([^)]*\)\s*\{', content, re.MULTILINE)


# --- Go ---
def _extract_go_imports(content: str) -> List[str]:
    single = re.findall(r'^import\s+"[^"]+"', content, re.MULTILINE)
    block = re.findall(r'^import\s*\((.*?)\)', content, re.DOTALL | re.MULTILINE)
    imports = single
    for b in block:
        imports.extend(line.strip().strip('"') for line in b.strip().split("\n") if line.strip())
    return imports

def _extract_go_functions(content: str) -> List[str]:
    return re.findall(r'^func\s+(?:\([^)]+\)\s+)?(\w+)', content, re.MULTILINE)


# --- Rust ---
def _extract_rust_uses(content: str) -> List[str]:
    return re.findall(r'^use\s+.+;', content, re.MULTILINE)

def _extract_rust_functions(content: str) -> List[str]:
    return re.findall(r'(?:pub\s+)?(?:async\s+)?fn\s+(\w+)', content)
