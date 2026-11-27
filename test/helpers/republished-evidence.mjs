// Evidence values that were published and later re-approved on purpose. Historical hash pins restore these exact prior values
// before comparing, which proves that nothing else in the pinned slice changed.
//
// EC-W7 (2026-11-22): canonical thumbnails were added for CareerLens, FM DevTools, FM Monorepo, FM Projects, FM Studios, FM Tools and
// Playground (screenshots of their public sites) and Ecosystem Skills' thumbnail was refreshed. The thumbnail path is bound into the
// source facts, and Gateway's presentation digest binds the artwork bytes, so the official review helpers re-issued exactly these.
export const ecW7Grants = Object.freeze({
  careerLens: { fingerprint: "sha256:798706accadf322112372ce7d860d363b7017311a7ad086b58b75fb127409838", presentationFingerprint: "sha256:e7bcdf9d1332cb49a018f87ce89b9459668f099698403c0a4bc458ac4ac68896" },
  ecosystemSkills: { presentationFingerprint: "sha256:e7018a017f1e4cbc02d01a859815927fd35b4cc2c62be61d6dd90c7d83eb1a1b" },
  devtools: { fingerprint: "sha256:f22fc52ccf5517dd625fb39bb1ff1d74032b9de8f6b40ea1177e122b93507184", presentationFingerprint: "sha256:53c8ef6ec909dccec9f51e81d8abecb758ff23a92d5f8a6d63d3e1fdab460748" },
  fmMonorepo: { fingerprint: "sha256:db5c929fd51f1e5c8dc32b11afbd728a7d523a54f034a78082c88874d3c6effd", presentationFingerprint: "sha256:8995c45cc76b57f9657d7514b147ef9764f7ab81af71e60defb478db4a743005" },
  projects: { fingerprint: "sha256:2b7c598a1a85e6bd0297ca230bdc3fb63c2969e763972f000a9f6c8e5a7578bc", presentationFingerprint: "sha256:918b5a1d94eba97a36b5bcb0f47313fd0ffa6b3e2af56623d52e9581d611305f" },
  tools: { fingerprint: "sha256:025166a948f9d8280cb8baa565e67dc76d74e794ce3b23cd1fa4868117e2856a", presentationFingerprint: "sha256:3069eff5cfa5c1676f3dbfe698f70bbb22c8d74b022ccbcba055eca8bda3c6c4" },
  playground: { fingerprint: "sha256:560e418bff687bcc8dd6c2200986997e4de4733582074782f99c9c0a1f29f941", presentationFingerprint: "sha256:70dd9a8ea95c8dc8195a8b4171a9afc7238507cb3b7bc916bbdd2281eb6c5d81" },
  fmStudios: { fingerprint: "sha256:c68d573bbf2c1f7ec25e42ec183c70a0912560935ed02d004a11692592400e19", presentationFingerprint: "sha256:882b537d2114464cf29f16edaba4571e9d94d17043ddd811ff452b792a584ff9" },
});
export const ecW7Eligibility = Object.freeze({ fmStudios: "sha256:f8bc93dd118003819f5880d0545a1515cf880825a9ca80c353a9be37e7c1f51b" });

// Creative Museum (2026-11-22): Ecosystem Assets' registry description changed from "... a public Asset Studio website." to
// "... a public Creative Museum website." (EN and ID). Gateway's presentation digest binds that description, so the official review
// path (Gateway's catalogPresentations/artworkDigest with scripts/review-showcase.mjs) re-issued exactly this one presentation
// fingerprint. The source fingerprint is unchanged, and the artwork bytes are unchanged.
export const creativeMuseumGrant = Object.freeze({
  id: "ecosystemAssets",
  before: "sha256:ac419d97b5c996e076a4be073ef2f63c4200d82268a773f7ac0edccea30e848c",
  after: "sha256:571890398dcf89c02d599f92a9b1a626317eb18850feb7325eb57bfaf90956bd",
});

