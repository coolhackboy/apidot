import { Link } from "@/i18n/routing";
import { appConfig } from "@/data/config";
import { Button } from "@/components/ui/button";
import type { ApiExampleLanguage } from "@/lib/apiExamples";
import { cn } from "@/lib/utils";
import DocsCodeBlock from "@/components/docs/DocsCodeBlock";
import { getDocsEntries, getDocsEntry, getDocsNeighbors, getDocsSupportEntries } from "@/lib/docs";
import { Search, Zap, ChevronDown, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import type { LandingPage } from "@/types/pages/landing";

type DocsPageProps = {
  locale: string;
  page: LandingPage;
  activeDocId?: string;
  initialLang?: ApiExampleLanguage;
};

type EndpointField = NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string]["request"][number];
type EndpointDoc = NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string];
const docsMethodChipClassName =
  "mk-chip mk-chip-accent !border-transparent px-2 py-0.5 text-[10px]";
const docsErrorCodeChipClassName =
  "inline-flex h-7 min-w-10 items-center justify-center rounded-full border-none bg-red-500/10 px-2.5 text-[11px] font-bold text-red-600";

function ParamTable({
  rows,
  showRequired = true,
  labels,
}: {
  rows: EndpointField[];
  showRequired?: boolean;
  labels: {
    field: string;
    type: string;
    required: string;
    description: string;
  };
}) {
  return (
    <div className="mk-surface overflow-hidden">
      <table className="mk-table min-w-full">
        <thead>
          <tr>
            <th>{labels.field}</th>
            <th>{labels.type}</th>
            {showRequired ? <th>{labels.required}</th> : null}
            <th>{labels.description}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="align-top">
              <td className="mk-mono text-xs">
                {row.name}
                {row.defaultValue ? (
                  <div className="mt-1 text-[11px] text-muted-foreground">default: {row.defaultValue}</div>
                ) : null}
              </td>
              <td className="text-muted-foreground">{row.type}</td>
              {showRequired ? (
                <td>
                  {row.required ? (
                    <span className="mk-chip mk-chip-accent">required</span>
                  ) : (
                    <span className="text-muted-foreground">optional</span>
                  )}
                </td>
              ) : null}
              <td className="text-muted-foreground">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocsSidebar({
  docsPage,
  activeDocId,
}: {
  docsPage: NonNullable<LandingPage["docsPage"]>;
  activeDocId?: string;
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="mk-card p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            readOnly
            value=""
            placeholder={docsPage.searchPlaceholder}
            className="mk-input pl-10 pr-3 text-sm"
          />
        </div>

        <div className="space-y-6">
          {docsPage.navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeDocId === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={`/docs/${item.id}`}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-secondary/80 text-foreground"
                          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                      )}
                    >
                      {item.method ? <span className={docsMethodChipClassName}>{item.method}</span> : null}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function DocsIndex({
  page,
}: {
  page: LandingPage;
}) {
  const docsPage = page.docsPage!;
  const entries = getDocsEntries(docsPage);

  return (
    <main className="min-w-0">
      <div className="max-w-5xl space-y-8">
        <section className="space-y-4">
          <div className="mk-eyebrow">{appConfig.appNameInHeader}</div>
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-foreground">{docsPage.title}</h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{page.meta.description}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => {
            const excerpt = entry.kind === "endpoint" ? entry.endpoint?.summary : entry.article?.lede;

            return (
              <Link
                key={entry.id}
                href={`/docs/${entry.id}`}
                className="mk-card group flex h-full flex-col gap-4 p-6 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {entry.method ? <span className={docsMethodChipClassName}>{entry.method}</span> : null}
                  <span>{entry.groupLabel}</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">{entry.label}</h2>
                  <p className="text-sm leading-7 text-muted-foreground">{excerpt}</p>
                </div>
                <div className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <span>{entry.label}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function DocsArticle({
  article,
  docsTitle,
}: {
  article: NonNullable<LandingPage["docsPage"]>["articles"][string];
  docsTitle: string;
}) {
  return (
    <article className="max-w-4xl space-y-8">
      <div className="space-y-3">
        <div className="mk-eyebrow">
          {appConfig.appNameInHeader} {docsTitle}
        </div>
        <h1 className="text-4xl font-bold tracking-[-0.03em] text-foreground">{article.title}</h1>
        <p className="text-lg text-muted-foreground leading-8">{article.lede}</p>
      </div>

      {article.sections.map((section) => (
        <section key={section.title} className="mk-card space-y-3 p-6">
          <h2 className="text-2xl font-semibold">{section.title}</h2>
          <p className="text-muted-foreground leading-8">{section.body}</p>
          {section.code ? (
            <pre className="mk-code-shell mk-code-block rounded-2xl">{section.code}</pre>
          ) : null}
        </section>
      ))}
    </article>
  );
}

function EndpointArticle({
  docId,
  endpoint,
  labels,
  initialLang,
}: {
  docId: string;
  endpoint: EndpointDoc;
  labels: NonNullable<LandingPage["docsPage"]>;
  initialLang?: ApiExampleLanguage;
}) {
  const supportDocs = getDocsSupportEntries(labels);

  return (
    <article className="max-w-4xl space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={cn(docsMethodChipClassName, "mk-mono text-[11px]")}>{endpoint.method}</span>
          <code className="text-sm text-muted-foreground">{endpoint.path}</code>
        </div>
        <h1 className="text-4xl font-bold tracking-[-0.03em] text-foreground">{endpoint.label} API</h1>
        <p className="text-lg text-muted-foreground leading-8">{endpoint.summary}</p>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-full border border-[#111116] bg-[#111116] text-white shadow-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:border-[#1f1f27] hover:bg-[#1f1f27] hover:text-white hover:shadow-[0_12px_28px_rgba(15,15,13,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(47,155,95,0.45)] focus-visible:ring-offset-2"
          >
            <Link href={`/models/${docId}`}>
              <Zap className="mr-2 h-4 w-4" />
              {labels.tryPlayground}
            </Link>
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{labels.exampleRequest}</h2>
        <DocsCodeBlock
          endpoint={endpoint}
          sampleResponse={endpoint.sampleResponse}
          responseLabel={labels.responseLabel}
          initialLang={initialLang}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{labels.requestBody}</h2>
        <ParamTable
          rows={endpoint.request}
          labels={{
            field: labels.field,
            type: labels.type,
            required: labels.required,
            description: labels.description,
          }}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{labels.response}</h2>
        <ParamTable
          rows={endpoint.response}
          showRequired={false}
          labels={{
            field: labels.field,
            type: labels.type,
            required: labels.required,
            description: labels.description,
          }}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{labels.errors}</h2>
        <div className="mk-surface overflow-hidden">
          <table className="mk-table min-w-full">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>{labels.description}</th>
              </tr>
            </thead>
            <tbody>
              {endpoint.errors.map((error) => (
                <tr key={error.name}>
                  <td className="mk-mono text-xs">
                    <span className={docsErrorCodeChipClassName}>{error.code}</span>
                  </td>
                  <td className="mk-mono text-xs">{error.name}</td>
                  <td className="text-muted-foreground">{error.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mk-card space-y-4 p-6">
        <h2 className="text-2xl font-semibold">{labels.aboutApi}</h2>
        <p className="text-muted-foreground leading-8">{endpoint.about}</p>
      </section>

      <section className="mk-card space-y-4 p-6">
        <h2 className="text-2xl font-semibold">{labels.bestPractices}</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          {endpoint.bestPractices.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mk-card space-y-4 p-6">
        <h2 className="text-2xl font-semibold">{labels.faq}</h2>
        <div className="space-y-3">
          {endpoint.faq.map((item) => (
            <details key={item.question} className="rounded-2xl border border-border px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                <span>{item.question}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mk-card space-y-4 p-6">
        <h2 className="text-2xl font-semibold">{labels.relatedDocs}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {supportDocs.map((entry) => (
            <Link
              key={entry.id}
              href={`/docs/${entry.id}`}
              className="rounded-2xl border border-border px-4 py-4 transition-colors hover:bg-secondary/60"
            >
              <div className="text-sm font-medium text-foreground">{entry.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {entry.article?.lede || entry.endpoint?.summary}
              </div>
            </Link>
          ))}
          <Link
            href="/models"
            className="rounded-2xl border border-border px-4 py-4 transition-colors hover:bg-secondary/60"
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <span>{labels.browseModelsLabel}</span>
              <ExternalLink className="h-4 w-4" />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{labels.browseModelsDescription}</div>
          </Link>
          <Link
            href="/pricing"
            className="rounded-2xl border border-border px-4 py-4 transition-colors hover:bg-secondary/60"
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <span>{labels.pricingLabel}</span>
              <ExternalLink className="h-4 w-4" />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{labels.pricingDescription}</div>
          </Link>
        </div>
      </section>
    </article>
  );
}

function DocsDetail({
  page,
  activeDocId,
  initialLang,
}: {
  page: LandingPage;
  activeDocId: string;
  initialLang?: ApiExampleLanguage;
}) {
  const docsPage = page.docsPage!;
  const entry = getDocsEntry(docsPage, activeDocId);

  if (!entry) {
    return null;
  }

  const { previous, next } = getDocsNeighbors(docsPage, activeDocId);

  return (
    <main className="min-w-0">
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs" className="transition-colors hover:text-foreground">
            {docsPage.title}
          </Link>
          <ArrowRight className="h-4 w-4" />
          <span className="text-foreground">{entry.label}</span>
        </div>

        {entry.kind === "endpoint" && entry.endpoint ? (
          <EndpointArticle docId={entry.id} endpoint={entry.endpoint} labels={docsPage} initialLang={initialLang} />
        ) : entry.article ? (
          <DocsArticle article={entry.article} docsTitle={docsPage.title} />
        ) : null}

        {previous || next ? (
          <section className="grid gap-4 md:grid-cols-2">
            {previous ? (
              <Link
                href={`/docs/${previous.id}`}
                className="mk-card flex h-full flex-col gap-2 p-5 transition-colors hover:bg-secondary/60"
              >
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{docsPage.previousDoc}</span>
                </div>
                <div className="text-lg font-semibold text-foreground">{previous.label}</div>
                <p className="text-sm text-muted-foreground">
                  {previous.article?.lede || previous.endpoint?.summary}
                </p>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/docs/${next.id}`}
                className="mk-card flex h-full flex-col gap-2 p-5 text-right transition-colors hover:bg-secondary/60"
              >
                <div className="inline-flex items-center justify-end gap-2 text-sm text-muted-foreground">
                  <span>{docsPage.nextDoc}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="text-lg font-semibold text-foreground">{next.label}</div>
                <p className="text-sm text-muted-foreground">{next.article?.lede || next.endpoint?.summary}</p>
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function DocsPage({ page, activeDocId, initialLang }: DocsPageProps) {
  const docsPage = page.docsPage;

  if (!docsPage) {
    return null;
  }

  return (
    <div className="mk-container py-8 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <DocsSidebar docsPage={docsPage} activeDocId={activeDocId} />
        {activeDocId ? (
          <DocsDetail page={page} activeDocId={activeDocId} initialLang={initialLang} />
        ) : (
          <DocsIndex page={page} />
        )}
      </div>
    </div>
  );
}
