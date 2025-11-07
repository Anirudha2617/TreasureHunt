# from utils.gdrive import upload_file_to_drive

# with open("test.png", "rb") as f:
#     class DummyFile:
#         name = "Profile.png"
#         def chunks(self): return [f.read()]

#     url = upload_file_to_drive(DummyFile())
#     print("Uploaded to:", url)

# import sys
# import os

# # Go up one level from 'api' to the 'backend' directory
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 

# # Add the 'backend' directory to Python's search path
# sys.path.append(BASE_DIR)

# from utils.mail.mail_service import *
# # --- Main execution block ---
# if __name__ == '__main__':
#     print("🚀 Starting Gmail API standalone test...")

#     # 1. Authenticate and get the service. A browser will open on the first run.
#     service = get_gmail_service()
    
#     # 2. Define and create the test email.
#     # IMPORTANT: Change the recipient to an email address you can check.
#     recipient = 'anirudha6082005@gmail.com'
#     subject = 'Gmail API Test from Python Script'
#     body = 'Hello! If you received this, the test was successful.'
    
#     message = create_message('me', recipient, subject, body)
    
#     # 3. Send the email.
#     send_message(service, 'me', message)