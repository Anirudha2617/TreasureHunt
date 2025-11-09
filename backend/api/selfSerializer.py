
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Mystery, Level, Question, Present, Mails, Review, UserAnswer, UserProgress


# -------------------------------
# User Serializer (Lightweight)
# -------------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


# -------------------------------
# Mail Serializer
# -------------------------------
class MailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mails
        fields = ["id", "subject", "message_text", "image_url", "message"]


# -------------------------------
# Question Serializer
# -------------------------------
class QuestionSerializer(serializers.ModelSerializer):
    hint_mail = MailSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = [
            "id",
            "question",
            "question_image_url",
            "answer",
            "answer_type",
            "max_attempts",
            "hint_mail",
        ]


# -------------------------------
# Present Serializer
# -------------------------------
class PresentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Present
        fields = ["id", "title", "type", "content", "image_url"]


# -------------------------------
# Level Serializer (Nested)
# -------------------------------
class LevelSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    present = PresentSerializer(read_only=True)

    class Meta:
        model = Level
        fields = ["id", "name", "quest", "questions", "present"]


# -------------------------------
# Review Serializer
# -------------------------------
class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    question = serializers.StringRelatedField()

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "question",
            "answer_text",
            "answer_image_url",
            "status",
            "created_at",
            "reviewed_at",
            "reviewer_id",
        ]


# -------------------------------
# UserAnswer Serializer
# -------------------------------
class UserAnswerSerializer(serializers.ModelSerializer):
    question = serializers.StringRelatedField()

    class Meta:
        model = UserAnswer
        fields = ["id", "question", "answer_text", "answer_image_url", "is_correct", "attempts"]


# -------------------------------
# UserProgress Serializer
# -------------------------------
class UserProgressSerializer(serializers.ModelSerializer):
    completedLevels = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="name"
    )
    unlocked_levels = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="name"
    )
    collectedPresents = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="title"
    )
    totalAttempts = serializers.IntegerField(source='total_attempts')
    class Meta:
        model = UserProgress
        fields = [
            "id",
            "user_id",
            "completedLevels",
            "unlocked_levels",
            "collectedPresents",
            "totalAttempts",
        ]


# -------------------------------
# Full Mystery Serializer
# -------------------------------
class FullMysterySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    levels = LevelSerializer(many=True, read_only=True)
    user_reviews = ReviewSerializer(many=True, read_only=True)
    user_progress = UserProgressSerializer(many=True, read_only=True)

    class Meta:
        model = Mystery
        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "image_url",
            "starts_at",
            "ends_at",
            "is_visible",
            "joining_pin",
            "created_at",
            "home_page",
            "participants",
            "levels",
            "user_reviews",
            "user_progress",
        ]
