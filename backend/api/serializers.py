from rest_framework import serializers
from .models import (
    Mystery, Level, Question, Present, UserProgress, UserAnswer, Review, Mails
)

# =====================================================
# 🔹 Question Serializer
# =====================================================
class QuestionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    levelId = serializers.SerializerMethodField()
    maxAttempts = serializers.IntegerField(source='max_attempts')
    attempts = serializers.SerializerMethodField()
    type = serializers.CharField(source='answer_type')
    status = serializers.SerializerMethodField()
    questionImage = serializers.URLField(source='question_image_url', allow_null=True)

    class Meta:
        model = Question
        fields = [
            'id', 'levelId', 'question', 'maxAttempts',
            'attempts', 'status', 'type', 'questionImage'
        ]

    def get_id(self, obj):
        return f"q{obj.id}"

    def get_levelId(self, obj):
        return f"level-{obj.level.id}"

    def get_attempts(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return 0
        return UserAnswer.objects.filter(user=request.user, question=obj).count()

    def get_status(self, obj):
        """
        Returns { completed: bool, pending: bool }
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or user.is_anonymous:
            return {"completed": False, "pending": False}

        correct_answer = UserAnswer.objects.filter(user=user, question=obj, is_correct=True).first()
        if not correct_answer:
            return {"completed": False, "pending": False}

        # For reviewable questions
        if obj.answer_type in ["descriptive-review", "image-review"]:
            review = Review.objects.filter(user=user, question=obj).first()
            if review:
                if review.status == "pending":
                    return {"completed": False, "pending": True}
                elif review.status == "approved":
                    return {"completed": True, "pending": False}
                elif review.status == "rejected":
                    return {"completed": False, "pending": False}
            return {"completed": False, "pending": True}

        # Otherwise, normal question
        return {"completed": True, "pending": False}


# =====================================================
# 🔹 Present Serializer
# =====================================================
import re

class PresentSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    levelId = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Present
        fields = ["id", "type", "content", "title", "levelId", "image"]

    def get_id(self, obj):
        return f"present-{obj.id}"

    def get_levelId(self, obj):
        return f"level-{obj.level.id}" if getattr(obj, "level", None) else None

    def get_image(self, obj):
        url = getattr(obj, "image_url", None)
        if not url:
            return None
        match = re.search(r"id=([^&]+)", url)
        return match.group(1) if match else None


# =====================================================
# 🔹 LevelQuestion Serializer (optimized)
# =====================================================
class LevelQuestionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'status']

    def get_id(self, obj):
        return f"q{obj.id}"

    def get_status(self, obj):
        correct_answer_qids = self.context.get("correct_answer_qids", set())
        review_statuses = self.context.get("review_statuses", {})

        if obj.id not in correct_answer_qids:
            return {"completed": False, "pending": False}

        if obj.answer_type in ["descriptive-review", "image-review"]:
            status = review_statuses.get(obj.id)
            if status == "pending":
                return {"completed": False, "pending": True}
            elif status == "approved":
                return {"completed": True, "pending": False}
            elif status is None:
                return {"completed": False, "pending": True}
            return {"completed": False, "pending": False}

        return {"completed": True, "pending": False}


# =====================================================
# 🔹 Level Serializer
# =====================================================
class LevelSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    isUnlocked = serializers.SerializerMethodField()
    isCompleted = serializers.SerializerMethodField()
    questions = LevelQuestionSerializer(many=True, read_only=True)
    present = serializers.SerializerMethodField()
    mystery = serializers.StringRelatedField()

    class Meta:
        model = Level
        fields = [
            'id', 'name', 'quest', 'mystery',
            'isUnlocked', 'isCompleted', 'questions', 'present'
        ]

    def get_id(self, obj):
        return f"level-{obj.id}"

    def get_isUnlocked(self, obj):
        unlocked_ids = self.context.get("unlocked_ids", set())
        return obj.id in unlocked_ids

    def get_isCompleted(self, obj):
        completed_ids = self.context.get("completed_ids", set())
        return obj.id in completed_ids

    def get_present(self, obj):
        if self.get_isCompleted(obj) and hasattr(obj, "present") and obj.present:
            return PresentSerializer(obj.present, context=self.context).data
        return None


# =====================================================
# 🔹 Single Level Serializer (detailed view)
# =====================================================
class SingleLevelSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    isUnlocked = serializers.SerializerMethodField()
    isCompleted = serializers.SerializerMethodField()
    questions = QuestionSerializer(many=True, read_only=True)
    present = serializers.SerializerMethodField()
    mystery = serializers.StringRelatedField()

    class Meta:
        model = Level
        fields = [
            'id', 'name', 'quest', 'mystery',
            'isUnlocked', 'isCompleted', 'questions', 'present'
        ]

    def get_id(self, obj):
        return f"level-{obj.id}"

    def get_isUnlocked(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or user.is_anonymous:
            return False
        progress, _ = UserProgress.objects.get_or_create(user=user)
        first_level = Level.objects.order_by("id").first()
        return obj.id == first_level.id or obj in progress.unlocked_levels.all()

    def get_isCompleted(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or user.is_anonymous:
            return False
        progress, _ = UserProgress.objects.get_or_create(user=user)
        return obj in progress.completed_levels.all()

    def get_present(self, obj):
        if self.get_isCompleted(obj) and hasattr(obj, "present") and obj.present:
            return PresentSerializer(obj.present, context=self.context).data
        return None


# =====================================================
# 🔹 UserProgress Serializer
# =====================================================
class UserProgressSerializer(serializers.ModelSerializer):
    collectedPresents = serializers.SerializerMethodField()

    class Meta:
        model = UserProgress
        fields = ['collectedPresents']

    def get_collectedPresents(self, obj):
        return PresentSerializer(obj.collected_presents.all(), many=True, context=self.context).data


class MysterySerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()
    image = serializers.URLField(source='image_url', allow_null=True)
    join_status = serializers.SerializerMethodField()
    class Meta:
        model = Mystery
        fields = ['id', 'name' , 'description', 'image' , 'is_active', 'created_by' , 'starts_at' , 'ends_at', 'home_page' , "join_status"]

    def get_is_active(self, obj):
        return obj.is_active()
    def get_join_status(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or user.is_anonymous:
            return False
        if obj.participants.filter(id=user.id).exists():
            return True
        return False
    






#####       ----------------------------------------------------------------------
# 🔹 SelfMystery Serialize
# 
# =====================================================
