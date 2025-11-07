from django.urls import path
from .views import RegisterView, UserProfileView, LogoutView

urlpatterns = [
    # path('login/', ),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('user/profile/', UserProfileView.as_view(), name='user_profile'),
    path("logout/", LogoutView.as_view(), name="logout"),
]

