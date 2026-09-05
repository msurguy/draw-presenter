import path from "node:path";

// Small HTTP helpers shared by the admin + editor middleware.

export const ID_RE = /^[\w-]+$/;

export const safeId = (id) => (typeof id === "string" && ID_RE.test(id) ? id : null);

export const insideDir = (dir, p) => {
  const resolved = path.resolve(p);
  return resolved === dir || resolved.startsWith(dir + path.sep);
};

export const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

export const readJson = async (req) => {
  const buf = await readBody(req);
  if (!buf.length) return {};
  return JSON.parse(buf.toString("utf8"));
};

/** Error carrying an HTTP status; thrown by AST/patch code, mapped by routes. */
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
