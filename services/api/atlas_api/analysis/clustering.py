from typing import List, Dict

CLUSTER_KEYWORDS = {
    "Frontend": ["components", "views", "pages", "ui", "gui", "web", "frontend", "display", "viewport", "renderer", "shader", "vulkan", "gpu"],
    "API Layer": ["controllers", "routes", "api", "endpoint", "router", "decoder", "encoder", "handler", "rpc", "dispatch", "syscall", "hle", "ipc"],
    "Auth & Security": ["auth", "session", "jwt", "security", "crypto", "nid", "patcher", "protect", "token", "sha1", "signature", "relinker"],
    "Database": ["db", "database", "models", "entities", "schema", "storage", "memory", "allocator", "vma", "pool", "buffer", "cache"],
    "Services": ["services", "domain", "core", "engine", "runtime", "libs", "kernel", "thread", "process", "sched", "sync"],
    "Configuration": ["config", "env", "docker", "tsconfig", "cmakelists", "package.json", "cargo.toml", "settings", "build", "makefile"],
}

def cluster_modules(file_paths: List[str]) -> Dict[str, str]:
    """
    Assigns architectural clusters to modules without artificial clamping at 50 clusters/modules.
    """
    result: Dict[str, str] = {}
    for path in file_paths:
        lower = path.lower()
        matched_cluster = "Utilities"
        for cluster, keywords in CLUSTER_KEYWORDS.items():
            if any(kw in lower for kw in keywords):
                matched_cluster = cluster
                break
        result[path] = matched_cluster
    return result
