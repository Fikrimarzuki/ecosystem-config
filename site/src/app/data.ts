import siteData from "../generated/site-data.json";

export type Localized = { en: string; id?: string };
export type Status = "active" | "paused" | "completed" | "archived";
export type Category = "games" | "learning" | "tools" | "products" | "platforms" | "career" | "labs" | "central-station" | "sun" | "moon";
export type Artifact = "dist/ecosystem.json" | "config/production.json";

export type Project = {
  id: string;
  name: string;
  status: Status;
  category: Category;
  /** "public": listed in the registry. "showcase": hidden listing, owner-approved for public discovery. */
  visibility: "public" | "showcase";
  tagline?: Localized;
  description?: Localized;
  technologies?: string[];
  website: { key: string; url: string }[];
  websiteWithheld: boolean;
  repositoryUrl?: string;
  thumbnail: boolean;
  sharedAssets: string[];
  related: string[];
  consumer: { artifact: Artifact | null; status: string } | null;
  azShowcase: boolean;
};

export type Consumer = { projectId: string; status: string; artifact: Artifact | null; notify: boolean };

export type SiteData = {
  generated: {
    builtAt: string | null;
    revision: string | null;
    version: number;
    validation: { ok: boolean; errors: number } | null;
    ecosystem: string | null;
    domain: string;
  };
  projects: Project[];
  categories: Category[];
  consumers: Consumer[];
  stats: {
    projects: number; listingPublic: number; described: number; notDescribed: number;
    byStatus: Partial<Record<Status, number>>; byCategory: Partial<Record<Category, number>>;
    consumers: number; consumersByStatus: Record<string, number>; consumersByArtifact: Partial<Record<Artifact, number>>;
    showcases: number; showcaseGrants: number; showcaseEligibility: number;
    deployments: number; thumbnails: number; publicRepositories: number;
    career: Record<string, number>; origins: number; concepts: number; schemas: number | null;
  };
};

export const data = siteData as SiteData;
export const projectById = new Map(data.projects.map(project => [project.id, project]));
export const HUB_ID = "configEcosystem";
export const registryUrl = "https://raw.githubusercontent.com/Fikrimarzuki/ecosystem-config/main/dist/ecosystem.json";
export const legacyRegistryUrl = "https://raw.githubusercontent.com/Fikrimarzuki/ecosystem-config/main/config/production.json";
export const repositoryUrl = "https://github.com/Fikrimarzuki/ecosystem-config";

export const thumbnailSrc = (project: Project) => project.thumbnail ? `${import.meta.env.BASE_URL}generated/projects/${project.id}.webp` : null;
