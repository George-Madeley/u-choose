import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["app/**/*.tsx"],
  project: ["app/**/*"],
  ignoreDependencies: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/github",
    "@semantic-release/npm",
    "@semantic-release/release-notes-generator",
    "conventional-changelog-conventionalcommits",
    "eslint-config-prettier",
    "@tauri-apps/api",
    "@tauri-apps/plugin-opener",
  ],
};

export default config;
