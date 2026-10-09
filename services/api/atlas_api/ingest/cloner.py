import subprocess
from typing import Optional

def clone_repository(repo_url: str, dest_dir: str, depth: Optional[int] = 50) -> bool:
    """
    Clones a git repository with shallow commit depth (default depth 50 for quick commit history),
    while the working directory checkout contains all tree files for discovery.
    """
    cmd = ["git", "clone"]
    if depth:
        cmd.extend(["--depth", str(depth)])
    cmd.extend([repo_url, dest_dir])

    res = subprocess.run(cmd, capture_output=True, text=True, check=False)
    return res.returncode == 0
