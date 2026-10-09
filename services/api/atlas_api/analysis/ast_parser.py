import re
from pathlib import Path
from typing import List, Dict, Any, Optional

PARSER_LANGUAGE_MAP = {
    ".c": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".h": "cpp",
    ".hpp": "cpp",
    ".hh": "cpp",
    ".hxx": "cpp",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".py": "python",
    ".pyi": "python",
}

CPP_QUERY = """
(function_definition
  type: (_) @return_type
  declarator: (function_declarator
    declarator: (identifier) @name)
) @function

(class_specifier
  name: (type_identifier) @name
) @class

(struct_specifier
  name: (type_identifier) @name
) @struct
"""

def get_parser_language(file_path: str) -> Optional[str]:
    ext = Path(file_path).suffix.lower()
    return PARSER_LANGUAGE_MAP.get(ext)

def extract_cpp_symbols(file_path: str, content: str) -> List[Dict[str, Any]]:
    symbols: List[Dict[str, Any]] = []
    lines = content.splitlines()

    for idx, line in enumerate(lines):
        line_num = idx + 1
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue

        # class_specifier: (class_specifier name: (type_identifier) @name)
        class_match = re.search(r'^(?:template\s*<[^>]*>\s*)?class\s+([A-Za-z0-9_]+)', stripped)
        if class_match and class_match.group(1) not in {"final", "alignas"}:
            c_name = class_match.group(1)
            symbols.append({
                "id": f"{file_path}#{c_name}",
                "name": c_name,
                "kind": "class",
                "node_type": "class_specifier",
                "line": line_num,
                "signature": stripped,
            })
            continue

        # struct_specifier: (struct_specifier name: (type_identifier) @name)
        struct_match = re.search(r'^(?:template\s*<[^>]*>\s*)?(?:typedef\s+)?struct\s+([A-Za-z0-9_]+)?', stripped)
        if struct_match:
            s_name = struct_match.group(1) or f"struct_L{line_num}"
            symbols.append({
                "id": f"{file_path}#{s_name}",
                "name": s_name,
                "kind": "struct",
                "node_type": "struct_specifier",
                "line": line_num,
                "signature": stripped,
            })
            continue

        # function_definition: captures free functions, member methods, constructors, destructors
        func_match = re.search(
            r'^(?:template\s*<[^>]*>\s*)?(?:(?:inline|static|virtual|explicit|constexpr|consteval|friend|extern\s+"C"|extern)\s+)*(?:(?:[A-Za-z0-9_:<>&*~]+\s+)+)?([A-Za-z0-9_~]+(?:::[A-Za-z0-9_~]+)*)\s*\([^)]*\)\s*(?:const|noexcept|override|final|\s)*[{;]',
            stripped
        )
        if func_match and func_match.group(1):
            raw_ident = func_match.group(1)
            if raw_ident not in {"if", "for", "while", "switch", "catch", "return", "sizeof", "decltype"}:
                f_name = raw_ident.split("::")[-1]
                symbols.append({
                    "id": f"{file_path}#{raw_ident}",
                    "name": f_name,
                    "kind": "function",
                    "node_type": "function_definition",
                    "line": line_num,
                    "signature": stripped,
                })
                continue

    return symbols

def extract_typescript_symbols(file_path: str, content: str) -> List[Dict[str, Any]]:
    symbols: List[Dict[str, Any]] = []
    lines = content.splitlines()

    for idx, line in enumerate(lines):
        line_num = idx + 1
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue

        # Classes
        c_match = re.search(r'(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_]+)', stripped)
        if c_match:
            name = c_match.group(1)
            symbols.append({
                "id": f"{file_path}#{name}",
                "name": name,
                "kind": "class",
                "node_type": "class_declaration",
                "line": line_num,
                "signature": stripped,
            })
            continue

        # Interfaces
        if_match = re.search(r'(?:export\s+)?interface\s+([A-Za-z0-9_]+)', stripped)
        if if_match:
            name = if_match.group(1)
            symbols.append({
                "id": f"{file_path}#{name}",
                "name": name,
                "kind": "interface",
                "node_type": "interface_declaration",
                "line": line_num,
                "signature": stripped,
            })
            continue

        # Type aliases
        type_match = re.search(r'(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=', stripped)
        if type_match:
            name = type_match.group(1)
            symbols.append({
                "id": f"{file_path}#{name}",
                "name": name,
                "kind": "type",
                "node_type": "type_alias_declaration",
                "line": line_num,
                "signature": stripped,
            })
            continue

        # Functions
        f_match = re.search(r'(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(', stripped)
        if f_match:
            name = f_match.group(1)
            symbols.append({
                "id": f"{file_path}#{name}",
                "name": name,
                "kind": "function",
                "node_type": "function_declaration",
                "line": line_num,
                "signature": stripped,
            })
            continue

        # Arrow functions or const components
        const_f_match = re.search(r'(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::\s*[^=]+)?\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>', stripped)
        if const_f_match:
            name = const_f_match.group(1)
            symbols.append({
                "id": f"{file_path}#{name}",
                "name": name,
                "kind": "function",
                "node_type": "lexical_declaration",
                "line": line_num,
                "signature": stripped,
            })
            continue

    return symbols

def extract_python_symbols(file_path: str, content: str) -> List[Dict[str, Any]]:
    symbols: List[Dict[str, Any]] = []
    lines = content.splitlines()

    for idx, line in enumerate(lines):
        line_num = idx + 1
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        c_match = re.search(r'^class\s+([A-Za-z0-9_]+)', stripped)
        if c_match:
            name = c_match.group(1)
            symbols.append({
                "id": f"{file_path}#{name}",
                "name": name,
                "kind": "class",
                "node_type": "class_definition",
                "line": line_num,
                "signature": stripped,
            })
            continue

        f_match = re.search(r'^(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(', stripped)
        if f_match:
            name = f_match.group(1)
            symbols.append({
                "id": f"{file_path}#{name}",
                "name": name,
                "kind": "function",
                "node_type": "function_definition",
                "line": line_num,
                "signature": stripped,
            })
            continue

    return symbols

def extract_symbols_from_file(file_path: str, content: str) -> List[Dict[str, Any]]:
    lang = get_parser_language(file_path)
    if not lang:
        return []

    if lang in {"c", "cpp"}:
        return extract_cpp_symbols(file_path, content)
    elif lang in {"typescript", "tsx", "javascript"}:
        return extract_typescript_symbols(file_path, content)
    elif lang == "python":
        return extract_python_symbols(file_path, content)
    return []
