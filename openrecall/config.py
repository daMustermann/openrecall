import os
import sys
import argparse
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

parser = argparse.ArgumentParser(description="OpenRecall")

parser.add_argument(
    "--storage-path",
    default=None,
    help="Path to store the screenshots and database",
)

parser.add_argument(
    "--primary-monitor-only",
    action="store_true",
    help="Only record the primary monitor",
    default=False,
)

args = parser.parse_args()


def get_appdata_folder(app_name="openrecall"):
    if sys.platform == "win32":
        appdata = os.getenv("APPDATA")
        if not appdata:
            raise EnvironmentError("APPDATA environment variable is not set.")
        path = os.path.join(appdata, app_name)
    elif sys.platform == "darwin":
        home = os.path.expanduser("~")
        path = os.path.join(home, "Library", "Application Support", app_name)
    else:
        home = os.path.expanduser("~")
        path = os.path.join(home, ".local", "share", app_name)
    if not os.path.exists(path):
        os.makedirs(path)
    return path


if args.storage_path:
    appdata_folder = args.storage_path
else:
    appdata_folder = get_appdata_folder()
    screenshots_path = os.path.join(appdata_folder, "screenshots")
db_path = os.path.join(appdata_folder, "recall.db")
model_cache_path = os.path.join(appdata_folder, "sentence_transformers")
config_path = os.path.join(appdata_folder, "openrecall.json")

for d in [screenshots_path, model_cache_path]:
    if not os.path.exists(d):
        try:
            os.makedirs(d)
        except:
            pass

DEFAULT_CONFIG = {
    "ai_provider": "lm_studio",
    "api_base": "http://localhost:1234/v1",
    "api_key": "lm-studio",
    "embedding_model": "text-embedding-nomic-embed-text-v1.5",
    "chat_model": "llama-3.2-3b-instruct"
}

def get_config():
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                return {**DEFAULT_CONFIG, **json.load(f)}
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return DEFAULT_CONFIG
    return DEFAULT_CONFIG

def save_config(new_config):
    current_config = get_config()
    updated_config = {**current_config, **new_config}
    try:
        with open(config_path, 'w') as f:
            json.dump(updated_config, f, indent=2)
        return updated_config
    except Exception as e:
        logger.error(f"Failed to save config: {e}")
        return None
