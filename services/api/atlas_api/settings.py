import os

def get_max_files() -> int:
    """Retrieve ATLAS_MAX_FILES from environment variable or settings, default 5000."""
    raw = os.environ.get("ATLAS_MAX_FILES", "5000")
    try:
        val = int(raw)
        return val if val > 0 else 5000
    except (ValueError, TypeError):
        return 5000

ATLAS_MAX_FILES = get_max_files()