// EC-W8 (2026-11-22): the Ecosystem Config and Ecosystem Assets canonical thumbnails were replaced with captures of their redesigned public
// sites (Living Blueprint Overview; Creative Museum entrance). The thumbnail path is unchanged, so source fingerprints and eligibility are
// unchanged; the official review path re-issued exactly these two presentation fingerprints.
export const ecW8Grants = Object.freeze({
  configEcosystem: { before: "sha256:656c117ea0e7c289e4d1c8f2f93f585880e4479d204c0dcdddbb3b5333faab52", after: "sha256:4b782730a05dce43a3b617d5cb339e35d2281d4e99d2b472642c73e56b0b0d32" },
  ecosystemAssets: { before: creativeMuseumGrant.after, after: "sha256:abe5c70e4ab516a3269c17293cf25fe0c7ea3853cacc2c2763e8bf998cdc6479" },
});

/** Restore the EC-W7 prior values on project grants (other grants pass through untouched). */
export const beforeEcW7 = grants => beforeEcW92(grants).map(grant => grant.kind === "project" && Object.hasOwn(ecW7Grants, grant.id) ? { ...grant, ...ecW7Grants[grant.id] } : grant);

// EC-W9 (2026-11-28): ten implemented projects were approved for Portfolio and A–Z. Forgebox moved from Concepts to a hidden
// project (same id), so its concept membership, eligibility, grant and title-only Concepts grant were retired; Kenali Academy's
// description changed, which re-approved only its presentation fingerprint. These exact prior values let historical pins and the
// concept-mechanism tests rebuild the manifests as published at revision 08e5238.
export const ecW9Added = Object.freeze(["fmAuth", "fmMail", "fmLogs", "journigo", "zentralynk", "reelfrym", "relyxee", "forgebox", "ohBabyGrow", "linstem"]);
export const ecW9KenaliGrant = Object.freeze({ before: "sha256:783916f1bf08f7ad3af44252068c628d44e63379a33289338c00ff290190bb06", after: "sha256:7e84e81c9114b7ad0c7a599364e12ac38747ff967937eaa3bc9fc689807a3372" });
const forgeboxConcept = {"id": "forgebox", "title": "Forgebox", "kind": "concept", "order": 10, "status": "planned", "destination": "tools", "description": {"en": "A planned creative sandbox for building 3D worlds and designing playable game experiences.", "id": "Sandbox kreatif yang direncanakan untuk membangun dunia 3D dan merancang pengalaman permainan yang dapat dimainkan."}};
const forgeboxTitleGrant = {"id": "forgebox", "fields": ["title"], "fingerprints": {"fields": {"title": "sha256:af534a918ea0fdfa392c6c267c640288d5e9a978fbc10d49e7cda86f14559ef2"}}};
const forgeboxSlots = {
  showcases: [47, {"kind": "concept", "id": "forgebox"}],
  showcaseEligibility: [10, {"kind": "concept", "id": "forgebox", "surface": "az", "fingerprint": "sha256:145f306d0a24a9723cfe773ab57c20616d56f9d5ddf614c30f29aee9034819fb"}],
  showcasePublication: [47, {"kind": "concept", "id": "forgebox", "surface": "az", "fields": ["title", "description.en", "description.id", "status"], "fingerprint": "sha256:a29d71c50532c410f3390fa3ec7ee4243a99dab088af3948786d0eb0c6943e1a", "presentationFingerprint": "sha256:a5d383e53980effe79980f742521129500100e6922b6d44f324c8afd1eb6078a"}],
};

/** One manifest as it was before EC-W9: the ten additions removed, Forgebox's concept entry back in its slot, Kenali's value restored. */
export function manifestBeforeEcW9(key, list) {
  const rest = list.filter(item => !(item.kind === "project" && ecW9Added.includes(item.id)));
  const [index, entry] = forgeboxSlots[key];
  rest.splice(index, 0, structuredClone(entry));
  return key === "showcasePublication"
    ? rest.map(item => item.id === "kenali" ? { ...item, presentationFingerprint: ecW9KenaliGrant.before } : item) : rest;
}

