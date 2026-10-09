import os
import shutil
import tempfile
import pytest
from atlas_api.settings import get_max_files
from atlas_api.ingest.discovery import discover_files
from atlas_api.ingest.pipeline import IngestPipeline
from atlas_api.analysis.ast_parser import (
    extract_symbols_from_file,
    get_parser_language,
    PARSER_LANGUAGE_MAP,
)

@pytest.fixture
def repo_fixture_75_files():
    """
    Creates a temporary repository fixture with 75 distinct source files (> 50 files)
    including C, C++, TypeScript, and Python code files.
    """
    temp_dir = tempfile.mkdtemp(prefix="atlas_test_repo_")

    # Generate 75 files across multiple directories
    subdirs = ["core", "api", "utils", "models", "services"]
    for d in subdirs:
        os.makedirs(os.path.join(temp_dir, d), exist_ok=True)

    extensions = [".cpp", ".hpp", ".c", ".cc", ".cxx", ".h", ".ts", ".tsx", ".js", ".py"]

    for i in range(75):
        sub = subdirs[i % len(subdirs)]
        ext = extensions[i % len(extensions)]
        file_path = os.path.join(temp_dir, sub, f"module_{i:03d}{ext}")

        if ext in {".cpp", ".c", ".cc", ".cxx", ".h", ".hpp"}:
            content = f"""// Module {i}
#include <iostream>

class Class_{i} {{
public:
    void do_action_{i}();
}};

struct Struct_{i} {{
    int id;
}};

void run_task_{i}() {{
    std::cout << "Task {i}" << std::endl;
}}
"""
        elif ext in {".ts", ".tsx"}:
            content = f"""// Module {i}
export interface Config_{i} {{
    id: number;
}}

export class Service_{i} {{
    public execute_{i}() {{ return {i}; }}
}}

export function handler_{i}() {{
    return true;
}}
"""
        elif ext == ".py":
            content = f"""# Module {i}
class Processor_{i}:
    def __init__(self):
        self.val = {i}

def compute_{i}():
    return {i} * 2
"""
        else:
            content = f"""// Module {i}
function helper_{i}() {{
    return {i};
}}
"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_discovery_does_not_truncate_at_50(repo_fixture_75_files):
    """
    Verifies that file discovery finds all 75 files without truncating at 50.
    """
    files = discover_files(repo_fixture_75_files, max_files=5000)
    assert len(files) == 75, f"Expected 75 discovered files, got {len(files)}"
    assert len(files) > 50


def test_ingest_pipeline_indexes_all_files_above_50(repo_fixture_75_files):
    """
    Verifies that IngestPipeline indexes all 75 files and does not clamp at 50 modules.
    """
    pipeline = IngestPipeline(max_files=5000)
    result = pipeline.run(repo_fixture_75_files, "TestRepo75")

    assert result.total_discovered_files == 75
    assert result.indexed_files_count == 75, f"Expected 75 indexed files, but got {result.indexed_files_count} (was it clamped at 50?)"
    assert result.modules_count == 75
    assert len(result.modules) == 75

    # Check that lines of code and AST symbols are not undercounted
    assert result.total_lines_of_code > 500
    assert result.total_ast_symbols > 150


def test_enforces_atlas_max_files_env_variable(repo_fixture_75_files, monkeypatch):
    """
    Verifies that ATLAS_MAX_FILES from environment is respected when set.
    """
    # Test custom clamp above 50, e.g. 60
    monkeypatch.setenv("ATLAS_MAX_FILES", "60")
    assert get_max_files() == 60

    pipeline_60 = IngestPipeline()
    result_60 = pipeline_60.run(repo_fixture_75_files)
    assert result_60.indexed_files_count == 60

    # Test default 5000
    monkeypatch.delenv("ATLAS_MAX_FILES", raising=False)
    assert get_max_files() == 5000
    pipeline_default = IngestPipeline()
    result_default = pipeline_default.run(repo_fixture_75_files)
    assert result_default.indexed_files_count == 75


def test_ast_symbol_extraction_for_cpp():
    """
    Verifies that C/C++ AST extraction captures:
    - class_specifier
    - struct_specifier
    - function_definition
    """
    cpp_code = """
#include <string>

class EngineCore {
public:
    void initialize();
};

struct BufferDescriptor {
    size_t size;
};

void allocate_memory(size_t bytes) {
    // implementation
}

int EngineCore::initialize() {
    return 0;
}
"""
    symbols = extract_symbols_from_file("src/core/engine.cpp", cpp_code)
    node_types = {s["node_type"] for s in symbols}

    assert "class_specifier" in node_types, "Failed to capture class_specifier node"
    assert "struct_specifier" in node_types, "Failed to capture struct_specifier node"
    assert "function_definition" in node_types, "Failed to capture function_definition node"

    names = {s["name"] for s in symbols}
    assert "EngineCore" in names
    assert "BufferDescriptor" in names
    assert "allocate_memory" in names


def test_language_extension_mappings():
    """
    Verifies that .c, .cpp, .cc, .cxx, .h, .hpp, .ts, .tsx, .js, .py
    are properly mapped to their respective parser grammars.
    """
    expected = {
        ".c": "c",
        ".cpp": "cpp",
        ".cc": "cpp",
        ".cxx": "cpp",
        ".h": "cpp",
        ".hpp": "cpp",
        ".ts": "typescript",
        ".tsx": "tsx",
        ".js": "javascript",
        ".py": "python",
    }
    for ext, lang in expected.items():
        assert PARSER_LANGUAGE_MAP.get(ext) == lang, f"Extension {ext} not mapped to {lang}"
        assert get_parser_language(f"test_file{ext}") == lang
