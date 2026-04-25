import Link from "next/link";
import { createClient } from "../../utils/supabase/server";

type Certificate = {
  id: string;
  title: string;
  organization: string;
  issued_at: string;
  link: string | null;
  is_public: boolean;
};

const fallbackCertificates: Certificate[] = [
  {
    id: "fallback-1",
    title: "Full-Stack Architecture Mastery",
    organization: "Frontend Masters",
    issued_at: "2026-01-12",
    link: "https://example.com/certificates/fullstack-architecture",
    is_public: true,
  },
  {
    id: "fallback-2",
    title: "Production Supabase Engineering",
    organization: "Supabase",
    issued_at: "2025-11-02",
    link: "https://example.com/certificates/supabase-production",
    is_public: true,
  },
  {
    id: "fallback-3",
    title: "Advanced React Systems",
    organization: "Epic React",
    issued_at: "2025-08-26",
    link: null,
    is_public: true,
  },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("id,title,organization,issued_at,link,is_public")
    .eq("is_public", true)
    .order("issued_at", { ascending: false });

  const certificates =
    !error && data && data.length > 0
      ? (data as Certificate[])
      : fallbackCertificates;

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-[#d8ffd0]">
      <section className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 inline-block rounded-full border border-[#2e6417] px-3 py-1 text-xs tracking-[0.22em] text-[#7fff5a]">
            COURSES & CERTIFICATES
          </p>
          <h1 className="text-3xl font-semibold text-[#eaffdf] md:text-4xl">
            Learning Credentials
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#9bc294] md:text-base">
            Verified certifications from practical training in frontend, backend,
            cloud, and security engineering.
          </p>
          {error && (
            <p className="mt-3 text-sm text-[#8dff6c]">
              Supabase data is currently unavailable. Showing fallback content.
            </p>
          )}
        </header>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <article
              key={certificate.id}
              className="rounded-2xl border border-[#2e6417] bg-[#0d0d0d] p-5 transition hover:border-[#7fff5a] hover:shadow-[0_0_28px_rgba(46,100,23,0.35)]"
            >
              <h2 className="text-lg font-semibold text-[#ecffe7]">
                {certificate.title}
              </h2>
              <p className="mt-2 text-sm text-[#b8e8af]">{certificate.organization}</p>
              <p className="mt-1 text-sm text-[#8dbc83]">
                Issued: {formatDate(certificate.issued_at)}
              </p>

              <div className="mt-5">
                {certificate.link ? (
                  <Link
                    href={certificate.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-md border border-[#2e6417] bg-[#111811] px-3 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#8dff6c] hover:text-[#eaffdf]"
                  >
                    View Certificate
                  </Link>
                ) : (
                  <span className="text-sm text-[#7ca075]">No public link</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
