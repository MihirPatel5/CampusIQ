from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeStructureViewSet, InvoiceViewSet, PaymentViewSet, generate_invoices

router = DefaultRouter()
router.register(r'fees/structures', FeeStructureViewSet, basename='feestructure')
router.register(r'fees/invoices', InvoiceViewSet, basename='invoice')
router.register(r'fees/payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('fees/invoices/generate/', generate_invoices, name='generate-invoices'),
    path('', include(router.urls)),
]
