export type CmsProfile = {
  id: string;
  user_id?: string;
  full_name: string | null;
  title: string | null;
  status: string | null;
  experience_level: string | null;
  age: number | null;
  updated_at?: string;
};

export type CmsSkill = {
  id: string;
  name: string;
  icon: string | null;
  category: string | null;
  proficiency: number;
  display_order: number | null;
  created_at?: string;
};

export type CmsProject = {
  id: string;
  title: string;
  description: string;
  tags: string[] | null;
  project_url: string | null;
  repo_url: string | null;
  thumbnail_url: string | null;
  status: "completed" | "in_progress" | "soon" | null;
  featured: boolean;
  priority: number | null;
  created_at?: string;
};

export type CmsCertificate = {
  id: string;
  title: string;
  organization: string;
  issued_at: string;
  sort_order: number | null;
  link: string | null;
  local_path: string | null;
  is_public: boolean;
  is_specialization: boolean;
  specialization_course_ids?: string[];
  specialization_courses?: Array<{ id: string; title: string }>;
  created_at?: string;
};

export type CmsSocialLink = {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  is_visible: boolean;
  display_order: number | null;
  created_at?: string;
};

export type CmsSystemSettings = {
  id: string;
  maintenance_mode: boolean;
  updated_at?: string;
};

export type CmsSecurityLog = {
  id: string;
  user_id: string | null;
  action_type: string;
  action_status: "success" | "failed";
  ip_address: string | null;
  details: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
