import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/utils/supabase";
import type {
  CmsCertificate,
  CmsProfile,
  CmsProject,
  CmsSkill,
  CmsSocialLink,
  CmsSystemSettings,
} from "@/types/cms";

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((value): value is string => typeof value === "string");
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value).trim();
  return normalized === "" ? null : normalized;
}

function isSchemaMismatchError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  const message = (error.message || "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("column") && message.includes("does not exist")) ||
    message.includes("could not find")
  );
}

export function usePortfolioData() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [profile, setProfile] = useState<CmsProfile | null>(null);
  const [skills, setSkills] = useState<CmsSkill[]>([]);
  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [certificates, setCertificates] = useState<CmsCertificate[]>([]);
  const [socialLinks, setSocialLinks] = useState<CmsSocialLink[]>([]);
  const [settings, setSettings] = useState<CmsSystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolioData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      let profileResult = await supabase
        .from("profile_info")
        .select("id,user_id,full_name,title,status,experience_level,age,updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<CmsProfile>();

      if (isSchemaMismatchError(profileResult.error)) {
        const legacyProfileResult = await supabase
          .from("profile_info")
          .select("id,age,updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ id: string; age: number | null; updated_at?: string }>();

        profileResult = {
          data: legacyProfileResult.data
            ? ({
                id: legacyProfileResult.data.id,
                user_id: undefined,
                full_name: null,
                title: null,
                status: null,
                experience_level: null,
                age: legacyProfileResult.data.age,
              } as CmsProfile)
            : null,
          error: legacyProfileResult.error,
          count: null,
          status: legacyProfileResult.status,
          statusText: legacyProfileResult.statusText,
        };
      }

      let projectsResult = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (isSchemaMismatchError(projectsResult.error)) {
        const legacyProjectsResult = await supabase
          .from("projects")
          .select("id,title,description,project_url,repo_url,created_at")
          .order("created_at", { ascending: false });

        projectsResult = {
          data: (legacyProjectsResult.data ?? []).map((project) => ({
            ...(project as CmsProject),
            featured: false,
            tags: [],
            thumbnail_url: null,
            status: null,
          })),
          error: legacyProjectsResult.error,
          count: null,
          status: legacyProjectsResult.status,
          statusText: legacyProjectsResult.statusText,
        };
      }

      let certificatesResult = await supabase
        .from("certificates")
        .select("id,title,organization,issued_at,sort_order,link,local_path,is_public,is_specialization,created_at")
        .eq("is_public", true)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("issued_at", { ascending: false });

      if (isSchemaMismatchError(certificatesResult.error)) {
        const legacyCertificatesResult = await supabase
          .from("certificates")
          .select("id,title,organization,issued_at,link,is_public,created_at")
          .eq("is_public", true)
          .order("issued_at", { ascending: false });

        certificatesResult = {
          data: (legacyCertificatesResult.data ?? []).map((certificate) => ({
            ...(certificate as CmsCertificate),
            sort_order: null,
            local_path: null,
            is_specialization: false,
            specialization_course_ids: [],
            specialization_courses: [],
          })),
          error: legacyCertificatesResult.error,
          count: null,
          status: legacyCertificatesResult.status,
          statusText: legacyCertificatesResult.statusText,
        };
      }

      const [skillsResult, socialLinksResult, settingsResult] = await Promise.all([
        supabase
          .from("skills")
          .select("id,name,icon,category,proficiency,display_order,created_at")
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("social_links")
          .select("id,platform,url,icon,is_visible,display_order,created_at")
          .eq("is_visible", true)
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("system_settings")
          .select("id,maintenance_mode,updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle<CmsSystemSettings>(),
      ]);

      const allErrors = [
        profileResult.error,
        skillsResult.error,
        projectsResult.error,
        certificatesResult.error,
        socialLinksResult.error,
        settingsResult.error,
      ].filter(Boolean) as Array<{ message?: string }>;

      if (allErrors.length > 0) {
        setError(allErrors[0].message || "Some content is unavailable.");
      }

      const projectRows = (projectsResult.error ? [] : (projectsResult.data ?? [])).map((project) => ({
        id: normalizeText((project as { id?: unknown })?.id),
        title: normalizeText((project as { title?: unknown })?.title),
        description: normalizeText((project as { description?: unknown })?.description),
        tags: normalizeTags((project as { tags?: unknown })?.tags),
        project_url: normalizeNullableText(
          (project as { project_url?: unknown })?.project_url ??
            (project as { live_url?: unknown })?.live_url,
        ),
        repo_url: normalizeNullableText(
          (project as { repo_url?: unknown })?.repo_url ??
            (project as { github_url?: unknown })?.github_url,
        ),
        thumbnail_url: normalizeNullableText(
          (project as { thumbnail_url?: unknown })?.thumbnail_url ??
            (project as { image_url?: unknown })?.image_url,
        ),
        status:
          ((): CmsProject["status"] => {
            const rawStatus = String((project as { status?: unknown })?.status ?? "").toLowerCase();
            if (rawStatus === "completed" || rawStatus === "live") {
              return "completed";
            }
            if (rawStatus === "in_progress") {
              return "in_progress";
            }
            if (rawStatus === "soon") {
              return "soon";
            }
            return null;
          })(),
        featured: Boolean((project as { featured?: unknown })?.featured ?? false),
        priority: (() => {
          const raw = (project as { priority?: unknown })?.priority;
          const num = typeof raw === "number" ? raw : Number(raw);
          return Number.isFinite(num) ? num : null;
        })(),
        created_at:
          ((project as { created_at?: unknown })?.created_at as string | undefined) ??
          undefined,
      }));

      const certificateRows = (certificatesResult.error ? [] : (certificatesResult.data ?? [])).map(
        (certificate) =>
          ({
            ...(certificate as CmsCertificate),
            sort_order: (certificate as CmsCertificate).sort_order ?? null,
            specialization_course_ids: [],
            specialization_courses: [],
          }) as CmsCertificate,
      );

      const specializationIds = certificateRows.filter((certificate) => certificate.is_specialization).map((certificate) => certificate.id);
      if (specializationIds.length > 0) {
        const linksResult = await supabase
          .from("certificate_specialization_courses")
          .select("specialization_id,course_certificate_id")
          .in("specialization_id", specializationIds);

        if (!linksResult.error) {
          const links = linksResult.data ?? [];
          const linkedCourseIds = Array.from(new Set(links.map((row) => row.course_certificate_id)));
          let titleLookup = new Map<string, string>();

          if (linkedCourseIds.length > 0) {
            const linkedCertificatesResult = await supabase
              .from("certificates")
              .select("id,title")
              .in("id", linkedCourseIds)
              .eq("is_public", true);

            if (!linkedCertificatesResult.error) {
              titleLookup = new Map(
                (linkedCertificatesResult.data ?? []).map((row) => [row.id as string, row.title as string]),
              );
            }
          }

          const specializationLookup = new Map<string, string[]>();
          for (const row of links) {
            const specializationId = row.specialization_id as string;
            const courseId = row.course_certificate_id as string;
            const existing = specializationLookup.get(specializationId) ?? [];
            specializationLookup.set(specializationId, [...existing, courseId]);
          }

          for (const certificate of certificateRows) {
            const courseIds = specializationLookup.get(certificate.id) ?? [];
            certificate.specialization_course_ids = courseIds;
            certificate.specialization_courses = courseIds
              .map((courseId) => ({
                id: courseId,
                title: titleLookup.get(courseId) ?? "",
              }))
              .filter((course) => Boolean(course.title));
          }
        }
      }

      setProfile(profileResult.error ? null : (profileResult.data ?? null));
      setSkills(skillsResult.error ? [] : ((skillsResult.data ?? []) as CmsSkill[]));
      setProjects(
        [...projectRows].sort((a, b) => {
          const statusRank = (status: CmsProject["status"]) => (status === "completed" ? 0 : 1);
          const rankDiff = statusRank(a.status) - statusRank(b.status);
          if (rankDiff !== 0) return rankDiff;
          const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER;
          const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER;
          if (aPriority !== bPriority) return aPriority - bPriority;
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bCreated - aCreated;
        }),
      );
      setCertificates(
        [...certificateRows].sort((a, b) => {
          const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
          const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime();
        }),
      );
      setSocialLinks(socialLinksResult.error ? [] : ((socialLinksResult.data ?? []) as CmsSocialLink[]));
      setSettings(settingsResult.error ? null : (settingsResult.data ?? null));
    } catch (runtimeError) {
      const message = runtimeError instanceof Error ? runtimeError.message : "Failed to load data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadPortfolioData();

    const channel = supabase
      .channel("portfolio-public-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "profile_info" }, loadPortfolioData)
      .on("postgres_changes", { event: "*", schema: "public", table: "skills" }, loadPortfolioData)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, loadPortfolioData)
      .on("postgres_changes", { event: "*", schema: "public", table: "certificates" }, loadPortfolioData)
      .on("postgres_changes", { event: "*", schema: "public", table: "certificate_specialization_courses" }, loadPortfolioData)
      .on("postgres_changes", { event: "*", schema: "public", table: "social_links" }, loadPortfolioData)
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, loadPortfolioData)
      .subscribe();

    const handleRefresh = () => {
      loadPortfolioData();
    };

    window.addEventListener("kac8-data-updated", handleRefresh);

    return () => {
      window.removeEventListener("kac8-data-updated", handleRefresh);
      supabase.removeChannel(channel);
    };
  }, [loadPortfolioData, supabase]);

  return {
    profile,
    skills,
    projects,
    certificates,
    socialLinks,
    settings,
    loading,
    error,
    refresh: loadPortfolioData,
  };
}
