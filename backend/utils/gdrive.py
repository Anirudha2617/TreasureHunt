from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
import os
import json
from tempfile import NamedTemporaryFile

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OFFLINE = os.getenv("OFFLINE_MODE", "true").lower() == "true"

if OFFLINE:
    # Local credentials
    CLIENT_SECRETS = os.path.join(BASE_DIR, "utils", "credentials_oauth.json")
    TOKEN_FILE = os.path.join(BASE_DIR, "utils", "token.json")
else:
    # Load from environment (Render / Cloud)
    CLIENT_SECRETS = os.path.join(BASE_DIR, "utils", "credentials_oauth.json")
    TOKEN_FILE = os.path.join(BASE_DIR, "utils", "token.json")

    # If creds are stored as env vars (JSON string)
    if os.getenv("GOOGLE_CREDENTIALS_JSON"):
        with open(CLIENT_SECRETS, "w") as f:
            f.write(os.getenv("GOOGLE_CREDENTIALS_JSON"))

    if os.getenv("GOOGLE_TOKEN_JSON"):
        with open(TOKEN_FILE, "w") as f:
            f.write(os.getenv("GOOGLE_TOKEN_JSON"))

# Google Drive folders
DRIVE_FOLDER_ID = "11P_TvPf1U0GpPav2d8oyUgy8f-zY0mWV"
PRESENT_IMAGES_DIR = "1Gc9YrMBbqY_vlJwre6R7x5YLiwauVrRl"
ANSWER_IMAGES_DIR = "1ze0XGUqbzbnL2fw0tfVUk0o2OaO28x8F"
QUESTIONS_DIR = "1e3ilAM5Bqu7E2M1Q8_mnYddoSmGN7KxH"
MAIL_DIR = "1aaBTa3IFLJIcpkYLjprWxVKbrencBFMs"

def get_drive_service():
    """
    Handles Google Drive OAuth using a pre-generated token.json.
    Works in production (Render) with automatic refresh.
    """
    gauth = GoogleAuth()

    # Load OAuth client secrets
    with open(CLIENT_SECRETS, "r") as f:
        client_config_dict = json.load(f)

    client_config = client_config_dict["web"]
    redirect_uri = client_config["redirect_uris"][0]

    # Configure PyDrive2
    gauth.settings["client_config_backend"] = "settings"
    gauth.settings["client_config"] = {
        "client_id": client_config["client_id"],
        "client_secret": client_config["client_secret"],
        "auth_uri": client_config["auth_uri"],
        "token_uri": client_config["token_uri"],
        "revoke_uri": client_config.get("revoke_uri", "https://oauth2.googleapis.com/revoke"),
        "redirect_uri": redirect_uri,
    }
    gauth.settings["get_refresh_token"] = True
    gauth.settings["oauth_scope"] = ["https://www.googleapis.com/auth/drive"]

    # Load saved token
    gauth.LoadCredentialsFile(TOKEN_FILE)

    if gauth.credentials is None:
        raise RuntimeError(
            "❌ token.json missing. Generate it locally and upload to Render."
        )

    # If access token expired → refresh automatically
    if gauth.access_token_expired:
        if not gauth.credentials.refresh_token:
            raise RuntimeError(
                "❌ No refresh token available. "
                "Delete token.json, regenerate it locally with access_type=offline, "
                "and redeploy to Render."
            )

        print("Access token expired. Refreshing...")
        gauth.Refresh()
        gauth.SaveCredentialsFile(TOKEN_FILE)
        print("✅ Token refreshed and saved.")

    else:
        gauth.Authorize()

    return GoogleDrive(gauth)


def upload_file_to_drive(django_file, dir_name=""):
    """
    Upload a Django InMemoryUploadedFile to Google Drive using PyDrive2.
    Uses a temporary file because PyDrive2 doesn't provide SetContentIOStream.
    Returns a public webContentLink (after making file public).
    """
    drive = get_drive_service()
    print(f"Uploading file to Google Drive: {django_file.name}")

    # Ensure file pointer is at start
    try:
        django_file.seek(0)
    except Exception:
        pass

    # Write to temporary file
    with NamedTemporaryFile(delete=False) as tmp:
        tmp.write(django_file.read())
        tmp_path = tmp.name

    try:
        # Decide which folder to upload to
        if dir_name == "presents":
            folder_id = PRESENT_IMAGES_DIR
        elif dir_name == "answers":
            folder_id = ANSWER_IMAGES_DIR
        elif dir_name == "questions":
            folder_id = QUESTIONS_DIR
        elif dir_name == "mails":
            folder_id = MAIL_DIR
        else:
            folder_id = DRIVE_FOLDER_ID

        # Create and upload file
        gfile = drive.CreateFile({
            "title": django_file.name,
            "mimeType": getattr(django_file, "content_type", "application/octet-stream"),
            "parents": [{"id": folder_id}],
        })
        gfile.SetContentFile(tmp_path)
        gfile.Upload()


        file_id = gfile.get("id")
        direct_view_link = f"https://drive.google.com/uc?id={file_id}"
        print(f"File uploaded to Drive with ID: {file_id} : ", direct_view_link)
        # Return public link
        return direct_view_link

    finally:
        # Clean up temporary file
        try:
            os.remove(tmp_path)
        except Exception:
            pass



# utils/oauth.py
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_drive():
    gauth = GoogleAuth()
    gauth.settings['client_config_backend'] = 'file'
    gauth.settings['get_refresh_token'] = True
    gauth.settings['client_config_file'] = os.path.join(BASE_DIR, "utils/credentials_oauth.json")
    
    # Load client config
    gauth.LoadClientConfigFile(os.path.join(BASE_DIR, "utils/credentials_oauth.json"))

    # Path to store token
    token_path = os.path.join(BASE_DIR, "utils/token.json")

    # Try to load saved credentials
    if os.path.exists(token_path):
        gauth.LoadCredentialsFile(token_path)

    # If credentials don’t exist or are invalid, authenticate
    if gauth.credentials is None or gauth.access_token_expired:
        # 🔹 Print redirect URIs for debugging
        client_config = gauth.client_config
        if "redirect_uris" in client_config.get("web", {}):
            print("Available redirect URIs from client config:")
            for uri in client_config["web"]["redirect_uris"]:
                print(" -", uri)

        # Start local webserver auth (PyDrive2 defaults to 8080 if no port given)
        print("Starting LocalWebserverAuth on http://localhost:8080/ ...")
        gauth.LocalWebserverAuth()  # Don’t pass port if library doesn’t accept it
        gauth.SaveCredentialsFile(token_path)

    drive = GoogleDrive(gauth)
    return drive


# Test run
if __name__ == "__main__":
    print("Starting OAuth command-line authentication...")
    drive = get_drive()
    print("Drive authentication successful! token.json created.")
