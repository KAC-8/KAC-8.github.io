import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  BriefcaseBusiness,
  CircleGauge,
  Link2,
  ListChecks,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";
import { getSupabaseClient } from "@/utils/supabase";
import { createSecurityLog } from "@/utils/securityLogs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import type {
  CmsCertificate,
  CmsProfile,
  CmsProject,
  CmsSecurityLog,
  CmsSkill,
  CmsSocialLink,
  CmsSystemSettings,
} from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type ProfileInput = {
  full_name: string;
  title: string;
  status_ar: string;
  status_en: string;
  experience_level: string;
  age: string;
};

type SkillInput = {
  name: string;
  icon: string;
  category: string;
  proficiency: string;
};

type ProjectInput = {
  title: string;
  description: string;
  tags: string;
  project_url: string;
  repo_url: string;
  thumbnail_url: string;
  status: "completed" | "in_progress" | "soon";
  featured: boolean;
  priority: string;
};

type CertificateInput = {
  title: string;
  organization: string;
  issued_at: string;
  sort_order: string;
  link: string;
  local_path: string;
  is_public: boolean;
  is_specialization: boolean;
  specialization_course_ids: string[];
};

type SocialInput = {
  platform: string;
  url: string;
  icon: string;
  is_visible: boolean;
};

const blankProfile: ProfileInput = {
  full_name: "",
  title: "",
  status_ar: "",
  status_en: "",
  experience_level: "junior",
  age: "",
};

const blankSkill: SkillInput = {
  name: "",
  icon: "",
  category: "",
  proficiency: "50",
};

const blankProject: ProjectInput = {
  title: "",
  description: "",
  tags: "",
  project_url: "",
  repo_url: "",
  thumbnail_url: "",
  status: "in_progress",
  featured: false,
  priority: "0",
};

const blankCertificate: CertificateInput = {
  title: "",
  organization: "",
  issued_at: "",
  sort_order: "100",
  link: "",
  local_path: "",
  is_public: true,
  is_specialization: false,
  specialization_course_ids: [],
};

