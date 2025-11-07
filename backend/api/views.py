from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Level, UserProgress, Question , UserAnswer , Present, Review
import requests
from .serializers import LevelSerializer, UserProgressSerializer, PresentSerializer, SingleLevelSerializer
from utils.gdrive import upload_file_to_drive

from django.http import HttpResponse
from rest_framework.views import APIView


from utils.image_access import image_secure_access
import re



class ImageProxyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self , request , image_id):
        try:
            print("Requested image_id:", image_id)
            # Fetch file bytes securely
            if "google" in image_id:
                match = re.search(r"id=([^&]+)", image_id)
                image_id = match.group(1)

            file_bytes, mime_type = image_secure_access(image_id)

            return HttpResponse(file_bytes, content_type=mime_type)

        except Exception as e:
            print("❌ Error fetching private image:", str(e))
            return HttpResponse("Internal Server Error", status=500)
        
from django.http import HttpResponse, HttpResponseNotFound
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt
from utils.image_access import image_secure_access

@csrf_exempt
@cache_page(60 * 60)  # cache 1 hour at Django level
def admin_image_proxy(request, file_id):
    if not request.user.is_authenticated or request.user.username != "aniru":
        return HttpResponseNotFound("404 - User not authorized")
    try:
        file_bytes, mime_type = image_secure_access(file_id)
        return HttpResponse(file_bytes, content_type=mime_type)
    except Exception as e:
        print(f"[Image Proxy Error] {e}")
        return HttpResponseNotFound("Image not available")



from .models import Level, UserProgress, Question , UserAnswer
from .serializers import LevelSerializer, UserProgressSerializer, PresentSerializer
# -------------------------------
# List all Levels
# -------------------------------
# views.py
# views.py

from django.db.models import Prefetch

class LevelsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # --- Data for Level Status (from previous fix) ---
        progress, _ = UserProgress.objects.get_or_create(user=user)
        unlocked_ids = set(progress.unlocked_levels.values_list('id', flat=True))
        completed_ids = set(progress.completed_levels.values_list('id', flat=True))
        first_level = Level.objects.order_by("id").first()
        first_level_id = first_level.id if first_level else None
        if first_level_id is not None:
            unlocked_ids.add(first_level_id)
        
        # --- NEW: Data for Question Status ---
        
        # 1. Get all correct answer IDs for this user in one query.
        correct_answer_qids = set(
            UserAnswer.objects.filter(user=user, is_correct=True).values_list('question_id', flat=True)
        )

        # 2. Get all review statuses for this user in one query.
        #    Store in a dict for fast lookups: {question_id: status}
        reviews = Review.objects.filter(user=user)
        review_statuses = {review.question_id: review.status for review in reviews}

        # --- End of New Code ---

        levels = Level.objects.prefetch_related(
            # We also prefetch questions' answers and reviews to be thorough
            Prefetch('questions__user_answers', queryset=UserAnswer.objects.filter(user=user)),
            Prefetch('questions__reviews', queryset=Review.objects.filter(user=user)),
            'present'
        ).order_by("id")
        
        # 3. Pass all the data down in the context.
        serializer_context = {
            "request": request,
            "unlocked_ids": unlocked_ids,
            "completed_ids": completed_ids,
            # NEW context data for the nested serializer
            "correct_answer_qids": correct_answer_qids,
            "review_statuses": review_statuses,
        }

        serializer = LevelSerializer(levels, many=True, context=serializer_context)
        return Response(serializer.data)


# -------------------------------
# Level Detail View
# -------------------------------
class LevelDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, level_id):
        level = get_object_or_404(Level, id=level_id)
        serializer = SingleLevelSerializer(level, context={"request": request})
        return Response(serializer.data)

