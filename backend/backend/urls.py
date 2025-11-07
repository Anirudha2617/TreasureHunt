from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from api.views import ImageProxyView, admin_image_proxy

urlpatterns = [
    # ✅ Media files route (for Render hacky serving)

    path('game/image/<str:image_id>/', ImageProxyView.as_view(), name='image_proxy'),
    path("admin/image-proxy/<str:file_id>/", admin_image_proxy, name="admin_image_proxy"),

    path('admin/', admin.site.urls),

    # Authentication app
    path('api/', include('Authentication.urls')),

    # Game app
    path('game/', include('api.urls')),

    # JWT token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]

# ✅ This is safe for local dev (Django runserver),
# but on Render it won't work unless DEBUG=True.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
