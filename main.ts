import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setFlagsFromString } from "node:v8";

setFlagsFromString("--no-incremental-marking");
const { run } = await import("./solve.js");

const inputDir = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const casesContent = readFileSync(join(inputDir, "cases.json"), "utf8");
const cases = JSON.parse(casesContent);

const answers = [];
for (const c of cases) {
  answers.push(run(c.input));
}

writeFileSync(join(outputDir, "answers.json"), JSON.stringify(answers));