from .models import Mails
from utils.mail.mail_service import send
# -------------------------------
# Get HInt View
# -------------------------------
class GetHint(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, question_id=None):
        raw = question_id
        try:
            numeric_id = int(raw[1:]) if raw.startswith("q") else int(raw)        #handles both "q_!" and 1 notations
        except ValueError:
            print("[Backend] ERROR: Invalid question id format")
            return Response({"detail": "Invalid question id"}, status=status.HTTP_400_BAD_REQUEST)


        question = get_object_or_404(Question, id=numeric_id)
        print(f"[Backend] Matched Question → ID={question.id}, Text='{question.question}', Type={question.answer_type}")

        if "mail" in question.answer_type:
            # Returns the first mail object or None if no mails are found
            mail = Mails.objects.filter(question=question).first()
            print(mail)
            file_bytes = None
            mime_type =None
            image_id = None
            if mail.image_url:
                image_id=mail.image_url
                print("Requested image_id:", image_id)
                # Fetch file bytes securely
                if "google" in image_id:
                    match = re.search(r"id=([^&]+)", image_id)
                    image_id = match.group(1)

                file_bytes, mime_type = image_secure_access(image_id)
            send(recipient_email = request.user.email , subject = mail.subject , message_text = mail.message_text , image =file_bytes , mime_type= mime_type )
            return Response({"detail": "Hint succesfully sent"}, status=status.HTTP_200_OK)

# -------------------------------
# User Progress View
# -------------------------------
class UserProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ensure progress exists and initialize unlocked first level
        progress, created = UserProgress.objects.get_or_create(user=request.user)
        if created:
            first_level = Level.objects.order_by("id").first()
            if first_level:
                progress.unlocked_levels.add(first_level)
                progress.save()

        serializer = UserProgressSerializer(progress, context={"request": request})
        return Response(serializer.data)

