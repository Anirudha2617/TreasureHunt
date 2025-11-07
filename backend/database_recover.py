import os
import django
import json
from django.apps import apps
from datetime import datetime, date
from decimal import Decimal
import uuid
import random

# --- Django setup ---
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  # Replace with your settings
django.setup()

# --- Helper function to make objects JSON serializable ---
def make_serializable(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, uuid.UUID):
        return str(obj)
    return obj

# --- Create folder for dataset ---
output_dir = "dataset"
os.makedirs(output_dir, exist_ok=True)

# --- Dictionary to hold one sample per model ---
all_data_sample = {}

# --- Loop through all installed apps ---
all_apps = apps.get_app_configs()

for app_config in all_apps:
    app_name = app_config.label
    print(f"Processing app: {app_name}")

    for model in app_config.get_models():
        model_name = model.__name__
        data = list(model.objects.all().values())

        # Save individual JSON files in dataset/
        if data:
            serializable_data = [
                {k: make_serializable(v) for k, v in row.items()} for row in data
            ]
            file_name = os.path.join(output_dir, f"{app_name}_{model_name.lower()}.json")
            with open(file_name, "w", encoding="utf-8") as f:
                json.dump(serializable_data, f, ensure_ascii=False, indent=2)
            print(f"  Exported {len(data)} rows from {model_name} to {file_name}")

            # Select one random row for consolidated all_data.json
            sample_row = random.choice(serializable_data)
            all_data_sample[f"{app_name}_{model_name.lower()}"] = sample_row
        else:
            # No data, put empty dict in consolidated JSON
            all_data_sample[f"{app_name}_{model_name.lower()}"] = {}

# --- Save consolidated JSON outside dataset/
with open("all_data.json", "w", encoding="utf-8") as f:
    json.dump(all_data_sample, f, ensure_ascii=False, indent=2)

print(f"All apps exported successfully! Individual files in '{output_dir}', consolidated file: 'all_data.json'")