const blankSocial: SocialInput = {
  platform: "",
  url: "",
  icon: "",
  is_visible: true,
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseBilingualStatus(value: string | null | undefined) {
  if (!value) {
    return { ar: "", en: "" };
  }

  if (value.includes("|||")) {
    const [ar = "", en = ""] = value.split("|||");
    return { ar: ar.trim(), en: en.trim() };
  }

  return { ar: value, en: value };
}

function composeBilingualStatus(ar: string, en: string) {
  const normalizedAr = ar.trim();
  const normalizedEn = en.trim();

  if (!normalizedAr && !normalizedEn) {
    return null;
  }

  if (!normalizedAr || !normalizedEn || normalizedAr === normalizedEn) {
    return normalizedAr || normalizedEn;
  }

  return `${normalizedAr}|||${normalizedEn}`;
}

function toDateInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

function normalizeTags(tags: unknown) {
  if (Array.isArray(tags)) {
    return tags.filter((value): value is string => typeof value === "string").join(", ");
  }
  return "";
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

function broadcastDataUpdate() {
  window.dispatchEvent(new Event("kac8-data-updated"));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState("profile");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileInput>(blankProfile);

  const [skills, setSkills] = useState<CmsSkill[]>([]);
  const [skillDraft, setSkillDraft] = useState<SkillInput>(blankSkill);
  const [skillEdits, setSkillEdits] = useState<Record<string, SkillInput>>({});

  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [projectDraft, setProjectDraft] = useState<ProjectInput>(blankProject);
  const [projectEdits, setProjectEdits] = useState<Record<string, ProjectInput>>({});

  const [certificates, setCertificates] = useState<CmsCertificate[]>([]);
  const [certificateDraft, setCertificateDraft] = useState<CertificateInput>(blankCertificate);
  const [certificateEdits, setCertificateEdits] = useState<Record<string, CertificateInput>>({});
  const [certificateCourseOptions, setCertificateCourseOptions] = useState<
    Array<{ id: string; title: string; is_specialization: boolean }>
  >([]);
  const [newSpecializationCourseId, setNewSpecializationCourseId] = useState("");
  const [editSpecializationPicker, setEditSpecializationPicker] = useState<Record<string, string>>({});

  const [socialLinks, setSocialLinks] = useState<CmsSocialLink[]>([]);
  const [socialDraft, setSocialDraft] = useState<SocialInput>(blankSocial);
  const [socialEdits, setSocialEdits] = useState<Record<string, SocialInput>>({});

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [securityLogs, setSecurityLogs] = useState<CmsSecurityLog[]>([]);

  const logAction = useCallback(
    async (actionType: string, actionStatus: "success" | "failed", details?: string, metadata?: Record<string, unknown>) => {
      const { error: logError } = await createSecurityLog({
        supabase,
        userId,
        actionType,
        actionStatus,
        details: details || null,
        metadata: metadata || null,
      });

      return logError;
    },
    [supabase, userId],
  );

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      setUserId(user.id);

      let profileResult = await supabase
        .from("profile_info")
        .select("id,full_name,title,status,experience_level,age")
        .eq("user_id", user.id)
        .maybeSingle<CmsProfile>();

      if (isSchemaMismatchError(profileResult.error)) {
        const legacyProfileResult = await supabase
          .from("profile_info")
          .select("id,age")
          .eq("user_id", user.id)
          .maybeSingle<{ id: string; age: number | null }>();

        profileResult = {
          data: legacyProfileResult.data
            ? ({
                id: legacyProfileResult.data.id,
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
        .select("id,title,description,tags,project_url,repo_url,thumbnail_url,status,featured,priority")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (isSchemaMismatchError(projectsResult.error)) {
        const legacyProjectsResult = await supabase
          .from("projects")
          .select("id,title,description,project_url,repo_url")
          .eq("user_id", user.id)
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
        .select("id,title,organization,issued_at,sort_order,link,local_path,is_public,is_specialization")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("issued_at", { ascending: false });

      if (isSchemaMismatchError(certificatesResult.error)) {
        const legacyCertificatesResult = await supabase
          .from("certificates")
          .select("id,title,organization,issued_at,link,is_public")
          .eq("user_id", user.id)
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

      const [skillsResult, socialLinksResult, settingsResult, logsResult] = await Promise.all([
        supabase
          .from("skills")
          .select("id,name,icon,category,proficiency,display_order")
          .eq("user_id", user.id)
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("social_links")
          .select("id,platform,url,icon,is_visible,display_order")
          .eq("user_id", user.id)
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("system_settings")
          .select("id,maintenance_mode")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle<CmsSystemSettings>(),
        supabase
          .from("security_logs")
          .select("id,user_id,action_type,action_status,ip_address,details,metadata,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const allErrors = [
        profileResult.error,
        skillsResult.error,
        projectsResult.error,
        certificatesResult.error,
        socialLinksResult.error,
        settingsResult.error,
        logsResult.error,
      ].filter(Boolean) as Array<{ code?: string; message?: string }>;

      const blockingError = allErrors.find((queryError) => !isSchemaMismatchError(queryError));
      const hasSchemaMismatch = allErrors.some((queryError) => isSchemaMismatchError(queryError));

      if (blockingError) {
        setError(blockingError.message || t("dashboard.error.load"));
      } else if (hasSchemaMismatch) {
        setError(t("dashboard.error.partialSchema"));
      }

      const profileData = profileResult.error ? null : profileResult.data;
      const parsedStatus = parseBilingualStatus(profileData?.status ?? null);
      setProfileId(profileData?.id ?? null);
      setProfileDraft({
        full_name: profileData?.full_name ?? "",
        title: profileData?.title ?? "",
        status_ar: parsedStatus.ar,
        status_en: parsedStatus.en,
        experience_level: profileData?.experience_level ?? "junior",
        age:
          profileData?.age !== null && profileData?.age !== undefined
            ? String(profileData.age)
            : "",
      });

      const skillRows = skillsResult.error ? [] : ((skillsResult.data ?? []) as CmsSkill[]);
      setSkills(skillRows);
      setSkillEdits(
        Object.fromEntries(
          skillRows.map((skill) => [
            skill.id,
            {
              name: skill.name,
              icon: skill.icon ?? "",
              category: skill.category ?? "",
              proficiency: String(skill.proficiency),
            },
          ]),
        ),
      );

      const projectRows = projectsResult.error ? [] : ((projectsResult.data ?? []) as CmsProject[]);
      setProjects(projectRows);
      setProjectEdits(
        Object.fromEntries(
          projectRows.map((project) => [
            project.id,
            {
              title: project.title,
              description: project.description,
              tags: normalizeTags((project as { tags?: unknown }).tags),
              project_url: project.project_url ?? "",
              repo_url: project.repo_url ?? "",
              thumbnail_url: project.thumbnail_url ?? "",
              status: project.status ?? "in_progress",
              featured: project.featured,
              priority:
                ((project as { priority?: number | null }).priority ?? 0).toString(),
            },
          ]),
        ),
      );

      const certificateRows = certificatesResult.error
        ? []
        : ((certificatesResult.data ?? []) as CmsCertificate[]);

      const certificateRowsWithLinks = [...certificateRows]
        .sort((a, b) => {
          const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
          const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime();
        })
        .map((certificate) => ({
          ...certificate,
          sort_order: certificate.sort_order ?? null,
          specialization_course_ids: [],
          specialization_courses: [],
        }));

      const specializationIds = certificateRowsWithLinks
        .filter((certificate) => certificate.is_specialization)
        .map((certificate) => certificate.id);

      if (specializationIds.length > 0) {
        const specializationLinksResult = await supabase
          .from("certificate_specialization_courses")
          .select("specialization_id,course_certificate_id")
          .in("specialization_id", specializationIds);

        if (!specializationLinksResult.error) {
          const links = specializationLinksResult.data ?? [];
          const linkedCertificateIds = Array.from(new Set(links.map((row) => row.course_certificate_id as string)));
          const linkedTitlesResult =
            linkedCertificateIds.length > 0
              ? await supabase
                  .from("certificates")
                  .select("id,title")
                  .in("id", linkedCertificateIds)
                  .eq("user_id", user.id)
              : { data: [], error: null };

          const titleLookup = new Map((linkedTitlesResult.data ?? []).map((row) => [row.id as string, row.title as string]));
          const specializationLookup = new Map<string, string[]>();

          for (const row of links) {
            const specializationId = row.specialization_id as string;
            const courseId = row.course_certificate_id as string;
            const existing = specializationLookup.get(specializationId) ?? [];
            specializationLookup.set(specializationId, [...existing, courseId]);
          }

          for (const certificate of certificateRowsWithLinks) {
            const linkedIds = specializationLookup.get(certificate.id) ?? [];
            certificate.specialization_course_ids = linkedIds;
            certificate.specialization_courses = linkedIds
              .map((linkedId) => ({
                id: linkedId,
                title: titleLookup.get(linkedId) ?? "",
              }))
              .filter((course) => Boolean(course.title));
          }
        }
      }

      setCertificates(certificateRowsWithLinks);
      setCertificateEdits(
        Object.fromEntries(
          certificateRowsWithLinks.map((certificate) => [
            certificate.id,
            {
              title: certificate.title,
              organization: certificate.organization,
              issued_at: toDateInput(certificate.issued_at),
              sort_order: String(certificate.sort_order ?? 100),
              link: certificate.link ?? "",
              local_path: certificate.local_path ?? "",
              is_public: certificate.is_public,
              is_specialization: certificate.is_specialization,
              specialization_course_ids: certificate.specialization_course_ids ?? [],
            },
          ]),
        ),
      );
      setCertificateCourseOptions(
        certificateRowsWithLinks.map((certificate) => ({
          id: certificate.id,
          title: certificate.title,
          is_specialization: certificate.is_specialization,
        })),
      );

      const socialRows = socialLinksResult.error ? [] : ((socialLinksResult.data ?? []) as CmsSocialLink[]);
      setSocialLinks(socialRows);
      setSocialEdits(
        Object.fromEntries(
          socialRows.map((social) => [
            social.id,
            {
              platform: social.platform,
              url: social.url,
              icon: social.icon ?? "",
              is_visible: social.is_visible,
            },
          ]),
        ),
      );

      setSettingsId(settingsResult.error ? null : (settingsResult.data?.id ?? null));
      setMaintenanceMode(settingsResult.error ? false : Boolean(settingsResult.data?.maintenance_mode));
      setSecurityLogs(logsResult.error ? [] : ((logsResult.data ?? []) as CmsSecurityLog[]));
    } catch (runtimeError) {
      const message = runtimeError instanceof Error ? runtimeError.message : t("dashboard.error.load");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, supabase, t]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  function handleActionFeedback(message: string, logError: { message: string } | null) {
    if (logError) {
      setFeedback(`${message} ${t("dashboard.feedback.logWarning")}`);
      return;
    }
    setFeedback(message);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    const parsedAge = profileDraft.age === "" ? null : Number(profileDraft.age);
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 130)) {
      setError(t("dashboard.error.ageValidation"));
      return;
    }

    setError(null);
    setFeedback(null);

    const payload = {
      id: profileId ?? undefined,
      user_id: userId,
      full_name: profileDraft.full_name || null,
      title: profileDraft.title || null,
      status: composeBilingualStatus(profileDraft.status_ar, profileDraft.status_en),
      experience_level: profileDraft.experience_level || null,
      age: parsedAge,
    };

    const { data, error: upsertError } = await supabase
      .from("profile_info")
      .upsert(payload, { onConflict: "user_id" })
      .select("id")
      .single();

    if (upsertError) {
      await logAction("profile_update", "failed", upsertError.message);
      setError(upsertError.message);
      return;
    }

    setProfileId(data.id);
    const logError = await logAction("profile_update", "success", t("dashboard.feedback.profileSaved"));
    handleActionFeedback(t("dashboard.feedback.profileSaved"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function createSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    const proficiency = Number(skillDraft.proficiency);
    if (!Number.isFinite(proficiency) || proficiency < 0 || proficiency > 100) {
      setError(t("dashboard.error.proficiencyValidation"));
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: insertError } = await supabase.from("skills").insert({
      user_id: userId,
      name: skillDraft.name,
      icon: skillDraft.icon || null,
      category: skillDraft.category || null,
      proficiency,
      display_order: skills.length + 1,
    });

    if (insertError) {
      await logAction("skill_create", "failed", insertError.message);
      setError(insertError.message);
      return;
    }

    setSkillDraft(blankSkill);
    const logError = await logAction("skill_create", "success", t("dashboard.feedback.skillCreated"));
    handleActionFeedback(t("dashboard.feedback.skillCreated"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function updateSkill(skillId: string) {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    const edit = skillEdits[skillId];
    if (!edit) {
      setError(t("dashboard.error.missingSkillEdit"));
      return;
    }

    const proficiency = Number(edit.proficiency);
    if (!Number.isFinite(proficiency) || proficiency < 0 || proficiency > 100) {
      setError(t("dashboard.error.proficiencyValidation"));
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: updateError } = await supabase
      .from("skills")
      .update({
        name: edit.name,
        icon: edit.icon || null,
        category: edit.category || null,
        proficiency,
      })
      .eq("id", skillId)
      .eq("user_id", userId);

    if (updateError) {
      await logAction("skill_update", "failed", updateError.message);
      setError(updateError.message);
      return;
    }

    const logError = await logAction("skill_update", "success", t("dashboard.feedback.skillUpdated"));
    handleActionFeedback(t("dashboard.feedback.skillUpdated"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function deleteSkill(skillId: string) {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: deleteError } = await supabase
      .from("skills")
      .delete()
      .eq("id", skillId)
      .eq("user_id", userId);

    if (deleteError) {
      await logAction("skill_delete", "failed", deleteError.message);
      setError(deleteError.message);
      return;
    }

    const logError = await logAction("skill_delete", "success", t("dashboard.feedback.skillDeleted"));
    handleActionFeedback(t("dashboard.feedback.skillDeleted"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    setError(null);
    setFeedback(null);

    let { error: insertError } = await supabase.from("projects").insert({
      user_id: userId,
      title: projectDraft.title,
      description: projectDraft.description,
      tags: parseTags(projectDraft.tags),
      project_url: projectDraft.project_url || null,
      repo_url: projectDraft.repo_url || null,
      thumbnail_url: projectDraft.thumbnail_url || null,
      status: projectDraft.status,
      featured: projectDraft.featured,
      priority: Number.parseInt(projectDraft.priority, 10) || 0,
    });

    if (
      insertError &&
      (isSchemaMismatchError(insertError) ||
        (insertError.message ?? "").toLowerCase().includes("projects_status_check"))
    ) {
      const fallbackInsert = await supabase.from("projects").insert({
        user_id: userId,
        title: projectDraft.title,
        description: projectDraft.description,
        project_url: projectDraft.project_url || null,
        repo_url: projectDraft.repo_url || null,
      });
      insertError = fallbackInsert.error;
    }

    if (insertError) {
      await logAction("project_create", "failed", insertError.message);
      setError(insertError.message);
      return;
    }

    setProjectDraft(blankProject);
    const logError = await logAction("project_create", "success", t("dashboard.feedback.projectCreated"));
    handleActionFeedback(t("dashboard.feedback.projectCreated"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function updateProject(projectId: string) {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    const edit = projectEdits[projectId];
    if (!edit) {
      setError(t("dashboard.error.missingProjectEdit"));
      return;
    }

    const original = projects.find((p) => p.id === projectId);

    setError(null);
    setFeedback(null);

    const trimmedTags = edit.tags.trim();
    const nextTags = trimmedTags === ""
      ? (original?.tags ?? [])
      : parseTags(edit.tags);
    const nextProjectUrl = edit.project_url.trim() || original?.project_url || null;
    const nextRepoUrl = edit.repo_url.trim() || original?.repo_url || null;
    const nextThumbnail = edit.thumbnail_url.trim() || original?.thumbnail_url || null;
    const nextTitle = edit.title.trim() || original?.title || "";
    const nextDescription = edit.description.trim() || original?.description || "";

    let { error: updateError } = await supabase
      .from("projects")
      .update({
        title: nextTitle,
        description: nextDescription,
        tags: nextTags,
        project_url: nextProjectUrl,
        repo_url: nextRepoUrl,
        thumbnail_url: nextThumbnail,
        status: edit.status,
        featured: edit.featured,
        priority: Number.parseInt(edit.priority, 10) || 0,
      })
      .eq("id", projectId)
      .eq("user_id", userId);

    if (
      updateError &&
      (isSchemaMismatchError(updateError) ||
        (updateError.message ?? "").toLowerCase().includes("projects_status_check"))
    ) {
      const fallbackUpdate = await supabase
        .from("projects")
        .update({
          title: nextTitle,
          description: nextDescription,
          project_url: nextProjectUrl,
          repo_url: nextRepoUrl,
        })
        .eq("id", projectId)
        .eq("user_id", userId);
      updateError = fallbackUpdate.error;
    }

    if (updateError) {
      await logAction("project_update", "failed", updateError.message);
      setError(updateError.message);
      return;
    }

    const logError = await logAction("project_update", "success", t("dashboard.feedback.projectUpdated"));
    handleActionFeedback(t("dashboard.feedback.projectUpdated"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function deleteProject(projectId: string) {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId);

    if (deleteError) {
      await logAction("project_delete", "failed", deleteError.message);
      setError(deleteError.message);
      return;
    }

    const logError = await logAction("project_delete", "success", t("dashboard.feedback.projectDeleted"));
    handleActionFeedback(t("dashboard.feedback.projectDeleted"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function createCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    setError(null);
    setFeedback(null);

    const parsedSortOrder = Number.parseInt(certificateDraft.sort_order, 10);
    const normalizedSortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : 100;

    let { data: createdCertificate, error: insertError } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        title: certificateDraft.title,
        organization: certificateDraft.organization,
        issued_at: certificateDraft.issued_at,
        sort_order: normalizedSortOrder,
        link: certificateDraft.link || null,
        local_path: certificateDraft.local_path || null,
        is_public: certificateDraft.is_public,
        is_specialization: certificateDraft.is_specialization,
      })
      .select("id")
      .single();

    if (insertError && isSchemaMismatchError(insertError)) {
      const fallbackInsert = await supabase
        .from("certificates")
        .insert({
          user_id: userId,
          title: certificateDraft.title,
          organization: certificateDraft.organization,
          issued_at: certificateDraft.issued_at,
          link: certificateDraft.link || null,
          is_public: certificateDraft.is_public,
        })
        .select("id")
        .single();
      createdCertificate = fallbackInsert.data;
      insertError = fallbackInsert.error;
    }

    if (insertError) {
      await logAction("certificate_create", "failed", insertError.message);
      setError(insertError.message);
      return;
    }

    if (certificateDraft.is_specialization && (certificateDraft.specialization_course_ids?.length ?? 0) > 0) {
      const relationRows = certificateDraft.specialization_course_ids.map((courseCertificateId) => ({
        specialization_id: createdCertificate.id,
        course_certificate_id: courseCertificateId,
      }));
      const { error: relationError } = await supabase
        .from("certificate_specialization_courses")
        .insert(relationRows);
      if (relationError) {
        await supabase.from("certificates").delete().eq("id", createdCertificate.id).eq("user_id", userId);
        await logAction("certificate_create", "failed", relationError.message);
        setError(relationError.message);
        return;
      }
    }

    setCertificateDraft(blankCertificate);
    setNewSpecializationCourseId("");
    const logError = await logAction("certificate_create", "success", t("dashboard.feedback.certificateCreated"));
    handleActionFeedback(t("dashboard.feedback.certificateCreated"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function updateCertificate(certificateId: string) {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    const edit = certificateEdits[certificateId];
    if (!edit) {
      setError(t("dashboard.error.missingCertificateEdit"));
      return;
    }

    setError(null);
    setFeedback(null);

    const parsedSortOrder = Number.parseInt(edit.sort_order, 10);
    const normalizedSortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : 100;

    let { error: updateError } = await supabase
      .from("certificates")
      .update({
        title: edit.title,
        organization: edit.organization,
        issued_at: edit.issued_at,
        sort_order: normalizedSortOrder,
        link: edit.link || null,
        local_path: edit.local_path || null,
        is_public: edit.is_public,
        is_specialization: edit.is_specialization,
      })
      .eq("id", certificateId)
      .eq("user_id", userId);

    if (updateError && isSchemaMismatchError(updateError)) {
      const fallbackUpdate = await supabase
        .from("certificates")
        .update({
          title: edit.title,
          organization: edit.organization,
          issued_at: edit.issued_at,
          link: edit.link || null,
          is_public: edit.is_public,
        })
        .eq("id", certificateId)
        .eq("user_id", userId);
      updateError = fallbackUpdate.error;
    }

    if (updateError) {
      await logAction("certificate_update", "failed", updateError.message);
      setError(updateError.message);
      return;
    }

    const { error: deleteRelationError } = await supabase
      .from("certificate_specialization_courses")
      .delete()
      .eq("specialization_id", certificateId);

    if (deleteRelationError && !isSchemaMismatchError(deleteRelationError)) {
      await logAction("certificate_update", "failed", deleteRelationError.message);
      setError(deleteRelationError.message);
      return;
    }

    if (edit.is_specialization && (edit.specialization_course_ids?.length ?? 0) > 0) {
      const relationRows = edit.specialization_course_ids.map((courseCertificateId) => ({
        specialization_id: certificateId,
        course_certificate_id: courseCertificateId,
      }));
      const { error: relationError } = await supabase
        .from("certificate_specialization_courses")
        .insert(relationRows);
      if (relationError) {
        await logAction("certificate_update", "failed", relationError.message);
        setError(relationError.message);
        return;
      }
    }

    const logError = await logAction("certificate_update", "success", t("dashboard.feedback.certificateUpdated"));
    handleActionFeedback(t("dashboard.feedback.certificateUpdated"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function deleteCertificate(certificateId: string) {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: deleteError } = await supabase
      .from("certificates")
      .delete()
      .eq("id", certificateId)
      .eq("user_id", userId);

    if (deleteError) {
      await logAction("certificate_delete", "failed", deleteError.message);
      setError(deleteError.message);
      return;
    }

    const logError = await logAction("certificate_delete", "success", t("dashboard.feedback.certificateDeleted"));
    handleActionFeedback(t("dashboard.feedback.certificateDeleted"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function createSocial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: insertError } = await supabase.from("social_links").insert({
      user_id: userId,
      platform: socialDraft.platform,
      url: socialDraft.url,
      icon: socialDraft.icon || null,
      is_visible: socialDraft.is_visible,
      display_order: (socialLinks?.length ?? 0) + 1,
    });

    if (insertError) {
      await logAction("social_create", "failed", insertError.message);
      setError(insertError.message);
      return;
    }

    setSocialDraft(blankSocial);
    const logError = await logAction("social_create", "success", t("dashboard.feedback.socialCreated"));
    handleActionFeedback(t("dashboard.feedback.socialCreated"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function updateSocial(socialId: string) {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    const edit = socialEdits[socialId];
    if (!edit) {
      setError(t("dashboard.error.missingSocialEdit"));
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: updateError } = await supabase
      .from("social_links")
      .update({
        platform: edit.platform,
        url: edit.url,
        icon: edit.icon || null,
        is_visible: edit.is_visible,
      })
      .eq("id", socialId)
      .eq("user_id", userId);

    if (updateError) {
      await logAction("social_update", "failed", updateError.message);
      setError(updateError.message);
      return;
    }

    const logError = await logAction("social_update", "success", t("dashboard.feedback.socialUpdated"));
    handleActionFeedback(t("dashboard.feedback.socialUpdated"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function deleteSocial(socialId: string) {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: deleteError } = await supabase
      .from("social_links")
      .delete()
      .eq("id", socialId)
      .eq("user_id", userId);

    if (deleteError) {
      await logAction("social_delete", "failed", deleteError.message);
      setError(deleteError.message);
      return;
    }

    const logError = await logAction("social_delete", "success", t("dashboard.feedback.socialDeleted"));
    handleActionFeedback(t("dashboard.feedback.socialDeleted"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  async function saveSystemSettings() {
    if (!userId) {
      setError(t("dashboard.error.noUser"));
      return;
    }

    setError(null);
    setFeedback(null);

    const payload = {
      id: settingsId ?? undefined,
      maintenance_mode: maintenanceMode,
      updated_by: userId,
    };

    const { data, error: saveError } = await supabase
      .from("system_settings")
      .upsert(payload)
      .select("id")
      .single();

    if (saveError) {
      await logAction("settings_update", "failed", saveError.message, { maintenanceMode });
      setError(saveError.message);
      return;
    }

    setSettingsId(data.id);
    const logError = await logAction("settings_update", "success", t("dashboard.feedback.settingsSaved"), {
      maintenanceMode,
      theme,
    });
    handleActionFeedback(t("dashboard.feedback.settingsSaved"), logError);
    broadcastDataUpdate();
    await loadDashboardData();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-20">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass rounded-2xl border-border/40">
              <CardContent className="p-6 text-muted-foreground">{t("dashboard.loading")}</CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: "profile", label: t("dashboard.sidebar.profile"), icon: UserRound },
    { id: "skills", label: t("dashboard.sidebar.skills"), icon: Sparkles },
    { id: "projects", label: t("dashboard.sidebar.projects"), icon: BriefcaseBusiness },
    { id: "certificates", label: t("dashboard.sidebar.certificates"), icon: Award },
    { id: "social", label: t("dashboard.sidebar.social"), icon: Link2 },
    { id: "settings", label: t("dashboard.sidebar.settings"), icon: Settings },
    { id: "logs", label: t("dashboard.sidebar.logs"), icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass rounded-2xl border-border/40">
            <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <p className="text-xs tracking-[0.2em] text-primary">{t("dashboard.badge")}</p>
                <CardTitle className="text-3xl">{t("dashboard.title")}</CardTitle>
                <CardDescription>{t("dashboard.subtitlePro")}</CardDescription>
                <div className="flex gap-4 text-sm">
                  <Link to="/" className="text-muted-foreground hover:text-primary">
                    {t("dashboard.homeLink")}
                  </Link>
                  <Link to="/certificates" className="text-muted-foreground hover:text-primary">
                    {t("dashboard.publicCertificates")}
                  </Link>
                </div>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                {t("dashboard.signOut")}
              </Button>
            </CardHeader>
          </Card>
        </motion.div>

        {feedback && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass rounded-2xl border-border/40">
              <CardContent className="p-4 text-sm text-primary">{feedback}</CardContent>
            </Card>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl border-destructive/50 bg-destructive/10">
              <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass rounded-2xl border-border/40 sticky top-28">
              <CardHeader>
                <CardTitle className="text-lg">{t("dashboard.sidebar.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                    {sidebarItems?.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "outline"}
                    className={`w-full justify-start gap-2 ${activeSection === item.id ? "forest-gradient" : ""}`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {activeSection === "profile" && (
              <Card className="glass rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle>{t("dashboard.profileSection")}</CardTitle>
                  <CardDescription>{t("dashboard.profileDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveProfile} className="grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">{t("dashboard.profileName")}</Label>
                        <Input
                          id="profile-name"
                          value={profileDraft.full_name}
                          onChange={(event) =>
                            setProfileDraft((prev) => ({ ...prev, full_name: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-title">{t("dashboard.profileTitle")}</Label>
                        <Input
                          id="profile-title"
                          value={profileDraft.title}
                          onChange={(event) =>
                            setProfileDraft((prev) => ({ ...prev, title: event.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-status-ar">{t("dashboard.profileStatusAr")}</Label>
                        <Input
                          id="profile-status-ar"
                          value={profileDraft.status_ar}
                          onChange={(event) =>
                            setProfileDraft((prev) => ({ ...prev, status_ar: event.target.value }))
                          }
                          placeholder={t("dashboard.profileStatusArPlaceholder")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-status-en">{t("dashboard.profileStatusEn")}</Label>
                        <Input
                          id="profile-status-en"
                          value={profileDraft.status_en}
                          onChange={(event) =>
                            setProfileDraft((prev) => ({ ...prev, status_en: event.target.value }))
                          }
                          placeholder={t("dashboard.profileStatusEnPlaceholder")}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">

                      <div className="space-y-2">
                        <Label htmlFor="profile-experience">{t("dashboard.experienceLevel")}</Label>
                        <Select
                          value={profileDraft.experience_level}
                          onValueChange={(value) =>
                            setProfileDraft((prev) => ({ ...prev, experience_level: value }))
                          }
                        >
                          <SelectTrigger id="profile-experience">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="junior">{t("dashboard.exp.junior")}</SelectItem>
                            <SelectItem value="mid">{t("dashboard.exp.mid")}</SelectItem>
                            <SelectItem value="senior">{t("dashboard.exp.senior")}</SelectItem>
                            <SelectItem value="lead">{t("dashboard.exp.lead")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-age">{t("dashboard.age")}</Label>
                        <Input
                          id="profile-age"
                          value={profileDraft.age}
                          onChange={(event) =>
                            setProfileDraft((prev) => ({
                              ...prev,
                              age: event.target.value.replace(/[^\d]/g, ""),
                            }))
                          }
                          type="text"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-fit forest-gradient">
                      {t("dashboard.saveProfile")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === "skills" && (
              <Card className="glass rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle>{t("dashboard.skillsSection")}</CardTitle>
                  <CardDescription>{t("dashboard.skillsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={createSkill} className="grid gap-3 rounded-xl border border-border/40 bg-card/30 p-4">
                    <Input
                      value={skillDraft.name}
                      onChange={(event) => setSkillDraft((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder={t("dashboard.skillName")}
                      required
                    />
                    <Input
                      value={skillDraft.icon}
                      onChange={(event) => setSkillDraft((prev) => ({ ...prev, icon: event.target.value }))}
                      placeholder={t("dashboard.skillIcon")}
                    />
                    <Input
                      value={skillDraft.category}
                      onChange={(event) => setSkillDraft((prev) => ({ ...prev, category: event.target.value }))}
                      placeholder={t("dashboard.skillCategory")}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="skill-proficiency-new">{t("dashboard.skillProficiency")}</Label>
                      <Input
                        id="skill-proficiency-new"
                        value={skillDraft.proficiency}
                        onChange={(event) =>
                          setSkillDraft((prev) => ({
                            ...prev,
                            proficiency: event.target.value.replace(/[^\d]/g, ""),
                          }))
                        }
                        type="text"
                        inputMode="numeric"
                        placeholder="0-100"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-fit forest-gradient">
                      {t("dashboard.createSkill")}
                    </Button>
                  </form>

                  <div className="space-y-4">
                    {skills?.map((skill) => {
                      const edit = skillEdits[skill.id] ?? blankSkill;
                      return (
                        <Card key={skill.id} className="rounded-xl border-border/40 bg-card/30">
                          <CardContent className="p-4 space-y-3">
                            <Input
                              value={edit.name}
                              onChange={(event) =>
                                setSkillEdits((prev) => ({
                                  ...prev,
                                  [skill.id]: { ...edit, name: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.skillName")}
                            />
                            <Input
                              value={edit.icon}
                              onChange={(event) =>
                                setSkillEdits((prev) => ({
                                  ...prev,
                                  [skill.id]: { ...edit, icon: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.skillIcon")}
                            />
                            <Input
                              value={edit.category}
                              onChange={(event) =>
                                setSkillEdits((prev) => ({
                                  ...prev,
                                  [skill.id]: { ...edit, category: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.skillCategory")}
                            />
                            <Input
                              value={edit.proficiency}
                              onChange={(event) =>
                                setSkillEdits((prev) => ({
                                  ...prev,
                                  [skill.id]: {
                                    ...edit,
                                    proficiency: event.target.value.replace(/[^\d]/g, ""),
                                  },
                                }))
                              }
                              type="text"
                              inputMode="numeric"
                              placeholder="0-100"
                            />
                            <div className="flex gap-3">
                              <Button type="button" onClick={() => updateSkill(skill.id)}>
                                {t("dashboard.update")}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => deleteSkill(skill.id)}>
                                {t("dashboard.delete")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {(skills?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">{t("dashboard.noSkills")}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "projects" && (
              <Card className="glass rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle>{t("dashboard.projectsSection")}</CardTitle>
                  <CardDescription>{t("dashboard.projectsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={createProject} className="grid gap-3 rounded-xl border border-border/40 bg-card/30 p-4">
                    <Input
                      value={projectDraft.title}
                      onChange={(event) => setProjectDraft((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder={t("dashboard.projectTitle")}
                      required
                    />
                    <Textarea
                      value={projectDraft.description}
                      onChange={(event) => setProjectDraft((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder={t("dashboard.projectDescription")}
                      rows={3}
                      required
                    />
                    <Input
                      value={projectDraft.tags}
                      onChange={(event) => setProjectDraft((prev) => ({ ...prev, tags: event.target.value }))}
                      placeholder={t("dashboard.projectTags")}
                    />
                    <Input
                      value={projectDraft.project_url}
                      onChange={(event) => setProjectDraft((prev) => ({ ...prev, project_url: event.target.value }))}
                      placeholder={t("dashboard.liveDemo")}
                    />
                    <Input
                      value={projectDraft.repo_url}
                      onChange={(event) => setProjectDraft((prev) => ({ ...prev, repo_url: event.target.value }))}
                      placeholder={t("dashboard.githubUrl")}
                    />
                    <Input
                      value={projectDraft.thumbnail_url}
                      onChange={(event) =>
                        setProjectDraft((prev) => ({ ...prev, thumbnail_url: event.target.value }))
                      }
                      placeholder={t("dashboard.thumbnailUrl")}
                    />
                    <Input
                      type="number"
                      value={projectDraft.priority}
                      onChange={(event) =>
                        setProjectDraft((prev) => ({ ...prev, priority: event.target.value }))
                      }
                      placeholder={t("dashboard.projectPriority")}
                    />
                    <div className="grid md:grid-cols-2 gap-3">
                      <Select
                        value={projectDraft.status}
                        onValueChange={(value) =>
                          setProjectDraft((prev) => ({
                            ...prev,
                            status: value as "completed" | "in_progress" | "soon",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">{t("dashboard.projectStatusCompleted")}</SelectItem>
                          <SelectItem value="in_progress">{t("dashboard.projectStatusInProgress")}</SelectItem>
                          <SelectItem value="soon">{t("dashboard.projectStatusSoon")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="project-featured-new"
                          checked={projectDraft.featured}
                          onCheckedChange={(checked) =>
                            setProjectDraft((prev) => ({ ...prev, featured: checked === true }))
                          }
                        />
                        <Label htmlFor="project-featured-new">{t("dashboard.featured")}</Label>
                      </div>
                    </div>
                    <Button type="submit" className="w-fit forest-gradient">
                      {t("dashboard.createProject")}
                    </Button>
                  </form>

                  <div className="space-y-4">
                    {projects?.map((project) => {
                      const edit = projectEdits[project.id] ?? blankProject;
                      return (
                        <Card key={project.id} className="rounded-xl border-border/40 bg-card/30">
                          <CardContent className="p-4 space-y-3">
                            <Input
                              value={edit.title}
                              onChange={(event) =>
                                setProjectEdits((prev) => ({
                                  ...prev,
                                  [project.id]: { ...edit, title: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.projectTitle")}
                            />
                            <Textarea
                              value={edit.description}
                              onChange={(event) =>
                                setProjectEdits((prev) => ({
                                  ...prev,
                                  [project.id]: { ...edit, description: event.target.value },
                                }))
                              }
                              rows={3}
                              placeholder={t("dashboard.projectDescription")}
                            />
                            <Input
                              value={edit.tags}
                              onChange={(event) =>
                                setProjectEdits((prev) => ({
                                  ...prev,
                                  [project.id]: { ...edit, tags: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.projectTags")}
                            />
                            <Input
                              value={edit.project_url}
                              onChange={(event) =>
                                setProjectEdits((prev) => ({
                                  ...prev,
                                  [project.id]: { ...edit, project_url: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.liveDemo")}
                            />
                            <Input
                              value={edit.repo_url}
                              onChange={(event) =>
                                setProjectEdits((prev) => ({
                                  ...prev,
                                  [project.id]: { ...edit, repo_url: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.githubUrl")}
                            />
                            <Input
                              value={edit.thumbnail_url}
                              onChange={(event) =>
                                setProjectEdits((prev) => ({
                                  ...prev,
                                  [project.id]: { ...edit, thumbnail_url: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.thumbnailUrl")}
                            />
                            <Input
                              type="number"
                              value={edit.priority}
                              onChange={(event) =>
                                setProjectEdits((prev) => ({
                                  ...prev,
                                  [project.id]: { ...edit, priority: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.projectPriority")}
                            />
                            <div className="grid md:grid-cols-2 gap-3">
                              <Select
                                value={edit.status}
                                onValueChange={(value) =>
                                  setProjectEdits((prev) => ({
                                    ...prev,
                                    [project.id]: {
                                      ...edit,
                                      status: value as "completed" | "in_progress" | "soon",
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="completed">{t("dashboard.projectStatusCompleted")}</SelectItem>
                                  <SelectItem value="in_progress">{t("dashboard.projectStatusInProgress")}</SelectItem>
                                  <SelectItem value="soon">{t("dashboard.projectStatusSoon")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`project-featured-${project.id}`}
                                  checked={edit.featured}
                                  onCheckedChange={(checked) =>
                                    setProjectEdits((prev) => ({
                                      ...prev,
                                      [project.id]: { ...edit, featured: checked === true },
                                    }))
                                  }
                                />
                                <Label htmlFor={`project-featured-${project.id}`}>{t("dashboard.featured")}</Label>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <Button type="button" onClick={() => updateProject(project.id)}>
                                {t("dashboard.update")}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => deleteProject(project.id)}>
                                {t("dashboard.delete")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {(projects?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">{t("dashboard.noProjects")}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "certificates" && (
              <Card className="glass rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle>{t("dashboard.certificatesSection")}</CardTitle>
                  <CardDescription>{t("dashboard.certificatesDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={createCertificate}
                    className="grid gap-3 rounded-xl border border-border/40 bg-card/30 p-4"
                  >
                    <Input
                      value={certificateDraft.title}
                      onChange={(event) => setCertificateDraft((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder={t("dashboard.courseTitle")}
                      required
                    />
                    <Input
                      value={certificateDraft.organization}
                      onChange={(event) =>
                        setCertificateDraft((prev) => ({ ...prev, organization: event.target.value }))
                      }
                      placeholder={t("dashboard.organization")}
                      required
                    />
                    <Input
                      type="date"
                      value={certificateDraft.issued_at}
                      onChange={(event) =>
                        setCertificateDraft((prev) => ({ ...prev, issued_at: event.target.value }))
                      }
                      required
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={certificateDraft.sort_order}
                      onChange={(event) =>
                        setCertificateDraft((prev) => ({
                          ...prev,
                          sort_order: event.target.value.replace(/[^\d]/g, ""),
                        }))
                      }
                      placeholder={t("dashboard.certificateSortOrder")}
                    />
                    <Input
                      value={certificateDraft.link}
                      onChange={(event) => setCertificateDraft((prev) => ({ ...prev, link: event.target.value }))}
                      placeholder={t("dashboard.certificateLink")}
                    />
                    <Input
                      value={certificateDraft.local_path}
                      onChange={(event) =>
                        setCertificateDraft((prev) => ({ ...prev, local_path: event.target.value }))
                      }
                      placeholder={t("dashboard.localPath")}
                    />
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="certificate-public-new"
                          checked={certificateDraft.is_public}
                          onCheckedChange={(checked) =>
                            setCertificateDraft((prev) => ({ ...prev, is_public: checked === true }))
                          }
                        />
                        <Label htmlFor="certificate-public-new">{t("dashboard.publiclyVisible")}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="certificate-specialization-new"
                          checked={certificateDraft.is_specialization}
                          onCheckedChange={(checked) =>
                            setCertificateDraft((prev) => ({
                              ...prev,
                              is_specialization: checked === true,
                              specialization_course_ids: checked === true ? prev.specialization_course_ids : [],
                            }))
                          }
                        />
                        <Label htmlFor="certificate-specialization-new">{t("dashboard.specialization")}</Label>
                      </div>
                    </div>
                    {certificateDraft.is_specialization && (
                      <div className="space-y-3 rounded-xl border border-border/40 bg-card/30 p-3">
                        <Label>{t("dashboard.subCoursesSelect")}</Label>
                        <div className="flex flex-wrap gap-3">
                          <Select value={newSpecializationCourseId} onValueChange={setNewSpecializationCourseId}>
                            <SelectTrigger className="max-w-md">
                              <SelectValue placeholder={t("dashboard.selectCourse")} />
                            </SelectTrigger>
                            <SelectContent>
                              {certificateCourseOptions
                                .filter(
                                  (option) =>
                                    !option.is_specialization &&
                                    !certificateDraft.specialization_course_ids.includes(option.id),
                                )
                                .map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.title}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!newSpecializationCourseId}
                            onClick={() => {
                              if (!newSpecializationCourseId) {
                                return;
                              }
                              setCertificateDraft((prev) => ({
                                ...prev,
                                specialization_course_ids: Array.from(
                                  new Set([...prev.specialization_course_ids, newSpecializationCourseId]),
                                ),
                              }));
                              setNewSpecializationCourseId("");
                            }}
                          >
                            {t("dashboard.addCourse")}
                          </Button>
                        </div>
                        {(certificateDraft.specialization_course_ids?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {certificateDraft.specialization_course_ids.map((courseId) => {
                              const courseTitle =
                                certificateCourseOptions.find((option) => option.id === courseId)?.title ?? courseId;
                              return (
                                <Button
                                  key={courseId}
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    setCertificateDraft((prev) => ({
                                      ...prev,
                                      specialization_course_ids: prev.specialization_course_ids.filter(
                                        (existingId) => existingId !== courseId,
                                      ),
                                    }))
                                  }
                                >
                                  {courseTitle} ×
                                </Button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">{t("dashboard.noSubCoursesSelected")}</p>
                        )}
                      </div>
                    )}
                    <Button type="submit" className="w-fit forest-gradient">
                      {t("dashboard.createCertificate")}
                    </Button>
                  </form>

                  <div className="space-y-4">
                    {certificates?.map((certificate) => {
                      const edit = certificateEdits[certificate.id] ?? blankCertificate;
                      return (
                        <Card key={certificate.id} className="rounded-xl border-border/40 bg-card/30">
                          <CardContent className="p-4 space-y-3">
                            <Input
                              value={edit.title}
                              onChange={(event) =>
                                setCertificateEdits((prev) => ({
                                  ...prev,
                                  [certificate.id]: { ...edit, title: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.courseTitle")}
                            />
                            <Input
                              value={edit.organization}
                              onChange={(event) =>
                                setCertificateEdits((prev) => ({
                                  ...prev,
                                  [certificate.id]: { ...edit, organization: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.organization")}
                            />
                            <Input
                              type="date"
                              value={toDateInput(edit.issued_at)}
                              onChange={(event) =>
                                setCertificateEdits((prev) => ({
                                  ...prev,
                                  [certificate.id]: { ...edit, issued_at: event.target.value },
                                }))
                              }
                            />
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={edit.sort_order}
                              onChange={(event) =>
                                setCertificateEdits((prev) => ({
                                  ...prev,
                                  [certificate.id]: {
                                    ...edit,
                                    sort_order: event.target.value.replace(/[^\d]/g, ""),
                                  },
                                }))
                              }
                              placeholder={t("dashboard.certificateSortOrder")}
                            />
                            <Input
                              value={edit.link}
                              onChange={(event) =>
                                setCertificateEdits((prev) => ({
                                  ...prev,
                                  [certificate.id]: { ...edit, link: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.certificateLink")}
                            />
                            <Input
                              value={edit.local_path}
                              onChange={(event) =>
                                setCertificateEdits((prev) => ({
                                  ...prev,
                                  [certificate.id]: { ...edit, local_path: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.localPath")}
                            />
                            <div className="flex flex-wrap gap-6">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`certificate-public-${certificate.id}`}
                                  checked={edit.is_public}
                                  onCheckedChange={(checked) =>
                                    setCertificateEdits((prev) => ({
                                      ...prev,
                                      [certificate.id]: { ...edit, is_public: checked === true },
                                    }))
                                  }
                                />
                                <Label htmlFor={`certificate-public-${certificate.id}`}>
                                  {t("dashboard.publiclyVisibleShort")}
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`certificate-specialization-${certificate.id}`}
                                  checked={edit.is_specialization}
                                  onCheckedChange={(checked) =>
                                    setCertificateEdits((prev) => ({
                                      ...prev,
                                      [certificate.id]: {
                                        ...edit,
                                        is_specialization: checked === true,
                                        specialization_course_ids:
                                          checked === true ? edit.specialization_course_ids : [],
                                      },
                                    }))
                                  }
                                />
                                <Label htmlFor={`certificate-specialization-${certificate.id}`}>
                                  {t("dashboard.specialization")}
                                </Label>
                              </div>
                            </div>
                            {edit.is_specialization && (
                              <div className="space-y-3 rounded-xl border border-border/40 bg-card/30 p-3">
                                <Label>{t("dashboard.subCoursesSelect")}</Label>
                                <div className="flex flex-wrap gap-3">
                                  <Select
                                    value={editSpecializationPicker[certificate.id] ?? ""}
                                    onValueChange={(value) =>
                                      setEditSpecializationPicker((prev) => ({ ...prev, [certificate.id]: value }))
                                    }
                                  >
                                    <SelectTrigger className="max-w-md">
                                      <SelectValue placeholder={t("dashboard.selectCourse")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {certificateCourseOptions
                                        .filter(
                                          (option) =>
                                            option.id !== certificate.id &&
                                            !option.is_specialization &&
                                            !edit.specialization_course_ids.includes(option.id),
                                        )
                                        .map((option) => (
                                          <SelectItem key={option.id} value={option.id}>
                                            {option.title}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!editSpecializationPicker[certificate.id]}
                                    onClick={() => {
                                      const selectedCourseId = editSpecializationPicker[certificate.id];
                                      if (!selectedCourseId) {
                                        return;
                                      }
                                      setCertificateEdits((prev) => ({
                                        ...prev,
                                        [certificate.id]: {
                                          ...edit,
                                          specialization_course_ids: Array.from(
                                            new Set([...edit.specialization_course_ids, selectedCourseId]),
                                          ),
                                        },
                                      }));
                                      setEditSpecializationPicker((prev) => ({ ...prev, [certificate.id]: "" }));
                                    }}
                                  >
                                    {t("dashboard.addCourse")}
                                  </Button>
                                </div>
                                {(edit.specialization_course_ids?.length ?? 0) > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {edit.specialization_course_ids.map((courseId) => {
                                      const courseTitle =
                                        certificateCourseOptions.find((option) => option.id === courseId)?.title ?? courseId;
                                      return (
                                        <Button
                                          key={`${certificate.id}-${courseId}`}
                                          type="button"
                                          variant="outline"
                                          onClick={() =>
                                            setCertificateEdits((prev) => ({
                                              ...prev,
                                              [certificate.id]: {
                                                ...edit,
                                                specialization_course_ids: edit.specialization_course_ids.filter(
                                                  (existingId) => existingId !== courseId,
                                                ),
                                              },
                                            }))
                                          }
                                        >
                                          {courseTitle} ×
                                        </Button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">{t("dashboard.noSubCoursesSelected")}</p>
                                )}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-3">
                              <Button type="button" onClick={() => updateCertificate(certificate.id)}>
                                {t("dashboard.update")}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => deleteCertificate(certificate.id)}>
                                {t("dashboard.delete")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {(certificates?.length ?? 0) === 0 && (
                      <p className="text-sm text-muted-foreground">{t("dashboard.noCertificates")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "social" && (
              <Card className="glass rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle>{t("dashboard.socialSection")}</CardTitle>
                  <CardDescription>{t("dashboard.socialDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={createSocial} className="grid gap-3 rounded-xl border border-border/40 bg-card/30 p-4">
                    <Input
                      value={socialDraft.platform}
                      onChange={(event) => setSocialDraft((prev) => ({ ...prev, platform: event.target.value }))}
                      placeholder={t("dashboard.socialPlatform")}
                      required
                    />
                    <Input
                      value={socialDraft.url}
                      onChange={(event) => setSocialDraft((prev) => ({ ...prev, url: event.target.value }))}
                      placeholder={t("dashboard.socialUrl")}
                      required
                    />
                    <Input
                      value={socialDraft.icon}
                      onChange={(event) => setSocialDraft((prev) => ({ ...prev, icon: event.target.value }))}
                      placeholder={t("dashboard.socialIcon")}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        id="social-visible-new"
                        checked={socialDraft.is_visible}
                        onCheckedChange={(checked) =>
                          setSocialDraft((prev) => ({ ...prev, is_visible: checked }))
                        }
                      />
                      <Label htmlFor="social-visible-new">{t("dashboard.socialVisible")}</Label>
                    </div>
                    <Button type="submit" className="w-fit forest-gradient">
                      {t("dashboard.createSocial")}
                    </Button>
                  </form>

                  <div className="space-y-4">
                    {socialLinks?.map((social) => {
                      const edit = socialEdits[social.id] ?? blankSocial;
                      return (
                        <Card key={social.id} className="rounded-xl border-border/40 bg-card/30">
                          <CardContent className="p-4 space-y-3">
                            <Input
                              value={edit.platform}
                              onChange={(event) =>
                                setSocialEdits((prev) => ({
                                  ...prev,
                                  [social.id]: { ...edit, platform: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.socialPlatform")}
                            />
                            <Input
                              value={edit.url}
                              onChange={(event) =>
                                setSocialEdits((prev) => ({
                                  ...prev,
                                  [social.id]: { ...edit, url: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.socialUrl")}
                            />
                            <Input
                              value={edit.icon}
                              onChange={(event) =>
                                setSocialEdits((prev) => ({
                                  ...prev,
                                  [social.id]: { ...edit, icon: event.target.value },
                                }))
                              }
                              placeholder={t("dashboard.socialIcon")}
                            />
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`social-visible-${social.id}`}
                                checked={edit.is_visible}
                                onCheckedChange={(checked) =>
                                  setSocialEdits((prev) => ({
                                    ...prev,
                                    [social.id]: { ...edit, is_visible: checked },
                                  }))
                                }
                              />
                              <Label htmlFor={`social-visible-${social.id}`}>{t("dashboard.socialVisible")}</Label>
                            </div>
                            <div className="flex gap-3">
                              <Button type="button" onClick={() => updateSocial(social.id)}>
                                {t("dashboard.update")}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => deleteSocial(social.id)}>
                                {t("dashboard.delete")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {(socialLinks?.length ?? 0) === 0 && (
                      <p className="text-sm text-muted-foreground">{t("dashboard.noSocialLinks")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "settings" && (
              <Card className="glass rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle>{t("dashboard.settingsSection")}</CardTitle>
                  <CardDescription>{t("dashboard.settingsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <CircleGauge className="w-4 h-4" />
                      <p className="font-medium">{t("dashboard.themeControl")}</p>
                    </div>
                    <Select value={theme} onValueChange={(value) => setTheme(value as "dark" | "light" | "system")}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">{t("dashboard.themeDark")}</SelectItem>
                        <SelectItem value="light">{t("dashboard.themeLight")}</SelectItem>
                        <SelectItem value="system">{t("dashboard.themeSystem")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <ListChecks className="w-4 h-4" />
                      <p className="font-medium">{t("dashboard.maintenanceMode")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="maintenance-mode"
                        checked={maintenanceMode}
                        onCheckedChange={(checked) => setMaintenanceMode(checked)}
                      />
                      <Label htmlFor="maintenance-mode">
                        {maintenanceMode ? t("dashboard.maintenanceOn") : t("dashboard.maintenanceOff")}
                      </Label>
                    </div>
                    <Button onClick={saveSystemSettings} className="forest-gradient">
                      {t("dashboard.saveSettings")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "logs" && (
              <Card className="glass rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle>{t("dashboard.logsSection")}</CardTitle>
                  <CardDescription>{t("dashboard.logsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {securityLogs?.map((log) => (
                    <Card key={log.id} className="rounded-xl border-border/40 bg-card/30">
                      <CardContent className="p-4 text-sm space-y-1">
                        <p className="font-medium text-primary">{log.action_type}</p>
                        <p className="text-muted-foreground">
                          {t("dashboard.logStatus")}: {log.action_status}
                        </p>
                        <p className="text-muted-foreground">
                          {t("dashboard.logIp")}: {log.ip_address || "unknown"}
                        </p>
                        <p className="text-muted-foreground">
                          {t("dashboard.logDate")}: {new Date(log.created_at).toLocaleString()}
                        </p>
                        {log.details && <p className="text-muted-foreground">{log.details}</p>}
                      </CardContent>
                    </Card>
                  ))}
                  {(securityLogs?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">{t("dashboard.noLogs")}</p>}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
