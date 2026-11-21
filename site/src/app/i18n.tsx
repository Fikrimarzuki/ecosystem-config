import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Category, Localized, Status } from "./data";

export type Language = "en" | "id";

const en = {
  skip: "Skip to content",
  brand: "Ecosystem Config",
  brandNote: "Part of FM Work",
  nav: { overview: "Overview", blueprint: "Blueprint", registry: "Registry", connections: "Connections", health: "Health", about: "About", guides: "Guides" },
  menu: "Menu", closeMenu: "Close menu", primaryNav: "Primary",
  language: "Language", theme: "Appearance", light: "Light", dark: "Dark",
  categories: {
    games: "Games", learning: "Learning", tools: "Tools", products: "Products", platforms: "Platforms", career: "Career", labs: "Labs",
    "central-station": "Station", sun: "Creator", moon: "Support",
  } satisfies Record<Category, string>,
  statuses: { active: "Active", paused: "Paused", completed: "Completed", archived: "Archived" } satisfies Record<Status, string>,
  overview: {
    title: "The architecture behind FM Work.",
    lead: "Ecosystem Config is one validated registry that every FM Work application reads before it builds: projects, deployments, shared assets and the publication rules that decide what each one may show.",
    explore: "Explore the blueprint", readGuides: "Read the guides",
    plateCaption: "The registry as built. Every point is a registered project, grouped by its destination.",
    plateProjects: (n: number) => `${n} projects registered`,
    plateConsumers: (n: number) => `${n} applications read it at build time`,
    plateCategories: (n: number) => `${n} destinations`,
    plateDeployments: (n: number) => `${n} registered deployments`,
    flowTitle: "How a fact travels",
    flow: [
      ["Write it once", "Each project is one small JSON file with its name, status, destination, deployments and approved copy."],
      ["Validate before it moves", "Schemas and cross-record rules check every source. Generated output must match the sources exactly."],
      ["Build with it", "Applications fetch the generated JSON at build time and present it their own way. Nothing is fetched at runtime."],
    ] as [string, string][],
    categoriesTitle: "Where projects live",
    categoriesLead: "Every project has exactly one destination. Counts include only projects that are publicly described.",
    guidesTitle: "Start with a guide",
    guidesLead: "The reference behind the registry, written for people building on it.",
  },
  blueprint: {
    title: "Ecosystem Blueprint",
    lead: "The real relationships in the registry: destinations, the applications that read it, and the links the documentation records. Nothing here is inferred.",
    map: "Map", list: "List", view: "View",
    search: "Find a project", searchPlaceholder: "Name, tagline or category", noMatch: "No project matches that search.",
    filters: "Filters", allCategories: "All destinations", allStatuses: "Any status", status: "Status",
    relations: "Relationships",
    rel: { membership: "Destination", consumes: "Reads the registry", documented: "Documented link", related: "Related projects", assets: "Shared assets" },
    reset: "Reset view", zoomIn: "Zoom in", zoomOut: "Zoom out", fit: "Fit to screen",
    hub: "Registry hub", hubNote: "This repository: sources, schemas, validation and the generated JSON.",
    assetsNode: "Shared assets", assetsNote: "Screenshots and icons kept in this repository and copied by consumers at build time.",
    selectHint: "Select a point to see its connections. Use Tab to move between points and Enter to select; Escape clears the selection.",
    connected: (n: number) => `${n} direct connections`,
    showing: (n: number, total: number) => `Showing ${n} of ${total} projects`,
    loading: "Drawing the blueprint…",
    listCaption: "The same projects and connections as the map, as a list.",
    clear: "Clear selection",
  },
  registry: {
    title: "Project registry",
    lead: (described: number, total: number) => `${described} of the ${total} registered projects are publicly described. Names, status and summaries come straight from the registry.`,
    search: "Search projects", placeholder: "Name, summary, technology", cards: "Cards", rows: "List", layout: "Layout",
    results: (n: number) => n === 1 ? "1 project" : `${n} projects`, none: "No projects match these filters.", clearFilters: "Clear filters",
    details: "Details", visit: "Visit website", source: "Source code", noWebsite: "No public website link", withheld: "Website link not published yet",
    technologies: "Built with", website: "Website", repository: "Repository", destination: "Destination", consumer: "Registry use",
    readsRegistry: (artifact: string) => `Reads ${artifact} at build time`, notConsumer: "Not a registered consumer",
    showcase: "Listed through the owner's public showcase approval", publicListing: "Listed publicly in the registry",
    close: "Close", noSummary: "The registry has no summary for this project yet.", sharedAssets: "Shared assets", relatedProjects: "Related", privateSource: "Private repository",
  },
  connections: {
    title: "Connections",
    lead: "Applications are consumers. Each one fetches a generated registry file while it builds, validates what it uses and owns its own presentation.",
    artifacts: "Two generated files, one source",
    artifactDist: "The current file for new consumers.",
    artifactLegacy: "Byte-identical, kept for consumers built before dist/ existed.",
    readers: (n: number) => n === 1 ? "1 consumer" : `${n} consumers`,
    compatible: "Compatible", blocked: "Needs a consumer fix",
    siblings: "Sibling repositories",
    gateway: ["Gateway", "The interactive portfolio. It reads the registry at build time, keeps a revision-pinned offline snapshot, and publishes only what each approval allows."],
    assets: ["Ecosystem Assets", "Creative and technical sources, including Gateway's 3D models and the master files for project icons. This repository keeps only the small web-ready copies."],
    skills: ["Ecosystem Skills", "Reviewed AI agent skills used across FM Work. A sibling project with no data or build dependency in either direction."],
    noNotify: "No automatic notifications: consumers pick up changes on their next build.",
    schematic: { sources: "sources and approvals", pipeline: "build, validate, test", build: "at build", assets: "assets/: screenshots, icons, CV" },
  },
  health: {
    title: "Registry health",
    lead: "A build-time snapshot of this website's copy of the registry. It is not live monitoring: nothing here is measured after the site was built.",
    builtAt: "Snapshot built", revision: "Source revision", validation: "Validation at build", passed: "Passed", failed: "Failed",
    errors: (n: number) => `${n} errors`, unknown: "Not recorded",
    inventory: "Inventory", projects: "Projects", described: "Publicly described", listed: "Listed publicly",
    deployments: "Registered deployments", thumbnails: "Project thumbnails", publicRepos: "Public repositories", schemas: "JSON Schemas",
    statuses: "Lifecycle", publication: "Publication approvals", memberships: "A–Z memberships", grants: "A–Z publication grants", eligibility: "Hidden-project eligibility decisions",
    collections: "Collections", experience: "Experience records", freelance: "Freelance records", assessments: "Assessments", origins: "Origins archive", concepts: "Concepts",
    consumers: "Consumers", compatible: "Compatible", blocked: "Blocked",
    how: "How these numbers are made",
    howText: "When this site is built, it reads the committed dist/ecosystem.json, runs the same validator as the repository's CI, and counts records. Refreshing the page does not re-check anything; the next build does.",
  },
  about: {
    title: "What this is",
    lead: "Ecosystem Config is the single source of truth for the shared, public facts of FM Work. It is a data repository, not a package and not a service.",
    owns: "What it owns", ownsList: ["Canonical facts and their JSON Schemas", "Validation and the two generated registry files", "Small shared assets: screenshots, icons and the CV", "The list of known consumers and their compatibility", "Publication approvals that bind exact content"],
    not: "What it does not own", notList: ["How any application looks or orders things", "Consumers' sync code and their deployments", "Secrets, credentials or private material of any kind"],
    privacy: "Privacy by projection",
    privacyText: "Everything committed here is public, including hidden records. Applications decide what to show, and anything published from a hidden record needs a separate, content-bound approval. This website follows the same rules: it names projects only when they are listed publicly or approved for showcase, never prints private repository names, and leaves out website links the owner has not released.",
    pipeline: "From source to screen",
    pipelineSteps: [
      ["Sources", "config/projects, career, origins, concepts and the publication files"],
      ["Assemble and validate", "pnpm build, pnpm validate and pnpm test, repeated in CI"],
      ["Publish", "dist/ecosystem.json and config/production.json on main"],
      ["Consume", "Each application syncs the file before it builds"],
    ] as [string, string][],
    endpoints: "Public files", endpointsNote: "These URLs are the contract. This website does not replace or proxy them.",
  },
  guides: {
    title: "Guides", lead: "Reference and integration guides for the registry. Guides are written in English.",
    sections: { reference: "Registry reference", building: "Building and integrating", approvals: "Publication approvals", records: "Release records" } as Record<string, string>,
    onPage: "On this page", filter: "Filter guides", none: "No guide matches.", all: "All guides", loading: "Loading guide…",
    edit: "Edit on GitHub", englishOnly: "This guide is available in English.",
  },
  notFound: { title: "This page is not on the plan", text: "The address may have changed. Start from the overview or open the guides.", home: "Go to the overview" },
  offline: (date: string) => `Offline. You are viewing the registry snapshot built on ${date}, which may be out of date.`,
  footer: { tagline: "Shared facts. Independent projects.", registry: "Registry JSON", source: "Source on GitHub", gateway: "FM Work Gateway", snapshot: (date: string) => `Data snapshot from ${date}` },
};