/** The whole configuration with Forgebox still a concept; the other new project records stay (hidden and unselected). */
export function beforeEcW9(config) {
  const projects = { ...config.projects };
  delete projects.forgebox;
  return { ...config, projects,
    // Forgebox had no project, so no link decision either.
    websiteLinks: (config.websiteLinks ?? []).filter(entry => entry.id !== "forgebox"),
    concepts: [structuredClone(forgeboxConcept), ...config.concepts],
    conceptsPublication: [structuredClone(forgeboxTitleGrant)],
    showcases: manifestBeforeEcW9("showcases", config.showcases),
    showcaseEligibility: manifestBeforeEcW9("showcaseEligibility", config.showcaseEligibility),
    showcasePublication: manifestBeforeEcW9("showcasePublication", config.showcasePublication) };
}

// EC-W9.1 (2026-11-28): the Keranjoo, Urusaha and Yunivisi links were released once their hostnames resolved. Their
// presentation now carries the link, so the official review path re-approved exactly these presentation fingerprints.
export const ecW91Grants = Object.freeze({
  keranjoo: "sha256:482b80da50b729549901126dddb390f5156b0d20fdf9cfa54bfd68b26f01dc86",
  urusaha: "sha256:8c8ebb32f54fcb52727b68422f2553bc1389c7bcf4af392bf51b5f87ebedae6d",
  yunivisi: "sha256:19d523c04e2bf29811227f1c8f0ffde98d2a594d6ab88b90d0734f5c28bdd970",
});
/** Restore the pre-EC-W9.1 presentation values (other grants pass through untouched). */
export const beforeEcW91 = grants => beforeEcW92(grants).map(grant => grant.kind === "project" && Object.hasOwn(ecW91Grants, grant.id) ? { ...grant, presentationFingerprint: ecW91Grants[grant.id] } : grant);

// EC-W9.2 (2026-11-28): the owner approved the Momee, Quibiq and FM Watch website links, and FM Watch's thumbnail was recaptured
// with its pairing code masked (same path, so no source fingerprint changed). Exactly these presentation fingerprints were re-approved.
const ecW92Grants = Object.freeze({
  watch: "sha256:b6d53d054a66aef86ce6d155511b9709ecfb734f59421c0aa80b50415ec70d2f",
  momee: "sha256:a36de7604f1b7440cd2e9f3040c2e5b2a64567365d6c75cf8071258dc3d06d6d",
  quibiq: "sha256:f95333b3489b33fb44fbb082dded87cf4ce0238774eba34820567018b79acd0c",
});
/** Restore the pre-EC-W9.2 presentation values (other grants pass through untouched). */
export function beforeEcW92(grants) {
  return beforeEcW93(grants).map(grant => grant.kind === "project" && Object.hasOwn(ecW92Grants, grant.id) ? { ...grant, presentationFingerprint: ecW92Grants[grant.id] } : grant);
}

// EC-W9.3 (2026-11-28): Wedding Vendor Scraper gained its owner-confirmed website and a thumbnail of that landing page. Both are
// source facts, so its eligibility decision and grant were re-issued with the official helpers; nothing else changed.
function beforeEcW93(grants) {
  return grants.map(grant => grant.kind === "project" && grant.id === "weddingVendorScraper" ? { ...grant,
    fingerprint: "sha256:3c0f6998458ef617b3379a932667c4600bac1ee93a6ddad775a41a89b7d46c4f",
    presentationFingerprint: "sha256:09a72c4f53b2917294dc6c991de24cd6a74af822105dec59afd128748536c37b" } : grant);
}
export const beforeEcW93Eligibility = decisions => decisions.map(decision => decision.id === "weddingVendorScraper"
  ? { ...decision, fingerprint: "sha256:c6c1083fde3364f82ac2f85964ba16f0e570b5205dff0bfa50e7c066305ff321" } : decision);
