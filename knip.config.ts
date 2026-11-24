import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["frontend/src/**/*.tsx"],
  project: ["frontend/src/**/*"],
  "react-router": { config: ["frontend/react-router.config.ts"] },
  vite: { config: ["frontend/vite.config.ts"] },
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