# from django.shortcuts import get_object_or_404
# -------------------------------
# Submit Answer View
# -------------------------------
class UserSubmitAnswer(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        """
        Accepts question_id in form 'q1' or '1'
        Body: { "answer": "...", "answer_image": <file> }
        Returns: { correct: bool|None, present: <present object or null> }
        """


        def unlock_nextlevel(current_level , progress ):
            "checks any pending question gets next level adds levels to progress and adds present to progress"
            for questions in current_level.questions.all():
                if not UserAnswer.objects.filter(user=request.user, question=questions).exists():
                    print("[Backend] Level NOT completed due to pending/unanswered questions.")
                    return None
            next_level = Level.objects.filter(id__gt=current_level.id).order_by("id").first()
            if next_level:
                if current_level not in progress.completed_levels.all():
                    progress.completed_levels.add(current_level)
                    print("Progress added")
                if next_level not in progress.unlocked_levels.all():
                    progress.unlocked_levels.add(next_level)
                    progress.save()
                print(f"[Backend] Unlocked next level: ID={next_level.id}, Name='{next_level.name}'")
                if hasattr(current_level, "present") and current_level.present :
                    if current_level.present not in progress.collected_presents.all():
                        progress.collected_presents.add(current_level.present)
                        progress.save()
                    present_data = PresentSerializer(current_level.present, context={"request": request}).data
                    return present_data
            else:
                print("[Backend] No further levels to unlock.")


        print("\n" + "=" * 50)
        print("[Backend] Incoming Answer Submission")
        print("  Raw question_id:", question_id)
        print("  Authenticated user:", request.user)
        print("  Request.data:", dict(request.data))
        print("  Request.FILES:", request.FILES)
        print("=" * 50)

        # ---- Parse question id ----
        raw = str(question_id)
        try:
            numeric_id = int(raw[1:]) if raw.startswith("q") else int(raw)        #handles both "q_!" and 1 notations
        except ValueError:
            print("[Backend] ERROR: Invalid question id format")
            return Response({"detail": "Invalid question id"}, status=status.HTTP_400_BAD_REQUEST)




        question = get_object_or_404(Question, id=numeric_id)
        print(f"[Backend] Matched Question → ID={question.id}, Text='{question.question}', Type={question.answer_type}")

        present_level = get_object_or_404(Level, id=question.level.id)


        progress, _ = UserProgress.objects.get_or_create(user=request.user)


        # ---- Prevent duplicate correct submissions ----
        if UserAnswer.objects.filter(user=request.user, question=question).exists():
            
            present_data = unlock_nextlevel(present_level , progress)
            print("[Backend] Duplicate submission detected, rejecting")
            return Response({"detail": "You have already answered this question."},
                            status=status.HTTP_400_BAD_REQUEST)

        # ---- Max Attempts Check ----
        user_attempt_count = UserAnswer.objects.filter(user=request.user, question=question).count()
        max_attempts = question.max_attempts or 3
        if user_attempt_count >= max_attempts:
            print(f"[Backend] User reached max attempts ({max_attempts}), not saving new answer.")
            return Response(
                {"correct": False, "present": None, "message": "Maximum attempts reached."},
                status=status.HTTP_200_OK
            )

        # ---- Parse incoming data ----
        user_answer_text = (request.data.get("answer") or "").strip().lower()
        correct_answer = (question.answer or "").strip().lower()
        image_file = request.FILES.get("answer_image")

        print(f"[Backend] Parsed Answer Text: '{user_answer_text}'")
        print(f"[Backend] Correct Answer: '{correct_answer}'")
        print(f"[Backend] Uploaded Image: {image_file}")

        # ---- Handle answer based on type ----
        answer_type = question.answer_type
        is_correct = None  # default for descriptive/review

        if "review" in answer_type:
            print("[Backend] Handling REVIEW type question")
            if answer_type == "descriptive-review" and not user_answer_text:
                return Response({"detail": "Answer text is required"}, status=status.HTTP_400_BAD_REQUEST)
            if answer_type == "image-review" and not image_file:
                return Response({"detail": "Answer image is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Prevent saving more than max attempts for review type
            review_count = Review.objects.filter(user=request.user, question=question).count()
            if review_count >= max_attempts:
                print("[Backend] Max review submissions reached, rejecting.")
                return Response(
                    {"correct": None, "pending": True, "message": "Maximum review submissions reached."},
                    status=status.HTTP_200_OK
                )

            # Save review submission
            Review.objects.create(
                user=request.user,
                question=question,
                answer_text=user_answer_text if answer_type == "descriptive-review" else None,
                answer_image=image_file if answer_type == "image-review" else None,
                status="pending",
            )

            return Response(
                {"correct": None, "pending": True, "message": "Answer submitted for review."},
                status=status.HTTP_200_OK
            )
        
        elif "match" in answer_type:
            print("[Backend] Handling MATCH type question")
            if not user_answer_text:
                return Response({"detail": "Answer is required"}, status=status.HTTP_400_BAD_REQUEST)

            is_correct = (user_answer_text == correct_answer)
            print(f"[Backend] MATCH result: {is_correct}")


            UserAnswer.objects.create(
                user=request.user,
                is_correct=is_correct,
                question=question,
                attempts=user_attempt_count + 1,
                answer_text=user_answer_text,
            )

            if not is_correct:
                return Response({"correct": False, "present": None}, status=status.HTTP_200_OK)                    #take it above cretion to not save incorrect answers
            

        elif  "image" in answer_type :
            print("[Backend] Handling IMAGE type question")
            if not image_file:
                return Response({"detail": "Answer image is required"}, status=status.HTTP_400_BAD_REQUEST)

            UserAnswer.objects.create(
                user=request.user,
                question=question,
                attempts=user_attempt_count + 1,
                answer_image=image_file,
            )
            is_correct = True  # Treat image submission as correct automatically

        elif "descriptive" in answer_type:
            print("[Backend] Handling DESCRIPTIVE type question")
            if not user_answer_text:
                return Response({"detail": "Answer is required"}, status=status.HTTP_400_BAD_REQUEST)

            UserAnswer.objects.create(
                user=request.user,
                question=question,
                attempts=user_attempt_count + 1,
                answer_text=user_answer_text
            )
            is_correct = True  # under review

        elif answer_type == "puzzle":
            print("[Backend] Handling PUZZLE type question")

            if user_answer_text == "puzzlesolved":
                UserAnswer.objects.create(
                    user=request.user,
                    question=question,
                    attempts=user_attempt_count + 1,
                    answer_text=user_answer_text
                )
                is_correct = True


        else:
            print("[Backend] ERROR: Unknown question type:", answer_type)
            return Response({"detail": "Unknown question type"}, status=status.HTTP_400_BAD_REQUEST)

        print("[Backend] UserAnswer saved successfully")


        present_data = unlock_nextlevel(present_level , progress)



        # ---- Final response ----
        response_data = {
            "correct": is_correct,
            "present": present_data,
            "message": "Answer processed successfully" if is_correct else "Answer pending or incorrect"
        }

        print("[Backend] Final Response:", response_data)
        print("=" * 50 + "\n")

        return Response(response_data, status=status.HTTP_200_OK)
