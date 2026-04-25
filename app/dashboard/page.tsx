"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type ProfileRecord = {
  id: string;
  age: number | null;
  bio: string;
};

type ProjectRecord = {
  id: string;
  title: string;
  description: string;
  project_url: string | null;
  repo_url: string | null;
  featured: boolean;
};

type CertificateRecord = {
  id: string;
  title: string;
  organization: string;
  issued_at: string;
  link: string | null;
  is_public: boolean;
};

type ProjectInput = {
  title: string;
  description: string;
  project_url: string;
  repo_url: string;
  featured: boolean;
};

type CertificateInput = {
  title: string;
  organization: string;
  issued_at: string;
  link: string;
  is_public: boolean;
};

const blankProject: ProjectInput = {
  title: "",
  description: "",
  project_url: "",
  repo_url: "",
  featured: false,
};

const blankCertificate: CertificateInput = {
  title: "",
  organization: "",
  issued_at: "",
  link: "",
  is_public: true,
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectDraft, setProjectDraft] = useState<ProjectInput>(blankProject);
  const [projectEdits, setProjectEdits] = useState<Record<string, ProjectInput>>({});

  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [certificateDraft, setCertificateDraft] =
    useState<CertificateInput>(blankCertificate);
  const [certificateEdits, setCertificateEdits] =
    useState<Record<string, CertificateInput>>({});

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const [profileResult, projectsResult, certificatesResult] = await Promise.all([
      supabase
        .from("profile_info")
        .select("id,age,bio")
        .eq("user_id", user.id)
        .maybeSingle<ProfileRecord>(),
      supabase
        .from("projects")
        .select("id,title,description,project_url,repo_url,featured")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("certificates")
        .select("id,title,organization,issued_at,link,is_public")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false }),
    ]);

    if (profileResult.error || projectsResult.error || certificatesResult.error) {
      setError(
        profileResult.error?.message ||
          projectsResult.error?.message ||
          certificatesResult.error?.message ||
          "Failed to load dashboard data."
      );
      setIsLoading(false);
      return;
    }

    const profileData = profileResult.data;
    setProfileId(profileData?.id ?? null);
    setAge(profileData?.age !== null && profileData?.age !== undefined ? String(profileData.age) : "");
    setBio(profileData?.bio ?? "");

    const projectRows = (projectsResult.data ?? []) as ProjectRecord[];
    setProjects(projectRows);
    setProjectEdits(
      Object.fromEntries(
        projectRows.map((project) => [
          project.id,
          {
            title: project.title,
            description: project.description,
            project_url: project.project_url ?? "",
            repo_url: project.repo_url ?? "",
            featured: project.featured,
          },
        ])
      )
    );

    const certificateRows = (certificatesResult.data ?? []) as CertificateRecord[];
    setCertificates(certificateRows);
    setCertificateEdits(
      Object.fromEntries(
        certificateRows.map((certificate) => [
          certificate.id,
          {
            title: certificate.title,
            organization: certificate.organization,
            issued_at: certificate.issued_at,
            link: certificate.link ?? "",
            is_public: certificate.is_public,
          },
        ])
      )
    );

    setIsLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError("No authenticated user found.");
      return;
    }

    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 130) {
      setError("Age must be a valid whole number between 0 and 130.");
      return;
    }

    setError(null);
    setFeedback(null);

    const { data, error: upsertError } = await supabase
      .from("profile_info")
      .upsert(
        {
          id: profileId ?? undefined,
          user_id: userId,
          age: parsedAge,
          bio,
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setProfileId(data.id);
    setFeedback("Profile saved.");
  }

  async function deleteProfile() {
    if (!userId) {
      setError("No authenticated user found.");
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: deleteError } = await supabase
      .from("profile_info")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setProfileId(null);
    setAge("");
    setBio("");
    setFeedback("Profile deleted.");
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError("No authenticated user found.");
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: insertError } = await supabase.from("projects").insert({
      user_id: userId,
      title: projectDraft.title,
      description: projectDraft.description,
      project_url: projectDraft.project_url || null,
      repo_url: projectDraft.repo_url || null,
      featured: projectDraft.featured,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setProjectDraft(blankProject);
    setFeedback("Project created.");
    await loadDashboardData();
  }

  async function updateProject(projectId: string) {
    if (!userId) {
      setError("No authenticated user found.");
      return;
    }

    const edit = projectEdits[projectId];
    if (!edit) {
      setError("No project edit payload found.");
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        title: edit.title,
        description: edit.description,
        project_url: edit.project_url || null,
        repo_url: edit.repo_url || null,
        featured: edit.featured,
      })
      .eq("id", projectId)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setFeedback("Project updated.");
    await loadDashboardData();
  }

  async function deleteProject(projectId: string) {
    if (!userId) {
      setError("No authenticated user found.");
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
      setError(deleteError.message);
      return;
    }

    setFeedback("Project deleted.");
    await loadDashboardData();
  }

  async function createCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError("No authenticated user found.");
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: insertError } = await supabase.from("certificates").insert({
      user_id: userId,
      title: certificateDraft.title,
      organization: certificateDraft.organization,
      issued_at: certificateDraft.issued_at,
      link: certificateDraft.link || null,
      is_public: certificateDraft.is_public,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setCertificateDraft(blankCertificate);
    setFeedback("Certificate created.");
    await loadDashboardData();
  }

  async function updateCertificate(certificateId: string) {
    if (!userId) {
      setError("No authenticated user found.");
      return;
    }

    const edit = certificateEdits[certificateId];
    if (!edit) {
      setError("No certificate edit payload found.");
      return;
    }

    setError(null);
    setFeedback(null);

    const { error: updateError } = await supabase
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

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setFeedback("Certificate updated.");
    await loadDashboardData();
  }

  async function deleteCertificate(certificateId: string) {
    if (!userId) {
      setError("No authenticated user found.");
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
      setError(deleteError.message);
      return;
    }

    setFeedback("Certificate deleted.");
    await loadDashboardData();
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[#2e6417] bg-[#0d0d0d] p-6 text-[#a7cf9f]">
        Loading dashboard data...
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-[#2e6417] bg-[#0d0d0d] p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs tracking-[0.22em] text-[#39ff14]">AAL2 PROTECTED</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#eaffdf]">Admin Control Panel</h2>
          <p className="mt-2 text-sm text-[#a7cf9f]">
            Manage portfolio profile, projects, and certificates with live Supabase CRUD.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-[#2e6417] bg-[#121d10] px-4 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#39ff14] hover:bg-[#1a2d15]"
        >
          Sign Out
        </button>
      </header>

      {feedback && (
        <p className="rounded-md border border-[#2e6417] bg-[#111d10] px-4 py-2 text-sm text-[#7fff5a]">
          {feedback}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-[#2e6417] bg-[#1a1010] px-4 py-2 text-sm text-[#8dff6c]">
          {error}
        </p>
      )}

      <section id="profile" className="rounded-2xl border border-[#2e6417] bg-[#0d0d0d] p-6">
        <h3 className="text-xl font-semibold text-[#eaffdf]">Profile Info</h3>
        <form onSubmit={saveProfile} className="mt-5 grid gap-4">
          <input
            value={age}
            onChange={(event) => setAge(event.target.value.replace(/[^\d]/g, ""))}
            type="text"
            inputMode="numeric"
            placeholder="Age"
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
            required
          />
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Bio"
            rows={4}
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
            required
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-md border border-[#2e6417] bg-[#173212] px-4 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#39ff14] hover:bg-[#1f4318]"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={deleteProfile}
              className="rounded-md border border-[#2e6417] bg-[#1a1414] px-4 py-2 text-sm font-medium text-[#9be88a] transition hover:border-[#39ff14]"
            >
              Delete Profile
            </button>
          </div>
        </form>
      </section>

      <section id="projects" className="rounded-2xl border border-[#2e6417] bg-[#0d0d0d] p-6">
        <h3 className="text-xl font-semibold text-[#eaffdf]">Projects</h3>
        <form onSubmit={createProject} className="mt-5 grid gap-3 rounded-xl border border-[#2e6417] bg-[#090909] p-4">
          <input
            value={projectDraft.title}
            onChange={(event) =>
              setProjectDraft((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Project title"
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
            required
          />
          <textarea
            value={projectDraft.description}
            onChange={(event) =>
              setProjectDraft((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Project description"
            rows={3}
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
            required
          />
          <input
            value={projectDraft.project_url}
            onChange={(event) =>
              setProjectDraft((prev) => ({ ...prev, project_url: event.target.value }))
            }
            placeholder="Project URL"
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
          />
          <input
            value={projectDraft.repo_url}
            onChange={(event) =>
              setProjectDraft((prev) => ({ ...prev, repo_url: event.target.value }))
            }
            placeholder="Repository URL"
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
          />
          <label className="flex items-center gap-2 text-sm text-[#b8e8af]">
            <input
              type="checkbox"
              checked={projectDraft.featured}
              onChange={(event) =>
                setProjectDraft((prev) => ({ ...prev, featured: event.target.checked }))
              }
              className="h-4 w-4 accent-[#39ff14]"
            />
            Featured project
          </label>
          <button
            type="submit"
            className="w-fit rounded-md border border-[#2e6417] bg-[#173212] px-4 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#39ff14] hover:bg-[#1f4318]"
          >
            Create Project
          </button>
        </form>

        <div className="mt-5 space-y-4">
          {projects.map((project) => {
            const edit = projectEdits[project.id] ?? blankProject;
            return (
              <article key={project.id} className="rounded-xl border border-[#2e6417] bg-[#090909] p-4">
                <div className="grid gap-3">
                  <input
                    value={edit.title}
                    onChange={(event) =>
                      setProjectEdits((prev) => ({
                        ...prev,
                        [project.id]: { ...edit, title: event.target.value },
                      }))
                    }
                    className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
                  />
                  <textarea
                    value={edit.description}
                    onChange={(event) =>
                      setProjectEdits((prev) => ({
                        ...prev,
                        [project.id]: { ...edit, description: event.target.value },
                      }))
                    }
                    rows={3}
                    className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
                  />
                  <input
                    value={edit.project_url}
                    onChange={(event) =>
                      setProjectEdits((prev) => ({
                        ...prev,
                        [project.id]: { ...edit, project_url: event.target.value },
                      }))
                    }
                    placeholder="Project URL"
                    className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
                  />
                  <input
                    value={edit.repo_url}
                    onChange={(event) =>
                      setProjectEdits((prev) => ({
                        ...prev,
                        [project.id]: { ...edit, repo_url: event.target.value },
                      }))
                    }
                    placeholder="Repository URL"
                    className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
                  />
                  <label className="flex items-center gap-2 text-sm text-[#b8e8af]">
                    <input
                      type="checkbox"
                      checked={edit.featured}
                      onChange={(event) =>
                        setProjectEdits((prev) => ({
                          ...prev,
                          [project.id]: { ...edit, featured: event.target.checked },
                        }))
                      }
                      className="h-4 w-4 accent-[#39ff14]"
                    />
                    Featured project
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => updateProject(project.id)}
                    className="rounded-md border border-[#2e6417] bg-[#173212] px-4 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#39ff14] hover:bg-[#1f4318]"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProject(project.id)}
                    className="rounded-md border border-[#2e6417] bg-[#1a1414] px-4 py-2 text-sm font-medium text-[#9be88a] transition hover:border-[#39ff14]"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}

          {projects.length === 0 && (
            <p className="text-sm text-[#8dbc83]">No projects yet.</p>
          )}
        </div>
      </section>

      <section
        id="certificates"
        className="rounded-2xl border border-[#2e6417] bg-[#0d0d0d] p-6"
      >
        <h3 className="text-xl font-semibold text-[#eaffdf]">Certificates</h3>
        <form
          onSubmit={createCertificate}
          className="mt-5 grid gap-3 rounded-xl border border-[#2e6417] bg-[#090909] p-4"
        >
          <input
            value={certificateDraft.title}
            onChange={(event) =>
              setCertificateDraft((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Course title"
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
            required
          />
          <input
            value={certificateDraft.organization}
            onChange={(event) =>
              setCertificateDraft((prev) => ({
                ...prev,
                organization: event.target.value,
              }))
            }
            placeholder="Organization"
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
            required
          />
          <input
            type="date"
            value={certificateDraft.issued_at}
            onChange={(event) =>
              setCertificateDraft((prev) => ({
                ...prev,
                issued_at: event.target.value,
              }))
            }
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
            required
          />
          <input
            value={certificateDraft.link}
            onChange={(event) =>
              setCertificateDraft((prev) => ({ ...prev, link: event.target.value }))
            }
            placeholder="Certificate link"
            className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
          />
          <label className="flex items-center gap-2 text-sm text-[#b8e8af]">
            <input
              type="checkbox"
              checked={certificateDraft.is_public}
              onChange={(event) =>
                setCertificateDraft((prev) => ({
                  ...prev,
                  is_public: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-[#39ff14]"
            />
            Publicly visible on /certificates
          </label>
          <button
            type="submit"
            className="w-fit rounded-md border border-[#2e6417] bg-[#173212] px-4 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#39ff14] hover:bg-[#1f4318]"
          >
            Create Certificate
          </button>
        </form>

        <div className="mt-5 space-y-4">
          {certificates.map((certificate) => {
            const edit = certificateEdits[certificate.id] ?? blankCertificate;
            return (
              <article
                key={certificate.id}
                className="rounded-xl border border-[#2e6417] bg-[#090909] p-4"
              >
                <div className="grid gap-3">
                  <input
                    value={edit.title}
                    onChange={(event) =>
                      setCertificateEdits((prev) => ({
                        ...prev,
                        [certificate.id]: { ...edit, title: event.target.value },
                      }))
                    }
                    className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
                  />
                  <input
                    value={edit.organization}
                    onChange={(event) =>
                      setCertificateEdits((prev) => ({
                        ...prev,
                        [certificate.id]: { ...edit, organization: event.target.value },
                      }))
                    }
                    className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
                  />
                  <input
                    type="date"
                    value={edit.issued_at}
                    onChange={(event) =>
                      setCertificateEdits((prev) => ({
                        ...prev,
                        [certificate.id]: { ...edit, issued_at: event.target.value },
                      }))
                    }
                    className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
                  />
                  <input
                    value={edit.link}
                    onChange={(event) =>
                      setCertificateEdits((prev) => ({
                        ...prev,
                        [certificate.id]: { ...edit, link: event.target.value },
                      }))
                    }
                    placeholder="Certificate link"
                    className="rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] focus:ring-2"
                  />
                  <label className="flex items-center gap-2 text-sm text-[#b8e8af]">
                    <input
                      type="checkbox"
                      checked={edit.is_public}
                      onChange={(event) =>
                        setCertificateEdits((prev) => ({
                          ...prev,
                          [certificate.id]: { ...edit, is_public: event.target.checked },
                        }))
                      }
                      className="h-4 w-4 accent-[#39ff14]"
                    />
                    Publicly visible
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => updateCertificate(certificate.id)}
                    className="rounded-md border border-[#2e6417] bg-[#173212] px-4 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#39ff14] hover:bg-[#1f4318]"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCertificate(certificate.id)}
                    className="rounded-md border border-[#2e6417] bg-[#1a1414] px-4 py-2 text-sm font-medium text-[#9be88a] transition hover:border-[#39ff14]"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}

          {certificates.length === 0 && (
            <p className="text-sm text-[#8dbc83]">No certificates yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
