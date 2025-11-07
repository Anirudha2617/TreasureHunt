from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.utils.html import format_html
import base64
import re
from .models import Level, Question, Present, UserProgress, UserAnswer, Review, Mails, Mystery
from utils.image_access import create_thumbnail_from_drive
import nested_admin


# --------------------------------------------------------------------
# INLINE HIERARCHY
# Mystery → Level → Question → Mails / Present
# --------------------------------------------------------------------

class LevelInline(nested_admin.NestedStackedInline):
    model = Level
    extra = 0
    fields = ("name", "quest")
    classes = ['collapse']


# --------------------------------------------------------------------
# MYSTERY ADMIN (NESTED)
# --------------------------------------------------------------------
@admin.register(Mystery)
class MysteryAdmin(nested_admin.NestedModelAdmin):
    list_display = ("name", "created_by", "starts_at", "ends_at", "joining_pin", "created_at")
    list_filter = ("created_by", "starts_at", "ends_at")
    search_fields = ("name", "description", "joining_pin")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
    inlines = [LevelInline]

    fieldsets = (
        ("Mystery Info", {"fields": ("name", "description", "home_page")}),
        ("Creator & Timing", {"fields": ("created_by", "starts_at", "ends_at")}),
        ("Access Control", {"fields": ("joining_pin",)}),
        ("Metadata", {"fields": ("created_at",), "classes": ("collapse",)}),
    )


# --------------------------------------------------------------------
# NESTED INLINES FOR LEVEL -> QUESTION -> MAILS
# --------------------------------------------------------------------
class MailInlineForQuestion(nested_admin.NestedTabularInline):
    model = Mails
    extra = 0
    max_num = 10
    fields = ("subject", "message_text", "image", "image_preview", "image_url", "message")
    readonly_fields = ("image_preview", "image_url")
    classes = ['collapse']

    def image_preview(self, obj):
        if not obj.image_url:
            return "No image"
        match = re.search(r"id=([^&]+)", obj.image_url)
        if not match:
            return "Invalid Drive URL"
        file_id = match.group(1)
        return format_html(
            '<img src="/admin/image-proxy/{}" width="120" loading="lazy" style="border:1px solid #ccc; border-radius:4px"/>',
            file_id
        )
    image_preview.short_description = "Image Preview"


class QuestionInline(nested_admin.NestedTabularInline):
    model = Question
    extra = 1
    max_num = 10
    fields = ("question", "question_image", "question_image_url", "answer", "max_attempts", "answer_type")
    inlines = [MailInlineForQuestion]
    classes = ['collapse']


class PresentInline(nested_admin.NestedStackedInline):
    model = Present
    extra = 1
    max_num = 1
    fields = ("title", "type", "content", "image", "image_url")
    classes = ['collapse']


# --------------------------------------------------------------------
# TOP-LEVEL ADMINS
# --------------------------------------------------------------------

@admin.register(Level)
class LevelAdmin(nested_admin.NestedModelAdmin):
    list_display = ("id", "name", "quest")
    search_fields = ("name", "quest")
    list_filter = ("mystery",)
    inlines = [QuestionInline, PresentInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Prefetch related_name fields
        return qs.prefetch_related("questions", "present")


@admin.register(Mails)
class MailsAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "question", "image_preview")
    search_fields = ("subject", "message_text")
    list_filter = ("question",)
    readonly_fields = ("image_preview", "image_url")
    fields = ("subject", "message_text", "question", "image", "image_preview", "image_url", "message")
    raw_id_fields = ("question",)

    def image_preview(self, obj):
        if not obj.image_url:
            return "No image"
        match = re.search(r"id=([^&]+)", obj.image_url)
        if not match:
            return "Invalid Drive URL"
        file_id = match.group(1)
        return format_html(
            '<img src="/admin/image-proxy/{}" width="120" loading="lazy" style="border:1px solid #ccc; border-radius:4px"/>',
            file_id
        )
    image_preview.short_description = "Image Preview"


