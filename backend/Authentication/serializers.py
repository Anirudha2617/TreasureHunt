from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

# ---------------- Register Serializer ----------------
class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with that email already exists.")]
    )
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True, required=True, label='Confirm Password'
    )

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'dob')
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


# ---------------- User Serializer ----------------
class UserSerializer(serializers.ModelSerializer):
    profilePic = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "profilePic", "dob")

    def get_profilePic(self, obj):
        # Example: generate an avatar based on username
        return f"https://api.dicebear.com/6.x/initials/svg?seed={obj.username}"
