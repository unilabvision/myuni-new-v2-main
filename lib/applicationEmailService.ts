import { sendEmail } from '@/lib/email';
import type { ApplicationContextType, ApplicationStatus, LocalizedText } from '@/lib/types/application';
import { APPLICATION_STATUS_LABELS, CONTEXT_TYPE_LABELS } from '@/lib/types/application';

function baseHtml(content: string) {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">${content}<p style="margin-top:24px;font-size:12px;color:#888">MyUNI Başvuru Sistemi</p></body></html>`;
}

function resolveTitle(title: LocalizedText | string | null | undefined, locale = 'tr'): string {
  if (!title) return 'Başvuru';
  if (typeof title === 'string') return title;
  return title[locale] || title.tr || title.en || 'Başvuru';
}

function adminNotificationEmails(): string[] {
  return (
    process.env.NOTIFICATION_EMAILS ||
    process.env.ADMIN_EMAILS ||
    'info@myunilab.net'
  )
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

export async function sendApplicationReceivedEmails(params: {
  applicantEmail: string;
  applicantName: string;
  contextType: ApplicationContextType;
  contextTitle: LocalizedText | string | null;
  applicationId: string;
  submissionData: Record<string, unknown>;
  cvFileName?: string | null;
}) {
  const title = resolveTitle(params.contextTitle);
  const typeLabel = CONTEXT_TYPE_LABELS[params.contextType].tr;
  const date = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  const errors: string[] = [];

  try {
    await sendEmail({
      to: params.applicantEmail,
      subject: `Başvurunuz alındı — ${title}`,
      html: baseHtml(`
        <h2 style="color:#990000">Başvurunuz Alındı</h2>
        <p>Sayın ${params.applicantName},</p>
        <p><strong>${title}</strong> (${typeLabel}) başvurunuz kaydedildi.</p>
        <p><strong>Başvuru No:</strong> ${params.applicationId}</p>
        <p><strong>Tarih:</strong> ${date}</p>
        <p>Değerlendirme sürecinde size e-posta ile bilgi verilecektir.</p>
      `),
      text: `Başvurunuz alındı: ${title} — No: ${params.applicationId}`,
    });
  } catch (e) {
    errors.push(`Aday: ${e instanceof Error ? e.message : 'hata'}`);
  }

  const dataRows = Object.entries(params.submissionData)
    .filter(([, v]) => v != null && v !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 8px;border:1px solid #eee"><strong>${k}</strong></td><td style="padding:4px 8px;border:1px solid #eee">${String(v)}</td></tr>`
    )
    .join('');

  for (const adminEmail of adminNotificationEmails()) {
    try {
      await sendEmail({
        to: adminEmail,
        subject: `Yeni başvuru [${typeLabel}] — ${params.applicantName} — ${title}`,
        html: baseHtml(`
          <h2 style="color:#990000">Yeni Başvuru</h2>
          <p><strong>Tür:</strong> ${typeLabel}</p>
          <p><strong>Kaynak:</strong> ${title}</p>
          <p><strong>Aday:</strong> ${params.applicantName} (${params.applicantEmail})</p>
          ${params.cvFileName ? `<p><strong>CV:</strong> ${params.cvFileName}</p>` : ''}
          <p><strong>Başvuru No:</strong> ${params.applicationId}</p>
          <p><strong>Admin:</strong> Panel → Başvurular</p>
          ${dataRows ? `<table style="border-collapse:collapse;width:100%;margin-top:12px">${dataRows}</table>` : ''}
        `),
        text: `Yeni başvuru: ${typeLabel} — ${params.applicantName}`,
      });
    } catch (e) {
      errors.push(`Admin (${adminEmail}): ${e instanceof Error ? e.message : 'hata'}`);
    }
  }

  return { emailSent: errors.length === 0, emailErrors: errors };
}

export async function sendApplicationStatusChangeEmail(params: {
  applicantEmail: string;
  applicantName: string;
  contextTitle: LocalizedText | string | null;
  newStatus: ApplicationStatus;
  adminNote?: string | null;
}) {
  const title = resolveTitle(params.contextTitle);
  const statusLabel = APPLICATION_STATUS_LABELS[params.newStatus]?.tr || params.newStatus;
  const statusColor =
    params.newStatus === 'accepted'
      ? '#16a34a'
      : params.newStatus === 'rejected'
        ? '#dc2626'
        : '#990000';

  await sendEmail({
    to: params.applicantEmail,
    subject: `Başvuru durumu güncellendi — ${title}`,
    html: baseHtml(`
      <h2 style="color:${statusColor}">Başvuru Durumu Güncellendi</h2>
      <p>Sayın ${params.applicantName},</p>
      <p><strong>${title}</strong> başvurunuzun durumu güncellendi.</p>
      <p style="font-size:18px"><strong>Yeni durum:</strong> <span style="color:${statusColor}">${statusLabel}</span></p>
      ${params.adminNote ? `<p><strong>Not:</strong> ${params.adminNote}</p>` : ''}
    `),
    text: `Başvuru durumu: ${statusLabel} — ${title}`,
  });
}
