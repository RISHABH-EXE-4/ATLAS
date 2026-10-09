import os
import subprocess
from pathlib import Path
from typing import List, Optional
from atlas_api.settings import get_max_files

VENDOR_PATTERNS = {
    "node_modules", "vendor", "3rdparty", "extern", "external",
    ".git", ".github", "dist", "build", "target", "site-packages", "__pycache__"
}

CODE_EXTENSIONS = {
    ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".hh", ".hxx",
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".py", ".pyi", ".rs", ".go", ".java", ".kt", ".cs",
    ".cmake", ".toml", ".json", ".yaml", ".yml", ".md", ".sql"
}

def is_source_file(file_path: str) -> bool:
    p = Path(file_path)
    lower = p.name.lower()
    if lower in {"cmakelists.txt", "makefile", "dockerfile", "cargo.toml", "package.json"}:
        return True
    return p.suffix.lower() in CODE_EXTENSIONS

def is_vendor_path(rel_path: str) -> bool:
    parts = Path(rel_path).parts
    return any(part in VENDOR_PATTERNS for part in parts)

def discover_files(repo_path: str, max_files: Optional[int] = None) -> List[str]:
    """
    Discovers all candidate source files in repo_path up to max_files (defaults to ATLAS_MAX_FILES, 5000).
    Ensures that shallow clone depth (e.g. git clone --depth 50) does not limit the working tree walk.
    """
    effective_limit = max_files if max_files is not None else get_max_files()
    discovered: List[str] = []

    # First attempt: git ls-files if inside a git repository
    git_dir = os.path.join(repo_path, ".git")
    if os.path.exists(git_dir):
        try:
            res = subprocess.run(
                ["git", "ls-files"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                check=False
            )
            if res.returncode == 0 and res.stdout.strip():
                for line in res.stdout.splitlines():
                    rel = line.strip()
                    if not rel or is_vendor_path(rel):
                        continue
                    if is_source_file(rel):
                        discovered.append(rel)
                        if len(discovered) >= effective_limit:
                            return discovered
                return discovered
        except Exception:
            pass

    # Fallback to filesystem traversal: os.walk discovers ALL files in the working directory
    for root, dirs, files in os.walk(repo_path):
        # Prune vendor directories in-place
        dirs[:] = [d for d in dirs if d not in VENDOR_PATTERNS]
        for f in sorted(files):
            full_p = os.path.join(root, f)
            rel = os.path.relpath(full_p, repo_path)
            if is_vendor_path(rel):
                continue
            if is_source_file(rel):
                discovered.append(rel)
                if len(discovered) >= effective_limit:
                    return discovered

    return discovered