type Dict = typeof en;

const id: Dict = {
  skip: "Lewati ke konten",
  brand: "Ecosystem Config",
  brandNote: "Bagian dari FM Work",
  nav: { overview: "Ikhtisar", blueprint: "Cetak biru", registry: "Registri", connections: "Koneksi", health: "Kesehatan", about: "Tentang", guides: "Panduan" },
  menu: "Menu", closeMenu: "Tutup menu", primaryNav: "Navigasi utama",
  language: "Bahasa", theme: "Tampilan", light: "Terang", dark: "Gelap",
  categories: {
    games: "Gim", learning: "Belajar", tools: "Alat", products: "Produk", platforms: "Platform", career: "Karier", labs: "Lab",
    "central-station": "Stasiun", sun: "Kreator", moon: "Dukungan",
  },
  statuses: { active: "Aktif", paused: "Dijeda", completed: "Selesai", archived: "Diarsipkan" },
  overview: {
    title: "Arsitektur di balik FM Work.",
    lead: "Ecosystem Config adalah satu registri tervalidasi yang dibaca setiap aplikasi FM Work sebelum dibangun: proyek, deployment, aset bersama, dan aturan publikasi yang menentukan apa yang boleh ditampilkan.",
    explore: "Jelajahi cetak biru", readGuides: "Baca panduan",
    plateCaption: "Registri sebagaimana dibangun. Setiap titik adalah proyek terdaftar, dikelompokkan menurut destinasinya.",
    plateProjects: (n: number) => `${n} proyek terdaftar`,
    plateConsumers: (n: number) => `${n} aplikasi membacanya saat build`,
    plateCategories: (n: number) => `${n} destinasi`,
    plateDeployments: (n: number) => `${n} deployment terdaftar`,
    flowTitle: "Perjalanan sebuah fakta",
    flow: [
      ["Tulis sekali", "Setiap proyek adalah satu berkas JSON kecil berisi nama, status, destinasi, deployment, dan teks yang disetujui."],
      ["Validasi sebelum dipakai", "Skema dan aturan lintas-rekaman memeriksa setiap sumber. Keluaran yang dihasilkan harus sama persis dengan sumbernya."],
      ["Bangun dengannya", "Aplikasi mengambil JSON yang dihasilkan saat build dan menampilkannya dengan caranya sendiri. Tidak ada yang diambil saat runtime."],
    ],
    categoriesTitle: "Tempat proyek berada",
    categoriesLead: "Setiap proyek punya tepat satu destinasi. Jumlah hanya mencakup proyek yang dideskripsikan secara publik.",
    guidesTitle: "Mulai dari panduan",
    guidesLead: "Referensi di balik registri, ditulis untuk orang yang membangun di atasnya.",
  },
  blueprint: {
    title: "Cetak biru ekosistem",
    lead: "Hubungan nyata di dalam registri: destinasi, aplikasi yang membacanya, dan tautan yang tercatat di dokumentasi. Tidak ada yang ditebak.",
    map: "Peta", list: "Daftar", view: "Tampilan",
    search: "Cari proyek", searchPlaceholder: "Nama, tagline, atau kategori", noMatch: "Tidak ada proyek yang cocok.",
    filters: "Filter", allCategories: "Semua destinasi", allStatuses: "Semua status", status: "Status",
    relations: "Hubungan",
    rel: { membership: "Destinasi", consumes: "Membaca registri", documented: "Tautan terdokumentasi", related: "Proyek terkait", assets: "Aset bersama" },
    reset: "Atur ulang tampilan", zoomIn: "Perbesar", zoomOut: "Perkecil", fit: "Sesuaikan layar",
    hub: "Pusat registri", hubNote: "Repositori ini: sumber, skema, validasi, dan JSON yang dihasilkan.",
    assetsNode: "Aset bersama", assetsNote: "Tangkapan layar dan ikon yang disimpan di repositori ini dan disalin konsumen saat build.",
    selectHint: "Pilih sebuah titik untuk melihat koneksinya. Gunakan Tab untuk berpindah antartitik dan Enter untuk memilih; Escape menghapus pilihan.",
    connected: (n: number) => `${n} koneksi langsung`,
    showing: (n: number, total: number) => `Menampilkan ${n} dari ${total} proyek`,
    loading: "Menggambar cetak biru…",
    listCaption: "Proyek dan koneksi yang sama dengan peta, dalam bentuk daftar.",
    clear: "Hapus pilihan",
  },
  registry: {
    title: "Registri proyek",
    lead: (described: number, total: number) => `${described} dari ${total} proyek terdaftar dideskripsikan secara publik. Nama, status, dan ringkasan diambil langsung dari registri.`,
    search: "Cari proyek", placeholder: "Nama, ringkasan, teknologi", cards: "Kartu", rows: "Daftar", layout: "Tata letak",
    results: (n: number) => `${n} proyek`, none: "Tidak ada proyek yang cocok dengan filter ini.", clearFilters: "Hapus filter",
    details: "Detail", visit: "Kunjungi situs", source: "Kode sumber", noWebsite: "Tidak ada tautan situs publik", withheld: "Tautan situs belum dipublikasikan",
    technologies: "Dibangun dengan", website: "Situs", repository: "Repositori", destination: "Destinasi", consumer: "Penggunaan registri",
    readsRegistry: (artifact: string) => `Membaca ${artifact} saat build`, notConsumer: "Bukan konsumen terdaftar",
    showcase: "Ditampilkan melalui persetujuan showcase publik pemilik", publicListing: "Terdaftar publik di registri",
    close: "Tutup", noSummary: "Registri belum memiliki ringkasan untuk proyek ini.", sharedAssets: "Aset bersama", relatedProjects: "Terkait", privateSource: "Repositori privat",
  },
  connections: {
    title: "Koneksi",
    lead: "Aplikasi adalah konsumen. Masing-masing mengambil berkas registri yang dihasilkan saat build, memvalidasi bagian yang dipakai, dan mengatur tampilannya sendiri.",
    artifacts: "Dua berkas hasil, satu sumber",
    artifactDist: "Berkas terkini untuk konsumen baru.",
    artifactLegacy: "Identik byte demi byte, dipertahankan untuk konsumen yang dibuat sebelum dist/ ada.",
    readers: (n: number) => `${n} konsumen`,
    compatible: "Kompatibel", blocked: "Perlu perbaikan di konsumen",
    siblings: "Repositori saudara",
    gateway: ["Gateway", "Portofolio interaktif. Membaca registri saat build, menyimpan snapshot offline yang dipatok ke revisi tertentu, dan hanya menerbitkan apa yang diizinkan setiap persetujuan."],
    assets: ["Ecosystem Assets", "Sumber kreatif dan teknis, termasuk model 3D Gateway dan berkas induk ikon proyek. Repositori ini hanya menyimpan salinan kecil yang siap untuk web."],
    skills: ["Ecosystem Skills", "Keterampilan agen AI yang ditinjau dan dipakai di FM Work. Proyek saudara tanpa ketergantungan data atau build ke arah mana pun."],
    noNotify: "Tidak ada notifikasi otomatis: konsumen mengambil perubahan pada build berikutnya.",
    schematic: { sources: "sumber dan persetujuan", pipeline: "build, validasi, uji", build: "saat build", assets: "assets/: tangkapan layar, ikon, CV" },
  },
  health: {
    title: "Kesehatan registri",
    lead: "Snapshot saat build dari salinan registri di situs ini. Ini bukan pemantauan langsung: tidak ada yang diukur setelah situs dibangun.",
    builtAt: "Snapshot dibuat", revision: "Revisi sumber", validation: "Validasi saat build", passed: "Lulus", failed: "Gagal",
    errors: (n: number) => `${n} galat`, unknown: "Tidak tercatat",
    inventory: "Inventaris", projects: "Proyek", described: "Dideskripsikan publik", listed: "Terdaftar publik",
    deployments: "Deployment terdaftar", thumbnails: "Thumbnail proyek", publicRepos: "Repositori publik", schemas: "JSON Schema",
    statuses: "Siklus hidup", publication: "Persetujuan publikasi", memberships: "Keanggotaan A–Z", grants: "Izin publikasi A–Z", eligibility: "Keputusan kelayakan proyek tersembunyi",
    collections: "Koleksi", experience: "Rekaman pengalaman", freelance: "Rekaman freelance", assessments: "Asesmen", origins: "Arsip Origins", concepts: "Konsep",
    consumers: "Konsumen", compatible: "Kompatibel", blocked: "Terblokir",
    how: "Cara angka ini dibuat",
    howText: "Saat situs ini dibangun, ia membaca dist/ecosystem.json yang sudah di-commit, menjalankan validator yang sama dengan CI repositori, lalu menghitung rekaman. Memuat ulang halaman tidak memeriksa ulang apa pun; build berikutnya yang melakukannya.",
  },
  about: {
    title: "Apa ini",
    lead: "Ecosystem Config adalah satu-satunya sumber kebenaran untuk fakta publik bersama di FM Work. Ini repositori data, bukan paket dan bukan layanan.",
    owns: "Yang dikelolanya", ownsList: ["Fakta kanonis beserta JSON Schema-nya", "Validasi dan dua berkas registri yang dihasilkan", "Aset bersama yang kecil: tangkapan layar, ikon, dan CV", "Daftar konsumen yang diketahui beserta kompatibilitasnya", "Persetujuan publikasi yang mengikat konten secara persis"],
    not: "Yang tidak dikelolanya", notList: ["Tampilan dan urutan di setiap aplikasi", "Kode sinkronisasi dan deployment milik konsumen", "Rahasia, kredensial, atau materi privat apa pun"],
    privacy: "Privasi lewat proyeksi",
    privacyText: "Semua yang di-commit di sini bersifat publik, termasuk rekaman tersembunyi. Aplikasi menentukan apa yang ditampilkan, dan apa pun yang diterbitkan dari rekaman tersembunyi memerlukan persetujuan terpisah yang terikat pada konten. Situs ini mengikuti aturan yang sama: hanya menyebut proyek yang terdaftar publik atau disetujui untuk showcase, tidak pernah menampilkan nama repositori privat, dan tidak menampilkan tautan situs yang belum dirilis pemilik.",
    pipeline: "Dari sumber ke layar",
    pipelineSteps: [
      ["Sumber", "config/projects, career, origins, concepts, dan berkas publikasi"],
      ["Rakit dan validasi", "pnpm build, pnpm validate, dan pnpm test, diulang di CI"],
      ["Terbitkan", "dist/ecosystem.json dan config/production.json di main"],
      ["Konsumsi", "Setiap aplikasi menyinkronkan berkas sebelum build"],
    ],
    endpoints: "Berkas publik", endpointsNote: "URL ini adalah kontraknya. Situs ini tidak menggantikan atau menjadi perantaranya.",
  },
  guides: {
    title: "Panduan", lead: "Panduan referensi dan integrasi registri. Panduan ditulis dalam bahasa Inggris.",
    sections: { reference: "Referensi registri", building: "Membangun dan mengintegrasikan", approvals: "Persetujuan publikasi", records: "Catatan rilis" },
    onPage: "Di halaman ini", filter: "Saring panduan", none: "Tidak ada panduan yang cocok.", all: "Semua panduan", loading: "Memuat panduan…",
    edit: "Sunting di GitHub", englishOnly: "Panduan ini tersedia dalam bahasa Inggris.",
  },
  notFound: { title: "Halaman ini tidak ada di denah", text: "Alamatnya mungkin sudah berubah. Mulai dari ikhtisar atau buka panduan.", home: "Ke ikhtisar" },
  offline: (date: string) => `Offline. Anda melihat snapshot registri yang dibuat pada ${date}, yang mungkin sudah usang.`,
  footer: { tagline: "Fakta bersama. Proyek mandiri.", registry: "JSON registri", source: "Kode di GitHub", gateway: "FM Work Gateway", snapshot: (date: string) => `Snapshot data dari ${date}` },
};

export const dictionaries: Record<Language, Dict> = { en, id };

type I18n = { language: Language; t: Dict; setLanguage: (language: Language) => void; text: (value?: Localized) => string; date: (iso: string | null) => string };
const Context = createContext<I18n | null>(null);

const initialLanguage = (): Language => (document.documentElement.getAttribute("lang") === "id" ? "id" : "en");

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setState] = useState<Language>(initialLanguage);
  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
    try { localStorage.setItem("ec.lang", language); } catch { /* storage unavailable */ }
  }, [language]);
  const setLanguage = useCallback((next: Language) => setState(next), []);
  const value = useMemo<I18n>(() => ({
    language, t: dictionaries[language], setLanguage,
    text: valueText => valueText ? (language === "id" && valueText.id ? valueText.id : valueText.en) : "",
    date: iso => iso ? new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC" : "",
  }), [language, setLanguage]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("useI18n outside I18nProvider");
  return value;
}
