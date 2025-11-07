from django.db import models
from django.contrib.auth.models import User

# Add DOB dynamically
if not hasattr(User, 'dob'):
    User.add_to_class('dob', models.DateField(null=True, blank=True))
