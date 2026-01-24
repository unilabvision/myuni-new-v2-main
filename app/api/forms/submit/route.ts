// app/api/forms/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendFormSubmissionEmails } from '@/lib/email';

// Define file upload interface
interface FileUpload {
  name: string;
  size: number;
  type: string;
  data: string | Buffer; // Base64 string or Buffer
  lastModified?: number;
}

// Define form field value type that matches email library expectations
type FormFieldValue = string | number | boolean | null | undefined;

// Define interfaces for type safety
interface FormSubmissionData {
  form_config_id: string;
  form_data: {
    email?: string;
    e_posta?: string;
    eposta?: string;
    name?: string;
    ad?: string;
    isim?: string;
    ad_soyad?: string;
    full_name?: string;
    firstName?: string;
    lastName?: string;
    // Allow additional string, number, boolean, or array fields
    [key: string]: string | number | boolean | string[] | undefined;
  };
  files?: FileUpload[] | Record<string, FileUpload> | null;
  user_agent?: string;
}

interface SubmissionResult {
  success: boolean;
  error?: string;
  formTitle?: string;
  submissionId?: string;
}

interface EmailData {
  applicantName: string;
  applicantEmail: string;
  formTitle: string;
  submissionId: string;
  submissionDate: string;
  formData: Record<string, FormFieldValue>; // Updated to match email library expectations
}

interface EmailResult {
  success: boolean;
  errors?: string[];
}

type FormConfigSource = 'legacy' | 'unilab';

interface FormConfigRecord {
  title: Record<string, string> | string;
  is_active: boolean;
}

