import os
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# --- Configuration ---
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

CLIENT_SECRET_FILE = 'utils/credentials_oauth.json'  # Path to OAuth credentials
TOKEN_FILE = 'utils/mail/token.json'  # Stored token after authentication


# ---------------------------------------------------
# Authenticate and create Gmail service
# ---------------------------------------------------
def get_gmail_service():
    """
    Authenticates with Google using OAuth and returns a Gmail service object.
    """
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Opens a browser window for the user to authenticate
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=8080)

        # Save the refreshed or new credentials
        os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)


# ---------------------------------------------------
# Create message
# ---------------------------------------------------
def create_message(sender, to, subject, message_text, image=None, mime_type=None, image_name=None):
    """
    Creates an email message with optional image attachment.

    image can be:
        - str: Path to a file
        - Django UploadedFile: request.FILES.get()
        - bytes: Raw image bytes
    """
    message = MIMEMultipart()
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject

    # --- 1. Add plain text body ---
    body = MIMEText(message_text, 'plain')
    message.attach(body)

    # --- 2. Handle image attachment ---
    if image:
        try:
            img_data = None
            final_mime_type = mime_type
            final_name = image_name or "attachment.png"

            # CASE 1: File path
            if isinstance(image, str) and os.path.exists(image):
                with open(image, 'rb') as img_file:
                    img_data = img_file.read()
                final_name = os.path.basename(image)

            # CASE 2: Django UploadedFile
            elif hasattr(image, 'read'):
                img_data = image.read()
                if not mime_type and hasattr(image, 'content_type'):
                    final_mime_type = image.content_type
                final_name = getattr(image, 'name', final_name)

            # CASE 3: Raw bytes directly
            elif isinstance(image, (bytes, bytearray)):
                img_data = image

            if img_data:
                subtype = final_mime_type.split('/')[-1] if final_mime_type else None
                img = MIMEImage(img_data, _subtype=subtype)
                img.add_header('Content-Disposition', 'attachment', filename=final_name)
                message.attach(img)
                print(f"📎 Attached image: {final_name}")
            else:
                print("⚠️ Warning: No image data found.")
        except Exception as e:
            print(f"❌ Error attaching image: {e}")

    # --- 3. Encode for Gmail API ---
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return {'raw': raw_message}


# ---------------------------------------------------
# Send message
# ---------------------------------------------------
def send(userId="me", *args, **kwargs):
    """
    Sends an email message via Gmail API.

    Usage:
    -------
    1. Provide components to build a message:
       send(
           recipient_email="user@example.com",
           subject="Hello",
           message_text="This is a test email.",
           image=uploaded_file_or_path
       )

    2. Provide a pre-built message:
       send(message=ready_message_object)
    """
    service = get_gmail_service()

    # --- Use pre-built message directly ---
    if "message" in kwargs and kwargs["message"] is not None:
        message = kwargs["message"]
    else:
        # Extract fields
        recipient_email = kwargs.get("recipient_email")
        subject = kwargs.get("subject")
        message_text = kwargs.get("message_text", "")
        image = kwargs.get("image", None)  # Can be file path, Django file, or bytes
        mime_type = kwargs.get("mime_type", None)
        image_name = kwargs.get("image_name", None)
        sender_email = kwargs.get("sender_email", "me")

        # Validation
        if not recipient_email or not subject:
            raise ValueError("recipient_email and subject are required unless a 'message' is provided.")

        # Create the message
        message = create_message(sender_email, recipient_email, subject, message_text,
                                 image=image, mime_type=mime_type, image_name=image_name)

    # --- Send the message ---
    try:
        sent_msg = service.users().messages().send(userId=userId, body=message).execute()
        print(f"✅ Email sent successfully! Message ID: {sent_msg['id']}")
        return sent_msg
    except HttpError as error:
        print(f"❌ An error occurred: {error}")
        return None


# ---------------------------------------------------
# Example usage
# ---------------------------------------------------
if __name__ == '__main__':
    image_path = r"D:\1.mistery\backend\api\Profile.png"

    print("🚀 Authenticating with Gmail...")
    print("✅ Authentication successful.")

    recipient_email = 'anirudha2685@gmail.com'
    email_subject = 'Hello from the Gmail API!'
    email_body = 'This is an email sent programmatically using the Gmail API with an image attached.'

    # Send email
    print(f"✉️ Sending email to {recipient_email}...")
    send(
        recipient_email=recipient_email,
        subject=email_subject,
        message_text=email_body,
        # image=image_path  # <-- Can also be request.FILES.get("answer_image") or bytes
    )
    print("🎉 Email sent!")
