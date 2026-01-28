"""
Health check endpoint for deployment monitoring
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt


@require_http_methods(["GET"])
@csrf_exempt
def health_check(request):
    """
    Simple health check endpoint.
    Returns 200 OK if application is running.
    """
    return JsonResponse({
        'status': 'healthy',
        'application': 'CampusIQ',
        'version': '1.0.0'
    })
