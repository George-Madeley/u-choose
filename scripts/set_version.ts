#!/usr/bin/env node
/**
 * set-json-version.ts
 *
 * Usage:
 *   ts-node set-json-version.ts path/to/file.json "1.2.3"
 *   # or build with tsc and run: node dist/set-json-version.js file.json 1.2.3
 *
 * Description:
 * - Accepts two positional args: a JSON file path and a version string.
 * - Ensures the top-level JSON value is an object, creates/updates the "version" key
 *   on the top-level object and writes the file back atomically.
 *
 * Exit codes:
 * 0 - success
 * 1 - general / unexpected error
 * 2 - usage / argument error
 * 3 - file not found / permissions error
 * 4 - invalid JSON or top-level not an object
 */

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

async function run(): Promise<number> {
  const argv = yargs(hideBin(process.argv))
    .usage("$0 <jsonFile> <version>")
    .demandCommand(2)
    .help()
    .parseSync();

  const positional = argv._ as string[];
  if (positional.length < 2) {
    console.error("Error: missing arguments. Expected: <jsonFile> <version>");
    return 2;
  }

  const jsonFile = positional[0];
  const version = positional[1];

  // Validate file exists and is a regular file
  try {
    const stats = await fs.stat(jsonFile);
    if (!stats.isFile()) {
      console.error(`Error: '${jsonFile}' is not a regular file.`);
      return 3;
    }
  } catch (err) {
    console.error(
      `Error: cannot access file '${jsonFile}': ${(err as Error).message}`
    );
    return 3;
  }

  // Check read/write permissions
  try {
    await fs.access(jsonFile, fsSync.constants.R_OK | fsSync.constants.W_OK);
  } catch (err) {
    console.error(
      `Error: insufficient permissions to read/write '${jsonFile}': ${(err as Error).message}`
    );
    return 3;
  }

  // Read and parse JSON
  let raw: string;
  try {
    raw = await fs.readFile(jsonFile, "utf8");
  } catch (err) {
    console.error(
      `Error: failed to read '${jsonFile}': ${(err as Error).message}`
    );
    return 3;
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(
      `Error: invalid JSON in '${jsonFile}': ${(err as Error).message}`
    );
    return 4;
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    const t =
      data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
    console.error(`Error: top-level JSON is a '${t}', expected an object.`);
    return 4;
  }

  // TypeScript type narrowing
  const obj = data as Record<string, unknown>;
  obj["version"] = version;

  // Write atomically: write to temporary file in same directory then rename
  const dir = path.dirname(jsonFile) || ".";
  const tmpName = `.set-json-version.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  const tmpPath = path.join(dir, tmpName);

  const out = JSON.stringify(obj, null, 2) + "\n";

  try {
    await fs.writeFile(tmpPath, out, { encoding: "utf8", mode: 0o666 });
    await fs.rename(tmpPath, jsonFile);
  } catch (err) {
    // Attempt to remove tmp file if it exists
    try {
      await fs.unlink(tmpPath);
    } catch {
      console.error(`Could not unlink file ${tmpPath}`);
      return 3;
    }
    console.error(
      `Error: failed to write updated JSON to '${jsonFile}': ${(err as Error).message}`
    );
    return 1;
  }

  console.log(`Updated '${jsonFile}' -> version = ${version}`);
  return 0;
}

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
