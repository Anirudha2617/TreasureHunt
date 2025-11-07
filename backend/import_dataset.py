import os
import django
import json
from django.apps import apps
from datetime import datetime, date
from decimal import Decimal
import uuid

# --- Django setup ---
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  # Your settings
django.setup()

from django.db import connection

# --- Helper to handle special types ---
def make_python_type(obj):
    if isinstance(obj, (datetime, date)):
        return obj  # Django will parse string if needed
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, uuid.UUID):
        return str(obj)
    return obj

# --- Dataset folder ---
dataset_dir = "dataset"

# --- Skip Django system JSON files (exact filenames) ---
skip_files = {
    "admin_logentry.json",
    "django_migrations.json",
    "sessions_session.json",
    "auth_permission.json",
    "auth_group.json",
    "auth_group_permissions.json",
    "auth_user_user_permissions.json",
    "auth_user_groups.json",
}

# --- Disable foreign key checks (SQLite only) ---
with connection.cursor() as cursor:
    cursor.execute("PRAGMA foreign_keys = OFF;")

# --- Import parent tables first (for FK constraints) ---
# You can define order manually if needed, e.g., levels first, then userprogress, etc.
# Or use alphabetical order assuming FK references are correct
json_files = sorted(f for f in os.listdir(dataset_dir) if f.endswith(".json"))

for file_name in json_files:
    if file_name in skip_files:
        print(f"Skipping system JSON file: {file_name}")
        continue

    file_path = os.path.join(dataset_dir, file_name)

    try:
        app_name, model_name_raw = file_name[:-5].split("_", 1)
        # Capitalize model name properly (LogEntry -> logentry.json, Level -> level.json)
        model_name = "".join([part.capitalize() for part in model_name_raw.split("_")])
        model = apps.get_app_config(app_name).get_model(model_name)
    except (ValueError, LookupError):
        print(f"Skipping {file_name}: cannot find model")
        continue

    if not os.path.exists(file_path):
        print(f"JSON file {file_path} does not exist, skipping.")
        continue

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not data:
        print(f"No data in {file_name}, skipping.")
        continue

    # Skip ManyToMany fields for now
    m2m_fields = [f.name for f in model._meta.many_to_many]

    objects_to_create = []
    for row in data:
        obj_data = {k: make_python_type(v) for k, v in row.items() if k not in m2m_fields}
        objects_to_create.append(model(**obj_data))

    # Bulk insert
    model.objects.bulk_create(objects_to_create)
    print(f"Imported {len(objects_to_create)} rows into {app_name}_{model_name.lower()}")

# --- Re-enable foreign key checks ---
with connection.cursor() as cursor:
    cursor.execute("PRAGMA foreign_keys = ON;")

print("All datasets imported successfully!")