# Inlines for QuestionAdmin
class UserAnswerInlineForQuestion(admin.TabularInline):
    model = UserAnswer
    extra = 0
    max_num = 10
    readonly_fields = ("user", "attempts", "answer_text", "answer_image", "answer_image_url", "is_correct")
    fields = ("user", "attempts", "answer_text", "answer_image", "answer_image_url", "is_correct")
    can_delete = False
    show_change_link = True
    raw_id_fields = ("user",)
    classes = ['collapse']


class ReviewInlineForQuestion(admin.TabularInline):
    model = Review
    extra = 0
    max_num = 10
    readonly_fields = ("user", "answer_text", "answer_image_preview", "status", "created_at", "reviewed_at")
    fields = ("user", "answer_text", "answer_image_preview", "status", "created_at", "reviewed_at")
    can_delete = False
    show_change_link = True
    raw_id_fields = ("user",)
    classes = ['collapse']

    def answer_image_preview(self, obj):
        if not obj.answer_image_url:
            return "No image"
        match = re.search(r"id=([^&]+)", obj.answer_image_url)
        if not match:
            return "Invalid Drive URL"
        file_id = match.group(1)
        file_bytes, mime_type = create_thumbnail_from_drive(file_id)
        encoded = base64.b64encode(file_bytes).decode()
        return format_html(
            '<img src="data:{};base64,{}" width="120" loading="lazy" style="border:1px solid #ccc"/>',
            mime_type,
            encoded
        )
    answer_image_preview.short_description = "Review Image"


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "question_text_short", "level", "answer_type", "max_attempts", "image_preview")
    search_fields = ("question",)
    list_filter = ("level", "answer_type")
    readonly_fields = ("image_preview",)
    fields = ("level", "question", "question_image", "image_preview", "question_image_url", "answer", "answer_type", "max_attempts")
    inlines = [UserAnswerInlineForQuestion, ReviewInlineForQuestion, MailInlineForQuestion]
    raw_id_fields = ("level",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("level")

    def question_text_short(self, obj):
        return obj.question[:50] + ("..." if len(obj.question) > 50 else "")
    question_text_short.short_description = "Question"

    def image_preview(self, obj):
        if not obj.question_image_url:
            return "No image"
        match = re.search(r"id=([^&]+)", obj.question_image_url)
        if not match:
            return "Invalid Drive URL"
        file_id = match.group(1)
        return format_html(
            '<img src="/admin/image-proxy/{}" width="120" loading="lazy" style="border:1px solid #ccc"/>',
            file_id
        )
    image_preview.short_description = "Preview"


@admin.register(Present)
class PresentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "type", "level", "image_preview")
    search_fields = ("title",)
    list_filter = ("type", "level")
    readonly_fields = ("image_preview",)
    fields = ("level", "title", "type", "content", "image", "image_preview", "image_url")
    raw_id_fields = ("level",)

    def image_preview(self, obj):
        if not obj.image_url:
            return "No image"
        match = re.search(r"id=([^&]+)", obj.image_url)
        if not match:
            return "Invalid Drive URL"
        file_id = match.group(1)
        return format_html(
            '<img src="/admin/image-proxy/{}" width="120" loading="lazy" style="border:1px solid #ccc"/>',
            file_id
        )
    image_preview.short_description = "Preview"


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "total_attempts", "completed_count", "unlocked_count")
    filter_horizontal = ("completed_levels", "collected_presents", "unlocked_levels")
    raw_id_fields = ("user",)

    def completed_count(self, obj):
        return obj.completed_levels.count()

    def unlocked_count(self, obj):
        return obj.unlocked_levels.count()


# Inlines for CustomUserAdmin
class UserAnswerInlineForUser(admin.TabularInline):
    model = UserAnswer
    extra = 0
    max_num = 10
    readonly_fields = ("question", "attempts", "answer_text", "answer_image_url")
    fields = ("question", "attempts", "answer_text", "answer_image_url")
    can_delete = False
    show_change_link = True
    raw_id_fields = ("question",)
    classes = ['collapse']


