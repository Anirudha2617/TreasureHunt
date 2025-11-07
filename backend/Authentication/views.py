# authentication/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny] 
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        print( "Here")
        if serializer.is_valid():
            user = serializer.save()
            # Handle successful registration
            return Response({"user": "created"}, status=status.HTTP_201_CREATED)
        
        # This is where the errors are returned
        print(serializer.errors , "Here 2")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveAPIView):
    """
    API endpoint to retrieve the authenticated user's profile.
    Requires authentication.
    """
    permission_classes = (IsAuthenticated,) # Only authenticated users can access
    authentication_classes = (JWTAuthentication,)
    serializer_class = UserSerializer

    def get_object(self):
        # Return the currently authenticated user
        return self.request.user

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except KeyError:
            return Response({"detail": "refresh_token required"}, status=status.HTTP_400_BAD_REQUEST)
        except TokenError:
            return Response({"detail": "Invalid or expired refresh token"}, status=status.HTTP_400_BAD_REQUEST)
