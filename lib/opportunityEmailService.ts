import { sendEmail } from '@/lib/email';
import { localizeText } from '@/lib/opportunityService';
import type { LocalizedText, OpportunityApplicationStatus } from '@/lib/types/opportunity';

const STATUS_LABELS: Record<OpportunityApplicationStatus, string> = {
  pending: 'Beklemede',
  under_review: 'Değerlendiriliyor',
  accepted: 'Kabul edildi',
  rejected: 'Reddedildi',
};

function baseHtml(content: string) {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">${content}<p style="margin-top:24px;font-size:12px;color:#888">MyUNI Staj Platformu</p></body></html>`;
}

export async function sendOpportunityApplicationEmails(params: {
  applicantEmail: string;
  applicantName: string;
  opportunityTitle: LocalizedText | string;
  applicationId: string;
  submissionData: Record<string, unknown>;
  cvFileName?: string | null;
}) {
  const title =
    typeof params.opportunityTitle === 'string'
      ? params.opportunityTitle
      : localizeText(params.opportunityTitle, 'tr');
  const date = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  const errors: string[] = [];

  try {
    await sendEmail({
      to: params.applicantEmail,
      subject: `Staj başvurunuz alındı — ${title}`,
      html: baseHtml(`
        <h2 style="color:#990000">Başvurunuz Alındı</h2>
        <p>Sayın ${params.applicantName},</p>
        <p><strong>${title}</strong> ilanına yaptığınız başvuru başarıyla kaydedildi.</p>
        <p><strong>Başvuru No:</strong> ${params.applicationId}</p>
        <p><strong>Tarih:</strong> ${date}</p>
        <p>Değerlendirme sürecinde size e-posta ile bilgi verilecektir.</p>
      `),
      text: `Başvurunuz alındı: ${title} — No: ${params.applicationId}`,
    });
  } catch (e) {
    errors.push(`Aday e-postası: ${e instanceof Error ? e.message : 'hata'}`);
  }

  const notificationEmails = (
    process.env.NOTIFICATION_EMAILS || process.env.ADMIN_EMAILS || 'info@myunilab.net'
  )
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const dataRows = Object.entries(params.submissionData)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `<tr><td style="padding:4px 8px;border:1px solid #eee"><strong>${k}</strong></td><td style="padding:4px 8px;border:1px solid #eee">${String(v)}</td></tr>`)
    .join('');

  for (const adminEmail of notificationEmails) {
    try {
      await sendEmail({
        to: adminEmail,
        subject: `Yeni staj başvurusu — ${params.applicantName} — ${title}`,
        html: baseHtml(`
          <h2 style="color:#990000">Yeni Staj Başvurusu</h2>
          <p><strong>İlan:</strong> ${title}</p>
          <p><strong>Aday:</strong> ${params.applicantName} (${params.applicantEmail})</p>
          ${params.cvFileName ? `<p><strong>CV:</strong> ${params.cvFileName}</p>` : ''}
          <p><strong>Başvuru No:</strong> ${params.applicationId}</p>
          ${dataRows ? `<table style="border-collapse:collapse;width:100%;margin-top:12px">${dataRows}</table>` : ''}
        `),
        text: `Yeni başvuru: ${params.applicantName} — ${title}`,
      });
    } catch (e) {
      errors.push(`Admin (${adminEmail}): ${e instanceof Error ? e.message : 'hata'}`);
    }
  }

  return { emailSent: errors.length === 0, emailErrors: errors };
}

export async function sendOpportunityStatusChangeEmail(params: {
  applicantEmail: string;
  applicantName: string;
  opportunityTitle: LocalizedText | string;
  newStatus: OpportunityApplicationStatus;
  adminNote?: string | null;
}) {
  const title =
    typeof params.opportunityTitle === 'string'
      ? params.opportunityTitle
      : localizeText(params.opportunityTitle, 'tr');
  const statusLabel = STATUS_LABELS[params.newStatus] || params.newStatus;

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
      <p><strong>${title}</strong> ilanına yaptığınız başvurunun durumu güncellendi.</p>
      <p style="font-size:18px"><strong>Yeni durum:</strong> <span style="color:${statusColor}">${statusLabel}</span></p>
      ${params.adminNote ? `<p><strong>Not:</strong> ${params.adminNote}</p>` : ''}
    `),
    text: `Başvuru durumu: ${statusLabel} — ${title}`,
  });
}
