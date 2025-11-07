from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
import os
import json
from io import BytesIO

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENT_SECRETS = os.path.join(BASE_DIR, "utils", "credentials_oauth.json")
TOKEN_FILE = os.path.join(BASE_DIR, "utils", "token.json")


from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
import json
import os


def get_drive_service():
    """
    Handles the OAuth2 flow and returns an authenticated GoogleDrive instance.
    """
    gauth = GoogleAuth()

    # --- Load the JSON client secret manually ---
    with open(CLIENT_SECRETS, "r") as f:
        client_config_dict = json.load(f)

    client_config = client_config_dict["web"]
    redirect_uri = client_config["redirect_uris"][0]  # PyDrive2 expects a single string

    # --- Inject the OAuth settings into PyDrive2 ---
    gauth.settings["client_config_backend"] = "settings"
    gauth.settings["client_config"] = {
        "client_id": client_config["client_id"],
        "client_secret": client_config["client_secret"],
        "auth_uri": client_config["auth_uri"],
        "token_uri": client_config["token_uri"],
        "revoke_uri": client_config["revoke_uri"],
        "redirect_uri": redirect_uri,
    }

    # Request offline access so refresh_token is generated
    gauth.settings["oauth_scope"] = [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.metadata",
    ]
    gauth.settings["get_refresh_token"] = True  # <-- CRITICAL FIX
    gauth.settings["oauth_args"] = {
        "access_type": "offline",
        "prompt": "consent"
    }

    # --- Load or request new credentials ---
    gauth.LoadCredentialsFile(TOKEN_FILE)

    if gauth.credentials is None:
        print("No credentials found. Opening browser for authentication...")
        gauth.LocalWebserverAuth()
    elif gauth.access_token_expired:
        print("Refreshing expired token...")
        gauth.Refresh()
    else:
        gauth.Authorize()

    # --- Save credentials for future use ---
    gauth.SaveCredentialsFile(TOKEN_FILE)

    return GoogleDrive(gauth)



def upload_file_to_drive(django_file):
    """
    Uploads a Django InMemoryUploadedFile to Google Drive and returns a public URL.
    """
    drive = get_drive_service()

    file_content = BytesIO(django_file.read())

    gfile = drive.CreateFile({
        "title": django_file.name,
        "mimeType": django_file.content_type,
    })

    gfile.SetContentIOStream(file_content)
    gfile.Upload()
    gfile.InsertPermission({"type": "anyone", "value": "anyone", "role": "reader"})

    print(f"✅ Uploaded '{gfile['title']}' and made it public.")
    return gfile["webContentLink"]


if __name__ == "__main__":
    print("Attempting to authenticate with Google Drive...")

    # Clear old token before fresh login
    if os.path.exists(TOKEN_FILE):
        os.remove(TOKEN_FILE)
        print("Removed old token file.")

    get_drive_service()
    print("✅ Authentication successful. 'token.json' has been created.")












# from googleapiclient.discovery import build
# from googleapiclient.http import MediaIoBaseUpload
# import httplib2

# def upload_file_to_drive_inmemory(django_file):
#     # prepare credentials via your existing get_drive_service / GoogleAuth usage
#     gauth = GoogleAuth()
#     gauth.LoadCredentialsFile(TOKEN_FILE)
#     if gauth.credentials is None:
#         gauth.LocalWebserverAuth()
#     elif gauth.access_token_expired:
#         gauth.Refresh()
#     else:
#         gauth.Authorize()

#     # create authorized http and service
#     http = gauth.authorize(httplib2.Http())
#     service = build('drive', 'v3', http=http)

#     # ensure file pointer at start
#     try:
#         django_file.seek(0)
#     except Exception:
#         pass

#     media = MediaIoBaseUpload(django_file, mimetype=django_file.content_type, resumable=True)
#     file_metadata = {'name': django_file.name}

#     created = service.files().create(body=file_metadata, media_body=media, fields='id,webViewLink,webContentLink').execute()

#     # make public
#     service.permissions().create(
#         fileId=created['id'],
#         body={'role': 'reader', 'type': 'anyone'}
#     ).execute()

#     return created.get('webContentLink') or created.get('webViewLink')
