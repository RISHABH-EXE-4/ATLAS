import os
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from atlas_api.settings import get_max_files
from atlas_api.ingest.discovery import discover_files
from atlas_api.analysis.ast_parser import extract_symbols_from_file
from atlas_api.analysis.clustering import cluster_modules

@dataclass
class IndexedModule:
    path: str
    name: str
    extension: str
    size: int
    lines_count: int
    symbols: List[Dict[str, Any]] = field(default_factory=list)
    cluster: str = "Utilities"

@dataclass
class IngestionResult:
    repo_name: str
    total_discovered_files: int
    indexed_files_count: int
    modules_count: int
    modules: List[IndexedModule] = field(default_factory=list)
    clusters: Dict[str, int] = field(default_factory=dict)
    total_lines_of_code: int = 0
    total_ast_symbols: int = 0

class IngestPipeline:
    def __init__(self, max_files: Optional[int] = None):
        # Respect ATLAS_MAX_FILES from env or settings, rather than static integer 50
        self.max_files = max_files if max_files is not None else get_max_files()

    def run(self, repo_path: str, repo_name: Optional[str] = None) -> IngestionResult:
        name = repo_name or os.path.basename(os.path.abspath(repo_path))
        all_discovered = discover_files(repo_path, max_files=self.max_files)

        indexed_modules: List[IndexedModule] = []
        total_loc = 0
        total_symbols = 0

        # Loop through ALL discovered files up to self.max_files (no artificial 50 slice)
        for rel_path in all_discovered:
            full_path = os.path.join(repo_path, rel_path)
            size = os.path.getsize(full_path) if os.path.exists(full_path) else 0

            content = ""
            lines_count = 0
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    lines_count = len(content.splitlines())
            except Exception:
                pass

            symbols = extract_symbols_from_file(rel_path, content)
            total_loc += lines_count
            total_symbols += len(symbols)

            mod = IndexedModule(
                path=rel_path,
                name=os.path.basename(rel_path),
                extension=os.path.splitext(rel_path)[1],
                size=size,
                lines_count=lines_count,
                symbols=symbols,
                cluster="Services"
            )
            indexed_modules.append(mod)

        # Cluster modules without clamping at 50
        clusters = cluster_modules([m.path for m in indexed_modules])
        for mod in indexed_modules:
            mod.cluster = clusters.get(mod.path, "Utilities")

        cluster_counts: Dict[str, int] = {}
        for mod in indexed_modules:
            cluster_counts[mod.cluster] = cluster_counts.get(mod.cluster, 0) + 1

        return IngestionResult(
            repo_name=name,
            total_discovered_files=len(all_discovered),
            indexed_files_count=len(indexed_modules),
            modules_count=len(indexed_modules),
            modules=indexed_modules,
            clusters=cluster_counts,
            total_lines_of_code=total_loc,
            total_ast_symbols=total_symbols,
        )
