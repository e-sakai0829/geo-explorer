"use client";

import React, { createContext, useContext, useState, useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase-browser";

export interface ProjectItem {
  id: string;
  name: string;
  domain: string;
  competitors: string[];
  created_at?: string;
}

interface ProjectContextType {
  ownerId: string | null;
  projectId: string | null;
  currentProject: ProjectItem | null;
  projects: ProjectItem[];
  loaded: boolean;
  plan: string;
  setProjectId: (id: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  ownerId: null,
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

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const location = useRef({ pathname, search: searchParams.toString() });
  location.current = { pathname, search: searchParams.toString() };
  const fetchProjects = async () => {
    const generation = ++sequence.current;
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoaded(false);
    try {
      const res = await fetch("/api/user/project", { signal: request.signal });
      if (!res.ok) throw new Error("Project access unavailable");
      const data = await res.json();
      if (generation !== sequence.current || request.signal.aborted) return;
      const list = Array.isArray(data.projects) ? data.projects : [];
      setProjects(list);
      setOwnerId(typeof data.organization?.id === "string" ? data.organization.id : null);
      setPlan(typeof data.organization?.plan === "string" ? data.organization.plan.toLowerCase() : "starter");
      const params = new URLSearchParams(location.current.search);
      const specified = params.get("project") || params.get("projectId");
      // An explicitly invalid project must never silently fall back to another.
      if (!specified && list.length) {
        let remembered: string | null = null;
        try { remembered = localStorage.getItem("geo_last_project"); } catch {}
        const initial = list.find((p: ProjectItem) => p.id === remembered) || list[0];
        params.set("project", initial.id);
        router.replace(location.current.pathname + "?" + params.toString());
      }
    } catch {
      if (generation === sequence.current) { setProjects([]); setOwnerId(null); }
    } finally { if (generation === sequence.current) setLoaded(true); }
  };
  useEffect(() => {
    fetchProjects();
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        ++sequence.current; controller.current?.abort(); setProjects([]); setOwnerId(null); setLoaded(true);
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") { void fetchProjects(); }
    });
    return () => { ++sequence.current; controller.current?.abort(); subscription.unsubscribe(); };
  }, [pathname]);
  const validProject = loaded && ownerId ? projects.find(p => p.id === urlProjectId) || null : null;
  const projectId = validProject?.id ?? null;
  const currentProject = validProject;
  const setProjectId = (id: string) => {
    if (!projects.some(p => p.id === id)) return;
    try { localStorage.setItem("geo_last_project", id); } catch {}
    const params = new URLSearchParams(searchParams.toString());
    params.delete("projectId"); params.delete("prompt"); params.delete("fanouts");
    params.set("project", id);
    router.push(pathname + "?" + params.toString());
  };

  return (
    <ProjectContext.Provider
      value={{
        ownerId,
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
