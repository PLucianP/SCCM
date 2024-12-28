# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password


class SignUpSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    repeat_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'repeat_password')

    def validate(self, attrs):
        if attrs['password'] != attrs['repeat_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "User with this email already exists."})
        return attrs

    def create(self, validated_data):
        # Use email as username
        user = User.objects.create(
            username=validated_data['email'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email')
        read_only_fields = ('email',)  # Email remains read-only for security

    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value
