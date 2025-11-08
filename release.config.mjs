/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ["release", { name: "develop", prerelease: true }],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalCommits",
        releaseRules: [
          { type: "break", scope: "*", release: "major" },
          { type: "feat", scope: "", release: "minor" },
          { type: "fix", scope: "", release: "patch" },
          { type: "revert", scope: "", release: "patch" },
          { type: "docs", scope: "", release: "patch" },
          { type: "style", scope: "", release: "patch" },
          { type: "chore", scope: "", release: "patch" },
          { type: "refactor", scope: "", release: "patch" },
          { type: "test", scope: "", release: "patch" },
          { type: "build", scope: "", release: "patch" },
          { type: "ci", scope: "", release: "patch" },
          { type: "improvement", scope: "*", release: "patch" },
        ],
        defaultReleaseType: "patch",
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalCommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Features ✨" },
            { type: "fix", section: "Fixes 🐛" },
            { type: "perf", section: "Performance Improvements 🚀" },
            { type: "revert", section: "Reverts 🗑" },
            { type: "docs", section: "Documentation 📚", hidden: false },
            { type: "style", section: "Styles 💎", hidden: false },
            { type: "chore", section: "Chores ♻️", hidden: false },
            { type: "refactor", section: "Refactors 📦", hidden: false },
            { type: "test", section: "Tests 🚨", hidden: false },
            { type: "build", section: "Build 🛠", hidden: false },
            { type: "ci", section: "CI/CD ⚙️", hidden: false },
            { type: "improvement", section: "Improvements ⚡️", hidden: false },
          ],
        },
      },
    ],
    "@semantic-release/changelog",
    [
      "@semantic-release/exec",
      {
        verifyReleaseCmd:
          "npm run set:version ./package.json ${nextRelease.version} && npm run set:version ./src-tauri/tauri.conf.json ${nextRelease.version}",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          {
            path: "./artifacts/bundle-ubuntu-22.04-default/bundle/appimage/u-choose_*_amd64.AppImage",
          },
          {
            path: "./artifacts/bundle-ubuntu-22.04-default/bundle/deb/u-choose_*_amd64.deb",
          },
          {
            path: "./artifacts/bundle-ubuntu-22.04-default/bundle/rpm/u-choose-*-1.x86_64.rpm",
          },
          {
            path: "./artifacts/bundle-windows-latest-default/bundle/msi/u-choose_*_x64_en-US.msi",
          },
          {
            path: "./artifacts/bundle-windows-latest-default/bundle/nsis/u-choose_*_x64-setup.exe",
          },
        ],
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message:
          "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}",
      },
    ],
  ],
};
