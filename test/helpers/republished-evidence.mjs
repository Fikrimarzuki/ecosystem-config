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
export const beforeEcW7 = grants => grants.map(grant => grant.kind === "project" && Object.hasOwn(ecW7Grants, grant.id) ? { ...grant, ...ecW7Grants[grant.id] } : grant);
