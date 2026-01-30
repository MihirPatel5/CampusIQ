from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, NotificationSubscriptionViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'push-subscriptions', NotificationSubscriptionViewSet, basename='push-subscription')

urlpatterns = [
    path('', include(router.urls)),
]
