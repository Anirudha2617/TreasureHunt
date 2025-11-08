from django.db import models
from django.contrib.auth.models import User
from utils.gdrive import upload_file_to_drive

class Mystery(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_mysteries")
    image = models.ImageField(upload_to="mysteries/", blank=True, null=True)
    image_url = models.URLField(blank=True , null=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_visible = models.BooleanField(default=True)
    joining_pin = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    home_page = models.TextField( blank=True, null=True)
    participants = models.ManyToManyField(User, related_name="mysteries", blank=True)

    def __str__(self):
        return self.name
    
    def is_active(self):
        from django.utils import timezone
        now = timezone.now()
        return self.starts_at <= now <= self.ends_at
    
    def save(self, *args, **kwargs):
        if self.image :
            print("Uploading question image to Google Drive...")
            drive_url = upload_file_to_drive(self.image, dir_name="mysteries")
            print("Drive URL:", drive_url)
            self.image_url = drive_url
            self.image.delete(save=False)  # cleanup local file
            self.image = None
        super().save(*args, **kwargs)


class Level(models.Model):
    mystery = models.ForeignKey(Mystery, related_name="levels", on_delete=models.CASCADE, default=1)
    name = models.CharField(max_length=100)
    quest = models.TextField( default="Solve the mystery!")

    def __str__(self):
        return self.name

class Mails(models.Model):
    subject = models.CharField(max_length=30) 
    message_text = models.TextField(null = True , blank=True)
    image = models.ImageField(upload_to="mails/" , blank=True , null=True)
    image_url = models.URLField(blank=True , null=True)
    message = models.JSONField(null=True, blank=True)
    question = models.ForeignKey("Question" , related_name = "hint_mail" , on_delete=models.CASCADE)

    def __str__(self):
        return super().__str__()

    def save(self, *args, **kwargs):
        print("Saving mail:", self.subject)
        if self.image :
            print("Uploading question image to Google Drive...")
            drive_url = upload_file_to_drive(self.image, dir_name="mails")
            print("Drive URL:", drive_url)
            self.image_url = drive_url
            self.image.delete(save=False)  # cleanup local file
            self.image = None
        super().save(*args, **kwargs)


class Question(models.Model):
    #match , descriptive , image , -review , puzzle , mail- , 
    level = models.ForeignKey(Level, related_name="questions", on_delete=models.CASCADE)
    question = models.TextField()
    question_image = models.ImageField(upload_to="questions/", blank=True, null=True) 
    question_image_url = models.URLField(blank=True, null=True)  # <── store Drive link
    answer = models.TextField(blank=True, null = True)
    answer_type = models.CharField(max_length=30, default="descriptive")  # 'text', 'image', etc.
    max_attempts = models.IntegerField(default=3)

    def __str__(self):
        return f"Q{self.id} - {self.level.name}"
    
    def save(self, *args, **kwargs):
        print("Saving Question:", self.question)
        if self.question_image :
            print("Uploading question image to Google Drive...")
            drive_url = upload_file_to_drive(self.question_image, dir_name="questions")
            print("Drive URL:", drive_url)
            self.question_image_url = drive_url
            self.question_image.delete(save=False)  # cleanup local file
            self.question_image = None
        return super().save(*args, **kwargs)

class Present(models.Model):
    level = models.OneToOneField(Level, related_name="present", on_delete=models.CASCADE)
    type = models.CharField(max_length=10)  # 'text', 'image', etc.
    content = models.TextField()
    title = models.CharField(max_length=100)
    image_url = models.URLField(blank=True, null=True)  # <── Drive link
    image = models.ImageField(upload_to="presents/", blank=True, null=True)  # <── new field

    def __str__(self):
        return f"{self.title} ({self.type})"
    
    def save(self, *args, **kwargs):
        print("Saving Question:", self.title)
        if self.image :
            print("Uploading question image to Google Drive...")
            drive_url = upload_file_to_drive(self.image, dir_name="presents")
            print("Drive URL:", drive_url)
            self.image_url = drive_url
            self.image.delete(save=False)  # cleanup local file
            self.image = None
        super().save(*args, **kwargs)


class UserProgress(models.Model):
    user = models.OneToOneField(User, related_name="progress", on_delete=models.CASCADE)
    completed_levels = models.ManyToManyField(Level, blank=True, related_name="completed_by")
    collected_presents = models.ManyToManyField(Present, blank=True, related_name="collected_by")
    unlocked_levels = models.ManyToManyField(Level, blank=True, related_name="unlocked_by")
    total_attempts = models.IntegerField(default=0)

    def __str__(self):
        return f"Progress of {self.user.username}"

class UserAnswer(models.Model):
    user = models.ForeignKey(User, related_name="answers", on_delete=models.CASCADE)
    question = models.ForeignKey(Question, related_name="user_answers", on_delete=models.CASCADE)
    is_correct = models.BooleanField(default=True)  # all answers here are correct
    attempts = models.IntegerField(default=0)
    answer_text = models.TextField()
    answer_image = models.ImageField(upload_to="answers/", blank=True, null=True)  # <── new field
    answer_image_url = models.URLField(blank=True, null=True)  # <── Drive link

    def __str__(self):
        return f"Answer by {self.user.username} for Q{self.question.id}"
    
    def save(self, *args, **kwargs):
        print("Saving Answer:", self.question)
        if self.answer_image :
            print("Uploading answer image to Google Drive...")
            drive_url = upload_file_to_drive(self.answer_image, dir_name="answers")
            print("Drive URL:", drive_url)
            self.answer_image_url = drive_url
            self.answer_image.delete(save=False)  # cleanup local file
            self.answer_image = None
        super().save(*args, **kwargs)


from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from utils.gdrive import upload_file_to_drive


class Review(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(User, related_name="reviews", on_delete=models.CASCADE)
    question = models.ForeignKey("Question", related_name="reviews", on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True, null=True)
    answer_image = models.ImageField(upload_to="review_answers/", blank=True, null=True)
    answer_image_url = models.URLField(blank=True, null=True)  # Drive link
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewer = models.ForeignKey(User, null=True, blank=True, related_name="reviewed", on_delete=models.SET_NULL)

    def __str__(self):
        return f"Review for {self.question} by {self.user.username} - {self.status}"

    def save(self, *args, **kwargs):
        """
        Custom save:
        - Upload image to Google Drive if provided.
        - When status changes to 'approved':
          → Create UserAnswer
          → Mark the level as completed
          → Unlock next level
          → Award present (if any)
        """
        print("Saving Review ...")
        # ---- Handle image upload to Google Drive ----
        if self.answer_image and not self.answer_image_url:
            print("[Review] Uploading answer image to Google Drive...")
            drive_url = upload_file_to_drive(self.answer_image, dir_name="review_answers")
            self.answer_image_url = drive_url
            self.answer_image.delete(save=False)  # cleanup local file
            self.answer_image = None
            print("[Review] Drive URL saved:", drive_url)

        super().save(*args, **kwargs)

        # ---- If approved, finalize ----
        if self.status == "approved":
            self._finalize_review()

    def _finalize_review(self):
        """
        Move data from Review → UserAnswer when approved
        and update user progress.
        """
        print("Approving review!!")
        from .models import UserAnswer, UserProgress, Level  # avoid circular import

        print(f"[Review] Finalizing approved review for question {self.question.id}")

        # Avoid duplicate finalization
        if UserAnswer.objects.filter(user=self.user, question=self.question).exists():
            print("[Review] Skipping finalization, UserAnswer already exists.")
            return

        # Create UserAnswer entry
        user_answer = UserAnswer.objects.create(
            user=self.user,
            question=self.question,
            attempts=1,
            answer_text=self.answer_text or "",
            answer_image_url=self.answer_image_url,
        )
        print(f"[Review] UserAnswer created: {user_answer.id}")

        # Update progress
        progress, _ = UserProgress.objects.get_or_create(user=self.user)
        current_level = self.question.level
        
        for questions in current_level.questions.all():
            if not UserAnswer.objects.filter(user=self.user, question=questions).exists():
                print("[Backend] Level NOT completed due to pending/unanswered questions.")
                break
        else:
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


        progress.save()
        self.reviewed_at = timezone.now()
        super().save(update_fields=["reviewed_at"])

        print("[Review] Review finalization complete.")
