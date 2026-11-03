// app/api/forms/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFormsAdminClient } from '@/lib/supabase/adminDatabases';
import { sendFormSubmissionEmails } from '@/lib/email';

const supabase = getFormsAdminClient();

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

function resolveApplicantName(formData: FormSubmissionData['form_data']): string {
  const fullName =
    formData.name ||
    formData.ad ||
    formData.isim ||
    formData.ad_soyad ||
    formData.full_name ||
    (formData.firstName && formData.lastName
      ? `${formData.firstName} ${formData.lastName}`
      : formData.firstName || formData.lastName);

  return typeof fullName === 'string' ? fullName : 'Başvuru Sahibi';
}

async function sendSubmissionEmail(
  formData: FormSubmissionData['form_data'],
  submissionResult: SubmissionResult
) {
  const applicantEmail = formData.email || formData.e_posta || formData.eposta;
  const formTitle = submissionResult.formTitle || 'Başvuru Formu';
  const submissionId =
    submissionResult.submissionId ||
    `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  if (typeof applicantEmail !== 'string' || !applicantEmail.trim()) {
    return NextResponse.json({
      success: true,
      submissionId,
      formTitle,
      emailSent: false,
      emailError: 'E-posta adresi bulunamadı',
      message: 'Form başarıyla gönderildi ancak e-posta adresi bulunamadığı için e-posta gönderilemedi',
    });
  }

  try {
    const emailData: EmailData = {
      applicantName: resolveApplicantName(formData),
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
      formData: sanitizeFormDataForEmail(formData),
    };
    const emailResult: EmailResult = await sendFormSubmissionEmails(emailData);

    return NextResponse.json({
      success: true,
      submissionId,
      formTitle,
      emailSent: emailResult.success,
      emailError: emailResult.success ? undefined : 'E-posta gönderilirken hata oluştu',
      emailErrors: emailResult.errors,
      message: emailResult.success
        ? 'Form başarıyla gönderildi ve e-posta gönderildi'
        : 'Form başarıyla gönderildi ancak e-posta gönderilemedi',
    });
  } catch (error) {
    console.error(
      '[forms/submit] Email failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json({
      success: true,
      submissionId,
      formTitle,
      emailSent: false,
      emailError: 'E-posta gönderilirken hata oluştu',
      message: 'Form başarıyla gönderildi ancak e-posta gönderilemedi',
    });
  }
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

    return sendSubmissionEmail(form_data, submissionResult);
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
