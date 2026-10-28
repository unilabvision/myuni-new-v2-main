interface PackagePresentationInput {
  title?: string | null;
  slug?: string | null;
  price?: number | null;
}

export function getPackageDisplayPrice({
  title,
  slug,
  price,
}: PackagePresentationInput): number {
  const identity = `${title || ''} ${slug || ''}`.toLocaleLowerCase('tr-TR');

  const hasNgs = identity.includes('ngs');
  const hasBothNgsCourses =
    hasNgs &&
    ((/(^|\D)1(\D|$)/.test(identity) && /(^|\D)2(\D|$)/.test(identity)) ||
      identity.includes('1ve2') ||
      identity.includes('1-2'));

  if (hasBothNgsCourses) return 5000;
  if (hasNgs && /(^|\D)2(\D|$)/.test(identity)) return 2500;
  if (hasNgs && /(^|\D)3(\D|$)/.test(identity)) return 5000;

  return Number(price) || 0;
}
