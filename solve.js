const KEEP = 0;
const DELETE = 1;
const INSERT = 2;
const CONTEXT = 3;
const SENT_A = 0x7fffffff;
const SENT_B = 0x7ffffffe;

function tokenize(text, map, sentinel) {
  const parts = text.split("\n");
  const last = parts.length - 1;
  const hasTrailingNewline = text.endsWith("\n");
  const lineCount = (text === "") ? 0 : (hasTrailingNewline ? last : last + 1);
  
  const ids = new Int32Array(lineCount + 1);
  ids[lineCount] = sentinel;
  const lines = new Array(lineCount);
  
  let idx = 0;
  for (let i = 0; i <= last; i++) {
    const part = parts[i];
    if (i === last && part === "") {
      break;
    }
    const isLast = (i === last && !hasTrailingNewline);
    const lineStr = part + (isLast ? "" : "\n");
    lines[idx] = lineStr;
    
    let partId = map.get(part);
    if (partId === undefined) {
      partId = map.size;
      map.set(part, partId);
    }
    ids[idx] = partId * 2 + (isLast ? 1 : 0);
    idx++;
  }
  return { ids, lines };
}

function editRuns(a, b, N, M) {
  if (N === 0) {
    if (M === 0) return [[], []];
    return [[INSERT], [M]];
  }
  if (M === 0) {
    return [[DELETE], [N]];
  }

  let x0 = 0;
  let y0 = 0;
  while (a[x0] === b[y0]) {
    x0++;
    y0++;
  }
  if (x0 === N && y0 === M) {
    if (x0 > 0) return [[KEEP], [x0]];
    return [[], []];
  }

  const maxD = N + M;
  const levels = new Array(maxD + 1);
  levels[0] = new Int32Array([x0]);

  let DEnd = 0;
  let kEnd = 0;

  for (let d = 1; d <= maxD; d++) {
    const vc = new Int32Array(2 * d + 1);
    const vp = levels[d - 1];
    let found = false;

    for (let k = -d; k <= d; k += 2) {
      const j = k + d;
      let xx = -1;
      let yy = -1;

      if (k === -d) {
        const vi = vp[0];
        if (vi >= 0 && vi + d - 1 < M) {
          xx = vi;
          yy = xx + d;
        }
      } else if (k === d) {
        const vd = vp[2 * d - 2];
        if (vd >= 0 && vd < N) {
          xx = vd + 1;
          yy = xx - d;
        }
      } else {
        const vd = vp[j - 2];
        const vi = vp[j];
        const byDel = (vd >= 0 && vd < N) ? vd + 1 : -2;
        const byIns = (vi >= 0 && vi - k - 1 < M) ? vi : -2;

        if (byDel !== -2 || byIns !== -2) {
          if (byDel >= byIns) {
            xx = byDel;
          } else {
            xx = byIns;
          }
          yy = xx - k;
        }
      }

      if (xx >= 0) {
        while (a[xx] === b[yy]) {
          xx++;
          yy++;
        }
        vc[j] = xx;
        if (xx === N && yy === M) {
          DEnd = d;
          kEnd = k;
          found = true;
          break;
        }
      } else {
        vc[j] = -1;
      }
    }

    levels[d] = vc;
    if (found) break;
  }

  let currK = kEnd;
  const rawKinds = [];
  const rawCounts = [];

  for (let d = DEnd; d >= 1; d--) {
    const vc = levels[d];
    const vp2 = levels[d - 1];
    const xEnd = vc[currK + d];
    let fromDel = false;
    let xStep = 0;

    if (currK === -d) {
      fromDel = false;
      xStep = vp2[0];
    } else if (currK === d) {
      fromDel = true;
      xStep = vp2[2 * d - 2] + 1;
    } else {
      const vd = vp2[currK + d - 2];
      const vi = vp2[currK + d];
      const byDel = (vd >= 0 && vd < N) ? vd + 1 : -2;
      const byIns = (vi >= 0 && vi - currK - 1 < M) ? vi : -2;
      fromDel = (byDel >= byIns);
      xStep = fromDel ? (vd + 1) : vi;
    }

    const snake = xEnd - xStep;
    if (snake > 0) {
      rawKinds.push(KEEP);
      rawCounts.push(snake);
    }
    rawKinds.push(fromDel ? DELETE : INSERT);
    rawCounts.push(1);

    currK = fromDel ? (currK - 1) : (currK + 1);
  }

  const initialSnake = levels[0][0];
  if (initialSnake > 0) {
    rawKinds.push(KEEP);
    rawCounts.push(initialSnake);
  }

  const kinds = [];
  const counts = [];
  for (let i = rawKinds.length - 1; i >= 0; i--) {
    const k = rawKinds[i];
    const c = rawCounts[i];
    if (kinds.length > 0 && kinds[kinds.length - 1] === k) {
      counts[counts.length - 1] += c;
    } else {
      kinds.push(k);
      counts.push(c);
    }
  }

  return [kinds, counts];
}
function written(op, line) {
  return line.endsWith("\n") ? op + line : op + line + "\n%\n";
}

