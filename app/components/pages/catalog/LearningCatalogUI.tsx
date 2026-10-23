import type { ReactNode } from 'react';
import { ArrowDown, Search } from 'lucide-react';

interface CatalogHeroProps {
  badge: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  asideTitle: string;
  asideDescription: string;
  count: number;
  countLabel: string;
}

interface CatalogSectionHeaderProps {
  title: string;
  description: string;
  count: number;
  resultLabel: string;
}

interface CatalogEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const catalogCardClass =
  'group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors duration-200 hover:border-[#990000]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] focus-visible:ring-offset-4 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-[#c6535f]';

export const catalogFilterClass =
  'rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] focus-visible:ring-offset-2';

export function CatalogHero({
  badge,
  title,
  description,
  actionLabel,
  onAction,
  asideTitle,
  asideDescription,
  count,
  countLabel,
}: CatalogHeroProps) {
  return (
    <section className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:items-end lg:px-8 lg:py-24">
        <div className="max-w-4xl">
          <div className="mb-7 flex items-center gap-3 text-sm font-medium text-[#990000] dark:text-[#e08b94]">
            <span className="h-px w-9 bg-current" aria-hidden="true" />
            <span>{badge}</span>
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-neutral-950 sm:text-5xl lg:text-6xl dark:text-white">
            {title}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">
            {description}
          </p>
          <button
            type="button"
            onClick={onAction}
            className="mt-9 inline-flex min-h-12 items-center gap-3 rounded-md bg-[#990000] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#780000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] focus-visible:ring-offset-4 dark:bg-[#b41f2f] dark:hover:bg-[#c92b3c]"
          >
            {actionLabel}
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <aside className="border-l-2 border-[#990000] pl-6 lg:mb-1">
          <p className="text-sm font-semibold text-neutral-950 dark:text-white">
            {asideTitle}
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {asideDescription}
          </p>
          <div className="mt-8 flex items-end gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
            <span className="text-4xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white">
              {count}
            </span>
            <span className="pb-1 text-sm text-neutral-500 dark:text-neutral-400">
              {countLabel}
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function CatalogSectionHeader({
  title,
  description,
  count,
  resultLabel,
}: CatalogSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200 pb-7 sm:flex-row sm:items-end sm:justify-between dark:border-neutral-800">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-950 sm:text-3xl dark:text-white">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      </div>
      <p className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
        <span className="font-semibold text-neutral-950 dark:text-white">{count}</span>{' '}
        {resultLabel}
      </p>
    </div>
  );
}

export function CatalogSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-md border border-neutral-300 bg-white pl-11 pr-4 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#990000] focus:ring-1 focus:ring-[#990000] dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      />
    </label>
  );
}

export function CatalogEmptyState({
  icon,
  title,
  description,
  action,
}: CatalogEmptyStateProps) {
  return (
    <div className="border-y border-neutral-200 py-16 text-center dark:border-neutral-800">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-neutral-950 dark:text-white">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function CatalogLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl animate-pulse px-6 py-20 lg:px-8">
          <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-8 h-14 max-w-3xl rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-5 h-6 max-w-xl rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-14 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900"
          />
        ))}
      </div>
    </div>
  );
}