// Submit form function implementation
async function submitForm(data: {
  form_config_id: string;
  form_data: FormSubmissionData['form_data'];
  files?: FileUpload[] | Record<string, FileUpload> | null;
  user_agent?: string;
}): Promise<SubmissionResult> {
  try {
    let configSource: FormConfigSource | null = null;
    let formConfig: FormConfigRecord | null = null;

    const { data: legacyConfig, error: legacyError } = await supabase
      .from('form_configs')
      .select('title, is_active')
      .eq('id', data.form_config_id)
      .single();

    if (!legacyError && legacyConfig) {
      formConfig = legacyConfig;
      configSource = 'legacy';
    } else {
      const { data: newConfig, error: newConfigError } = await supabase
        .from('unilab_vision_form_configs')
        .select('title, is_active')
        .eq('id', data.form_config_id)
        .single();

      if (!newConfigError && newConfig) {
        formConfig = newConfig;
        configSource = 'unilab';
      } else if (legacyError && legacyError.code && legacyError.code !== 'PGRST116') {
        console.error('Legacy form config lookup error:', legacyError);
      } else if (newConfigError && newConfigError.code && newConfigError.code !== 'PGRST116') {
        console.error('Unilab form config lookup error:', newConfigError);
      }
    }

    if (!formConfig || !configSource) {
      return {
        success: false,
        error: 'Form configuration not found'
      };
    }

    if (!formConfig.is_active) {
      return {
        success: false,
        error: 'Form is not active'
      };
    }

    const basePayload = {
      form_config_id: data.form_config_id,
      form_data: data.form_data,
      files: data.files ?? null,
      user_agent: data.user_agent ?? null,
      ip_address: null
    };

    const nowIso = new Date().toISOString();
    const tableName = configSource === 'legacy' ? 'form_submissions' : 'unilab_vision_apply';
    const insertPayload =
      configSource === 'legacy'
        ? {
            ...basePayload,
            submitted_at: nowIso,
            status: 'submitted'
          }
        : {
            ...basePayload,
            status: 'pending'
          };

    const { data: submission, error: submissionError } = await supabase
      .from(tableName)
      .insert(insertPayload)
      .select('id')
      .single();

    if (submissionError) {
      console.error('Submission error:', submissionError);
      return {
        success: false,
        error: 'Failed to save form submission'
      };
    }

    return {
      success: true,
      formTitle: resolveFormTitle(formConfig.title),
      submissionId: submission.id
    };
  } catch (error) {
    console.error('submitForm error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function resolveFormTitle(title: unknown): string {
  if (typeof title === 'string') {
    return title;
  }

  if (title && typeof title === 'object') {
    const titleRecord = title as Record<string, unknown>;
    const preferredKeys = ['tr', 'en'];

    for (const key of preferredKeys) {
      const value = titleRecord[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    const fallbackValue = Object.values(titleRecord).find((val) => typeof val === 'string');
    if (typeof fallbackValue === 'string') {
      return fallbackValue;
    }
  }

  return 'Başvuru Formu';
}

// Helper function to convert form data to email-compatible format
function sanitizeFormDataForEmail(
  formData: FormSubmissionData['form_data']
): Record<string, FormFieldValue> {
  const sanitized: Record<string, FormFieldValue> = {};
  
  Object.entries(formData).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Convert arrays to comma-separated strings for email compatibility
      sanitized[key] = value.join(', ');
    } else if (value === undefined) {
      // Convert undefined to null for consistency
      sanitized[key] = null;
    } else {
      // Keep other values as-is (string, number, boolean)
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FormSubmissionData;
    const { form_config_id, form_data, files, user_agent } = body;

    // Only log basic info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Form submission process started');
    }

    // Submit form to database
    const submissionResult: SubmissionResult = await submitForm({
      form_config_id,
      form_data,
      files,
      user_agent,
    });

    if (!submissionResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database submission failed:', submissionResult.error);
      }
      return NextResponse.json(
        { success: false, error: submissionResult.error },
        { status: 400 }
      );
    }

    // Extract email and name from form_data for email sending
    const applicantEmail = form_data.email || form_data.e_posta || form_data.eposta;
    const applicantName =
      form_data.name ||
      form_data.ad ||
      form_data.isim ||
      form_data.ad_soyad ||
      form_data.full_name ||
      (form_data.firstName && form_data.lastName
        ? `${form_data.firstName} ${form_data.lastName}`
        : form_data.firstName || form_data.lastName) ||
      'Başvuru Sahibi';

    // Get form title and submission ID from submissionResult
    const formTitle = submissionResult.formTitle || 'Başvuru Formu';
    const submissionId =
      submissionResult.submissionId ||
      `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Only send emails if we have an email address
    if (applicantEmail && typeof applicantEmail === 'string' && applicantEmail.trim()) {
      try {
        const emailData: EmailData = {
          applicantName: typeof applicantName === 'string' ? applicantName : 'Başvuru Sahibi',
          applicantEmail: applicantEmail.trim(),
          formTitle,
          submissionId,
          submissionDate: new Date().toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          formData: sanitizeFormDataForEmail(form_data), // Use sanitized data
        };

        const emailResult: EmailResult = await sendFormSubmissionEmails(emailData);

        if (process.env.NODE_ENV === 'development') {
          console.log('Email sending completed:', emailResult.success ? 'Success' : 'Failed');
        }

        return NextResponse.json({
          success: true,
          submissionId,
          formTitle,
          emailSent: emailResult.success,
          emailError: emailResult.success ? undefined : 'E-posta gönderilirken hata oluştu',
          emailErrors: emailResult.errors,
          message: emailResult.success 
            ? 'Form başarıyla gönderildi ve e-posta gönderildi' 
            : 'Form başarıyla gönderildi ancak e-posta gönderilemedi'
        });
      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        
        if (process.env.NODE_ENV === 'development') {
          console.error('Email sending error:', errorMessage);
        }
        
        // Return success for form submission even if email fails
        return NextResponse.json({
          success: true,
          submissionId,
          formTitle,
          emailSent: false,
          emailError: 'E-posta gönderilirken hata oluştu',
          message: 'Form başarıyla gönderildi ancak e-posta gönderilemedi'
        });
      }
    } else {
      // No email provided, just return form submission success
      if (process.env.NODE_ENV === 'development') {
        console.log('No email address provided, skipping email sending');
      }
      
      return NextResponse.json({
        success: true,
        submissionId,
        formTitle,
        emailSent: false,
        emailError: 'E-posta adresi bulunamadı',
        message: 'Form başarıyla gönderildi ancak e-posta adresi bulunamadığı için e-posta gönderilemedi'
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Form submission error:', errorMessage);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Form gönderilirken hata oluştu',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}