class ReviewInlineForUser(admin.TabularInline):
    model = Review
    fk_name = "user"
    extra = 0
    max_num = 10
    readonly_fields = ("question", "answer_text", "answer_image_preview", "status", "created_at", "reviewed_at")
    fields = ("question", "answer_text", "answer_image_preview", "status", "created_at", "reviewed_at")
    can_delete = False
    show_change_link = True
    raw_id_fields = ("question",)
    classes = ['collapse']

    def answer_image_preview(self, obj):
        if not obj.answer_image_url:
            return "No image"
        match = re.search(r"id=([^&]+)", obj.answer_image_url)
        if not match:
            return "Invalid Drive URL"
        file_id = match.group(1)
        return format_html(
            '<img src="/admin/image-proxy/{}" width="120" loading="lazy" style="border:1px solid #ccc"/>',
            file_id
        )
    answer_image_preview.short_description = "Review Image"


# CUSTOM USER ADMIN
admin.site.unregister(User)
@admin.register(User)
class CustomUserAdmin(DefaultUserAdmin):
    inlines = [UserAnswerInlineForUser, ReviewInlineForUser]


@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "question", "attempts", "has_text", "image_preview", "is_correct")
    search_fields = ("user__username", "question__question", "answer_text")
    list_filter = ("question__level__mystery","question__level",)
    readonly_fields = ("image_preview",)
    fields = ("user", "question", "attempts", "answer_text", "answer_image", "image_preview", "answer_image_url", "is_correct")
    raw_id_fields = ("user", "question")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("user", "question", "question__level")

    def has_text(self, obj):
        return bool(obj.answer_text)
    has_text.boolean = True

    def image_preview(self, obj):
        if not obj.answer_image_url:
            return "No image"
        match = re.search(r"id=([^&]+)", obj.answer_image_url)
        if not match:
            return "Invalid Drive URL"
        file_id = match.group(1)
        return format_html(
            '<img src="/admin/image-proxy/{}" width="120" loading="lazy" style="border:1px solid #ccc"/>',
            file_id
        )
    image_preview.short_description = "Preview"


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "question", "user", "status", "created_at", "reviewed_at", "answer_preview_short")
    list_filter = ("status", "question__level", "created_at")
    search_fields = ("user__username", "question__question", "answer_text")
    readonly_fields = ("answer_image_preview", "created_at", "reviewed_at")
    fields = ("question", "user", "answer_text", "answer_image_preview", "status", "reviewer", "created_at", "reviewed_at")
    actions = ["approve_reviews", "reject_reviews"]
    raw_id_fields = ("user", "question")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("user", "question", "question__level")

    def answer_image_preview(self, obj):
        if not obj.answer_image_url:
            return "No image"
        match = re.search(r"id=([^&]+)", obj.answer_image_url)
        if not match:
            return "Invalid Drive URL"
        file_id = match.group(1)
        return format_html(
            '<img src="/admin/image-proxy/{}" width="120" loading="lazy" style="border:1px solid #ccc"/>',
            file_id
        )
    answer_image_preview.short_description = "Review Image"

    def answer_preview_short(self, obj):
        return (obj.answer_text[:40] + "...") if obj.answer_text and len(obj.answer_text) > 40 else obj.answer_text

    def approve_reviews(self, request, queryset):
        updated = queryset.update(status="approved", reviewer=request.user)
        self.message_user(request, f"{updated} review(s) approved successfully.")
    approve_reviews.short_description = "✅ Approve selected reviews"

    def reject_reviews(self, request, queryset):
        updated = queryset.update(status="rejected", reviewer=request.user)
        self.message_user(request, f"{updated} review(s) rejected successfully.")
    reject_reviews.short_description = "❌ Reject selected reviews"
