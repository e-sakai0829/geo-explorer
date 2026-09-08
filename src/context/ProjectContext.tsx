"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface ProjectItem {
  id: string;
  name: string;
  domain: string;
  competitors: string[];
  created_at?: string;
}

interface ProjectContextType {
  projectId: string | null;
  currentProject: ProjectItem | null;
  projects: ProjectItem[];
  loaded: boolean;
  plan: string;
  setProjectId: (id: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  projectId: null,
  currentProject: null,
  projects: [],
  loaded: false,
  plan: "starter",
  setProjectId: () => {},
  refreshProjects: async () => {},
});

function ProjectProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [plan, setPlan] = useState("starter");
  const [loaded, setLoaded] = useState(false);

  const urlProjectId = searchParams.get("project") || searchParams.get("projectId");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/user/project");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.projects) ? data.projects : [];
        setProjects(list);
        if (data.organization?.plan) {
          setPlan(data.organization.plan.toLowerCase());
        }

        // URLにプロジェクト指定がない場合、localStorageまたは先頭プロジェクトでURLを正規化
        if (!urlProjectId && list.length > 0) {
          const remembered = typeof window !== "undefined" ? localStorage.getItem("geo_last_project") : null;
          const initial = list.find((p: ProjectItem) => p.id === remembered) || list[0];
          if (initial?.id) {
            router.replace(`${pathname}?project=${initial.id}`);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [pathname]);

  // URLパラメータを最優先、なければprojects[0]
  const projectId = urlProjectId || (projects[0]?.id ?? null);
  const currentProject = projects.find((p) => p.id === projectId) || projects[0] || null;

  const setProjectId = (id: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("geo_last_project", id);
    }
    router.push(`${pathname}?project=${id}`);
  };

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        currentProject,
        projects,
        loaded,
        plan,
        setProjectId,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProjectProviderInner>{children}</ProjectProviderInner>
    </Suspense>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