export function run(input) {
  const map = new Map();
  const SENT_A = 0x7fffffff;
  const SENT_B = 0x7ffffffe;

  const { ids: aIds, lines: aLines } = tokenize(input.old, map, SENT_A);
  const { ids: bIds, lines: bLines } = tokenize(input.new, map, SENT_B);

  const n = aLines.length;
  const m = bLines.length;

  let prefix = 0;
  while (aIds[prefix] === bIds[prefix]) prefix++;

  let suffix = 0;
  while (
    suffix < n - prefix &&
    suffix < m - prefix &&
    aIds[n - 1 - suffix] === bIds[m - 1 - suffix]
  ) {
    suffix++;
  }

  const midN = n - prefix - suffix;
  const midM = m - prefix - suffix;

  let middleRuns;
  if (midN === 0 && midM === 0) {
    middleRuns = [[], []];
  } else {
    const am = new Int32Array(midN + 1);
    for (let i = 0; i < midN; i++) {
      am[i] = aIds[prefix + i];
    }
    am[midN] = SENT_A;

    const bm = new Int32Array(midM + 1);
    for (let i = 0; i < midM; i++) {
      bm[i] = bIds[prefix + i];
    }
    bm[midM] = SENT_B;

    middleRuns = editRuns(am, bm, midN, midM);
  }

  let runs = [];
  if (prefix > 0) {
    runs.push([0, prefix]);
  }
  for (let i = 0; i < middleRuns[0].length; i++) {
    runs.push([middleRuns[0][i], middleRuns[1][i]]);
  }
  if (suffix > 0) {
    runs.push([0, suffix]);
  }

  const merged = [];
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (r[1] === 0) continue;
    if (merged.length > 0 && merged[merged.length - 1][0] === r[0]) {
      merged[merged.length - 1][1] += r[1];
    } else {
      merged.push([r[0], r[1]]);
    }
  }
  runs = merged;

  let o = 0;
  let p = 0;
  let deleted = 0;
  let inserted = 0;
  const changes = [];

  for (let i = 0; i < runs.length; i++) {
    const kind = runs[i][0];
    const count = runs[i][1];
    if (kind === 0) {
      o += count;
      p += count;
    } else if (kind === 1) {
      deleted += count;
      let c = changes[changes.length - 1];
      if (!c || c.o + c.dels !== o || c.p + c.ins !== p) {
        c = { o, p, dels: 0, ins: 0 };
        changes.push(c);
      }
      c.dels += count;
      o += count;
    } else if (kind === 2) {
      inserted += count;
      let c = changes[changes.length - 1];
      if (!c || c.o + c.dels !== o || c.p + c.ins !== p) {
        c = { o, p, dels: 0, ins: 0 };
        changes.push(c);
      }
      c.ins += count;
      p += count;
    }
  }

  if (changes.length === 0) {
    return "makefun-diff/1 old=" + n + " new=" + m + " hunks=0 deleted=0 inserted=0\n";
  }

  const hunks = [];
  let currentHunk = [changes[0]];
  for (let i = 1; i < changes.length; i++) {
    const prev = currentHunk[currentHunk.length - 1];
    const curr = changes[i];
    if (curr.o - (prev.o + prev.dels) <= 6) {
      currentHunk.push(curr);
    } else {
      hunks.push(currentHunk);
      currentHunk = [curr];
    }
  }
  hunks.push(currentHunk);

  let out = "makefun-diff/1 old=" + n + " new=" + m + " hunks=" + hunks.length + " deleted=" + deleted + " inserted=" + inserted + "\n";

  for (let h = 0; h < hunks.length; h++) {
    const hunk = hunks[h];
    const first = hunk[0];
    const last = hunk[hunk.length - 1];

    const oldStart = Math.max(0, first.o - 3);
    const newStart = first.p - (first.o - oldStart);
    const after = Math.min(3, n - (last.o + last.dels));
    const oldEnd = last.o + last.dels + after;
    const newEnd = last.p + last.ins + after;

    out += "@ " + (oldStart + 1) + " " + (oldEnd - oldStart) + " " + (newStart + 1) + " " + (newEnd - newStart) + "\n";

    let cursor = oldStart;
    for (let i = 0; i < hunk.length; i++) {
      const c = hunk[i];
      while (cursor < c.o) {
        out += written("=", aLines[cursor]);
        cursor++;
      }
      for (let j = 0; j < c.dels; j++) {
        out += written("-", aLines[c.o + j]);
      }
      for (let j = 0; j < c.ins; j++) {
        out += written("+", bLines[c.p + j]);
      }
      cursor = c.o + c.dels;
    }
    while (cursor < oldEnd) {
      out += written("=", aLines[cursor]);
      cursor++;
    }
  }

  return out;
}