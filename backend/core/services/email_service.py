import logging
import os
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives, send_mail
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

class EmailBackendError(Exception):
    """Custom exception for email backend errors"""
    pass

class EmailService:
    """
    Email service implementation using Django's email backend.
    This abstraction allows using SMTP (Google, etc.) or Console backend transparently.
    """
    
    def send_email(self, subject: str, to_emails: List[str], html_content: str = None, 
                   text_content: str = None, from_email: str = None, attachments: List = None) -> Dict[str, Any]:
        """Send email using Django's EmailBackend"""
        try:
            from_email = from_email or settings.DEFAULT_FROM_EMAIL
            
            # If text_content is not provided, strip tags from html_content
            if html_content and not text_content:
                text_content = strip_tags(html_content)
            
            if not text_content and not html_content:
                text_content = ""

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=to_emails
            )
            
            if html_content:
                msg.attach_alternative(html_content, "text/html")
            
            if attachments:
                for filename, file_data, mimetype in attachments:
                    msg.attach(filename, file_data, mimetype)
            
            msg.send()
            
            logger.info(f"Email sent successfully to {to_emails}")
            return {
                "success": True, 
                "message": "Email sent successfully", 
                "backend": "django_smtp"
            }
                
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            raise EmailBackendError(f"Email error: {str(e)}")

# Global Email service instance
email_service = EmailService()

def send_email_with_template(template_name: str, context: Dict[str, Any], 
                           subject: str, to_emails: List[str], 
                           from_email: str = None) -> Dict[str, Any]:
    """Send email using a template"""
    try:
        # Render template
        # Ensure templates exist in 'email_templates/' directory
        try:
            html_content = render_to_string(f"email_templates/{template_name}.html", context)
        except Exception as e:
            # Fallback for dev if template missing
            logger.warning(f"Template {template_name} missing: {e}. Using raw context.")
            html_content = f"<h1>{subject}</h1><pre>{context}</pre>"
        
        return email_service.send_email(
            subject=subject,
            to_emails=to_emails,
            html_content=html_content,
            from_email=from_email
        )
        
    except Exception as e:
        logger.error(f"Template email send failed: {e}")
        raise ValueError(f"Template email error: {str(e)}")

def send_verification_email(to_email: str, verification_link: str, user_name: str = None) -> Dict[str, Any]:
    """Send verification email with link (User provided Helper)"""
    context = {
        'user_name': user_name or 'User',
        'verification_link': verification_link,
        'frontend_url': getattr(settings, 'FRONTEND_URL', '')
    }
    
    return send_email_with_template(
        template_name='verification_email',
        context=context,
        subject='Verify Your Email',
        to_emails=[to_email]
    )

def send_otp_email(to_email: str, otp: str, user_name: str = None) -> Dict[str, Any]:
    """Send OTP email (CampusIQ flow)"""
    context = {
        'user_name': user_name or 'User',
        'otp': otp,
        'frontend_url': getattr(settings, 'FRONTEND_URL', '')
    }
    
    return send_email_with_template(
        template_name='otp_email',
        context=context,
        subject='CampusIQ - Verify your email',
        to_emails=[to_email]
    )

def send_password_reset_email(to_email: str, reset_link: str, user_name: str = None) -> Dict[str, Any]:
    """Send password reset email"""
    context = {
        'user_name': user_name or 'User',
        'reset_link': reset_link,
        'frontend_url': getattr(settings, 'FRONTEND_URL', '')
    }
    
    return send_email_with_template(
        template_name='password_reset_email',
        context=context,
        subject='Password Reset Request',
        to_emails=[to_email]
    )
