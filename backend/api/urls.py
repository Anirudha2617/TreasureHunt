from django.urls import path
from .views import LevelsView, LevelDetailView, UserProgressView, UserSubmitAnswer, GetHint, MysteryView, SelfMysteries, get_user_mysteries

urlpatterns = [
    path("levels/<int:mystery_id>", LevelsView.as_view(), name="levels"),
    path("levels/<int:level_id>/", LevelDetailView.as_view(), name="level_detail"),
    path("user/progress/<int:mystery_id>", UserProgressView.as_view(), name="user_progress"),
    path("question/<str:question_id>/submit/", UserSubmitAnswer.as_view(), name="submit_answer"),  # str instead of int
    path("question/<str:question_id>/hint/", GetHint.as_view(), name="get_hint"),  # str instead of int
    path("mysteries/", MysteryView.as_view(), name="mysteries"),
    path("mysteries/self/", SelfMysteries.as_view(), name="self_mysteries"),
    path("mysteries/self/<int:mystery_id>", get_user_mysteries, name="mystery"),
]
