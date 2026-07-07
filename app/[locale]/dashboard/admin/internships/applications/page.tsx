import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LegacyApplicationsRedirect({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/admin/applications?context_type=opportunity`);
}
