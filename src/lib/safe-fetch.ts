import http from "node:http";
import https from "node:https";
import net from "node:net";
import dns from "node:dns";
import zlib from "node:zlib";

export const MAX_BODY_BYTES = 1048576; // 1MB (1,048,576 bytes)
export const MAX_REDIRECTS = 3;
export const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds total

export interface SafeFetchOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRedirects?: number;
  maxBodyBytes?: number;
  // Test injection: strictly limited to custom DNS resolver, test CA, and test socket transport.
  // No "allowPrivateIp" or "disableTlsVerify" flags are permitted.
  dnsLookup?: (hostname: string, signal?: AbortSignal) => Promise<string[]>;
  ca?: string | Buffer | Array<string | Buffer>;
  createConnection?: (options: any, callback: (err: Error | null, stream: any) => void) => any;
}

export interface SafeFetchResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  finalUrl: string;
}

function ipv4ToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function inIpv4Cidr(ipNum: number, cidrBase: string, maskBits: number): boolean {
  const baseNum = ipv4ToLong(cidrBase);
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipNum & mask) === (baseNum & mask);
}

const BLOCKED_IPV4_RANGES: Array<[string, number]> = [
  ["0.0.0.0", 8],        // "This" network
  ["10.0.0.0", 8],       // Private
  ["100.64.0.0", 10],    // Shared Address / CGNAT
  ["127.0.0.0", 8],      // Loopback
  ["169.254.0.0", 16],   // Link-local
  ["172.16.0.0", 12],    // Private
  ["192.0.0.0", 24],     // IETF Protocol Assignments
  ["192.0.2.0", 24],     // TEST-NET-1
  ["192.88.99.0", 24],   // 6to4 Relay Anycast
  ["192.168.0.0", 16],   // Private
  ["198.18.0.0", 15],    // Benchmarking
  ["198.51.100.0", 24],  // TEST-NET-2
  ["203.0.113.0", 24],   // TEST-NET-3
  ["224.0.0.0", 4],      // Multicast
  ["240.0.0.0", 4],      // Reserved for Future Use
  ["255.255.255.255", 32] // Broadcast
];

export function isPrivateOrBlockedIPv4(ip: string): boolean {
  if (!net.isIPv4(ip)) return true;
  const num = ipv4ToLong(ip);
  return BLOCKED_IPV4_RANGES.some(([base, mask]) => inIpv4Cidr(num, base, mask));
}

export function parseIPv6(ip: string): Buffer | null {
  if (ip.includes("%") || !net.isIPv6(ip)) return null;
  let norm = ip.toLowerCase();
  const lastColon = norm.lastIndexOf(":");
  const tail = norm.slice(lastColon + 1);
  if (tail.includes(".")) {
    const parts = tail.split(".").map(Number);
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
    const hex1 = ((parts[0] << 8) | parts[1]).toString(16);
    const hex2 = ((parts[2] << 8) | parts[3]).toString(16);
    norm = norm.slice(0, lastColon + 1) + hex1 + ":" + hex2;
  }

  const halves = norm.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length > 1 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - (left.length + right.length);
  if (missing < 0) return null;
  const middle = new Array(missing).fill("0");
  const full = [...left, ...middle, ...right].map(h => parseInt(h || "0", 16));

  const buf = Buffer.alloc(16);
  for (let i = 0; i < 8; i++) {
    buf.writeUInt16BE(full[i], i * 2);
  }
  return buf;
}

/** Reject non-public IPv6, including deprecated/translation/tunnel address space.
 * Conservative policy: IPv4-mapped public addresses and ordinary 2000::/3 unicast only.
 * IANA special registry reviewed 2026-09-20; protocol assignment blocks are excluded
 * even where individual anycast exceptions are globally reachable.
 */
export function isPrivateOrBlockedIPv6(ip: string): boolean {
  const buf = parseIPv6(ip);
  if (!buf) return true;
  const mapped = buf.subarray(0, 10).every(b => b === 0) && buf[10] === 255 && buf[11] === 255;
  if (mapped) return isPrivateOrBlockedIPv4(`${buf[12]}.${buf[13]}.${buf[14]}.${buf[15]}`);
  if ((buf[0] & 0xe0) !== 0x20) return true; // excludes local, translation, compatible, multicast
  if (buf[0] === 0x20 && buf[1] === 0x01 && (buf[2] & 0xfe) === 0) return true; // 2001::/23
  if (buf[0] === 0x20 && buf[1] === 0x01 && buf[2] === 0x0d && buf[3] === 0xb8) return true;
  if (buf[0] === 0x20 && buf[1] === 0x02) return true; // 6to4
  if (buf[0] === 0x3f && buf[1] === 0xff && (buf[2] & 0xf0) === 0) return true; // 3fff::/20
  return false;
}

export function isPrivateOrBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateOrBlockedIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateOrBlockedIPv6(ip);
  return true; // Not a valid IP is treated as blocked for IP verification
}

/** Check if host is a numeric obfuscated representation (hex, octal, integer) */
export function isObfuscatedNumericHost(host: string): boolean {
  // If whole host is single integer (e.g. 2130706433)
  if (/^\d+$/.test(host)) return true;
  // If starts with 0x (hex)
  if (/^0x[0-9a-f]+$/i.test(host)) return true;
  // If has octal parts (e.g. 0177.0.0.1)
  const parts = host.split(".");
  if (parts.length > 1 && parts.some(p => /^0\d+$/.test(p) || /^0x/i.test(p))) return true;
  return false;
}

/** Validate URL syntax, scheme, credentials, port, and hostname */
export function validateUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http: and https: are allowed.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error("URL credentials (username/password) are not allowed.");
  }

  // Port validation: default or explicit 80/443 only
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    if (parsed.protocol === "http:" && portNum !== 80) {
      throw new Error(`Non-standard port ${portNum} is not permitted for HTTP (only 80).`);
    }
    if (parsed.protocol === "https:" && portNum !== 443) {
      throw new Error(`Non-standard port ${portNum} is not permitted for HTTPS (only 443).`);
    }
  }

  let hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.slice(1, -1);
  }

  if (!hostname) {
    throw new Error("Empty hostname in URL.");
  }

  // If host is a direct IP literal, validate immediately
  if (net.isIP(hostname)) {
    if (isPrivateOrBlockedIp(hostname)) {
      throw new Error(`Prohibited IP address literal: ${hostname}`);
    }
  }

  // Local/Internal domain checks
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".home")
  ) {
    throw new Error(`Prohibited local hostname: ${hostname}`);
  }

  // Single-label host without dot (e.g., intranet, devbox)
  if (!hostname.includes(".") && !net.isIP(hostname)) {
    throw new Error(`Single-label internal hostname is not permitted: ${hostname}`);
  }

  // Obfuscated IP check
  if (isObfuscatedNumericHost(hostname)) {
    throw new Error(`Obfuscated or raw numeric IP hostname is not permitted: ${hostname}`);
  }

  return parsed;
}

/** Await a dependency without allowing a late result to resume a cancelled fetch. */
function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => { signal.removeEventListener("abort", onAbort); reject(signal.reason); };
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(value => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) reject(signal.reason); else resolve(value);
    }, err => { signal.removeEventListener("abort", onAbort); reject(err); });
    if (signal.aborted) onAbort();
  });
}

async function resolvePublicHost(host: string, signal: AbortSignal): Promise<string[]> {
  // A resolver per fetch allows cancellation without cancelling unrelated requests.
  const resolver = new dns.promises.Resolver();
  const cancel = () => resolver.cancel();
  signal.throwIfAborted();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const results = await abortable(Promise.allSettled([resolver.resolve4(host), resolver.resolve6(host)]), signal);
    const addresses: string[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") addresses.push(...result.value);
      else if (!["ENODATA", "ENOTFOUND"].includes(result.reason?.code)) throw result.reason;
    }
    return addresses;
  } finally {
    signal.removeEventListener("abort", cancel);
    resolver.cancel();
  }
}

/** Bounded, cancellable GET. The same deadline covers DNS and every redirect. */
export async function safeFetch(targetUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const maxBodyBytes = options.maxBodyBytes ?? MAX_BODY_BYTES;
  for (const [value, ceiling, minimum] of [[timeoutMs, DEFAULT_TIMEOUT_MS, 1], [maxRedirects, MAX_REDIRECTS, 0], [maxBodyBytes, MAX_BODY_BYTES, 1]]) {
    if (!Number.isInteger(value) || value < minimum || value > ceiling) throw new Error("Invalid safe-fetch limit");
  }
  const controller = new AbortController();
  const signal = controller.signal;
  const onAbort = () => controller.abort(new Error("Request aborted by caller."));
  options.signal?.addEventListener("abort", onAbort, { once: true });
  if (options.signal?.aborted) onAbort();
  const timeoutError = () => new Error(`Overall request timeout of ${timeoutMs}ms exceeded.`);
  const deadline = Date.now() + timeoutMs;
  const timer = setTimeout(() => controller.abort(timeoutError()), timeoutMs);
  const visited = new Set<string>();
  try {
    let next = targetUrl;
    for (let redirects = 0; ; redirects++) {
      signal.throwIfAborted();
      if (Date.now() >= deadline) throw timeoutError();
      if (redirects > maxRedirects) throw new Error(`Maximum redirect limit of ${maxRedirects} exceeded.`);
      const url = validateUrl(next);
      url.hash = ""; // Fragments are never sent to the server.
      if (visited.has(url.href)) throw new Error(`Redirect loop detected: ${url.href}`);
      visited.add(url.href);
      const host = url.hostname.replace(/^\[|\]$/g, "");
      const ips = net.isIP(host) ? [host] : await abortable(
        options.dnsLookup ? options.dnsLookup(host, signal) : resolvePublicHost(host, signal), signal);
      signal.throwIfAborted();
      if (Date.now() >= deadline) throw timeoutError();
      if (!ips.length) throw new Error(`DNS resolution failed for hostname: ${host}`);
      for (const ip of ips) if (isPrivateOrBlockedIp(ip)) throw new Error(`Prohibited IP address (${ip}) resolved for host: ${host}`);
      const result = await requestHop(url, host, ips[0], redirects);
      signal.throwIfAborted();
      if (Date.now() >= deadline) throw timeoutError();
      if ("redirect" in result) next = new URL(result.redirect, url).href;
      else return result;
    }
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }

  function requestHop(url: URL, host: string, pinnedIp: string, redirects: number): Promise<SafeFetchResult | { redirect: string }> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let req: http.ClientRequest | undefined;
      let response: http.IncomingMessage | undefined;
      let decompressor: zlib.Gunzip | zlib.Inflate | undefined;
      let agent: http.Agent | undefined;
      const onHopAbort = () => finish(signal.reason);
      const cleanup = () => {
        signal.removeEventListener("abort", onHopAbort);
        decompressor?.destroy();
        response?.destroy();
        req?.destroy();
        agent?.destroy();
      };
      const finish = (error?: Error, result?: SafeFetchResult | { redirect: string }) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error); else resolve(result!);
      };
      signal.addEventListener("abort", onHopAbort, { once: true });
      if (signal.aborted) { onHopAbort(); return; }
      try {
        const secure = url.protocol === "https:";
        const lookup = (_host: string, opts: any, callback: any) => {
          const family = net.isIP(pinnedIp);
          if (opts?.all) callback(null, [{ address: pinnedIp, family }]);
          else callback(null, pinnedIp, family);
        };
        const agentOptions = { keepAlive: false, maxSockets: 1, lookup, ca: options.ca };
        agent = secure ? new https.Agent(agentOptions) : new http.Agent(agentOptions);
        if (options.createConnection) agent.createConnection = options.createConnection;
        const headers: Record<string, string> = {
          "User-Agent": "GEOExplorerBot/1.0",
          "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9",
          "Accept-Encoding": "gzip, deflate",
          "Host": url.host,
        };
        // Host, encoding, connection framing and credentials are owned by this function.
        if (redirects === 0) for (const [key, value] of Object.entries(options.headers || {})) {
          if (["accept", "accept-language", "user-agent"].includes(key.toLowerCase())) headers[key.toLowerCase()] = value;
        }
        req = (secure ? https : http).request({
          protocol: url.protocol, hostname: host, port: secure ? 443 : 80,
          path: url.pathname + url.search, method: "GET", headers, agent,
          rejectUnauthorized: true,
          ...(secure && !net.isIP(host) ? { servername: host } : {}),
        }, res => {
          response = res;
          res.on("error", err => finish(err));
          res.on("aborted", () => finish(new Error("Response stream aborted")));
          if (settled) { res.destroy(); return; }
          const status = res.statusCode || 0;
          if ([301, 302, 303, 307, 308].includes(status)) {
            if (!res.headers.location) finish(new Error(`Redirect response (${status}) missing Location header.`));
            else finish(undefined, { redirect: res.headers.location });
            return;
          }
          const encoding = (res.headers["content-encoding"] || "").trim().toLowerCase();
          if (encoding && !["identity", "gzip", "deflate"].includes(encoding)) {
            finish(new Error(`Unsupported Content-Encoding: ${encoding}`)); return;
          }
          const length = Number(res.headers["content-length"]);
          if (Number.isFinite(length) && length > maxBodyBytes) {
            finish(new Error(`Response body exceeded maximum allowed limit of ${maxBodyBytes} bytes.`)); return;
          }
          let wireBytes = 0, outputBytes = 0;
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => {
            if (settled) return;
            wireBytes += chunk.length;
            if (wireBytes > maxBodyBytes) finish(new Error(`Response body exceeded maximum allowed limit of ${maxBodyBytes} bytes (wire).`));
          });
          if (encoding === "gzip") decompressor = zlib.createGunzip();
          else if (encoding === "deflate") decompressor = zlib.createInflate();
          const stream = decompressor || res;
          stream.on("error", err => finish(new Error(`Decompression or stream error: ${err.message}`)));
          stream.on("data", (chunk: Buffer) => {
            if (settled) return;
            outputBytes += chunk.length;
            if (outputBytes > maxBodyBytes) finish(new Error(`Response body exceeded maximum allowed limit of ${maxBodyBytes} bytes.`));
            else chunks.push(chunk);
          });
          stream.on("end", () => {
            if (settled) return;
            const responseHeaders: Record<string, string> = {};
            for (const [key, value] of Object.entries(res.headers)) {
              if (value !== undefined) responseHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
            }
            finish(undefined, { status, statusText: res.statusMessage || "", headers: responseHeaders,
              body: Buffer.concat(chunks).toString("utf8"), finalUrl: url.href });
          });
          if (decompressor) res.pipe(decompressor);
        });
        req.on("error", err => finish(new Error(`HTTP request failed: ${err.message}`)));
        req.end();
      } catch (error) { finish(error instanceof Error ? error : new Error(String(error))); }
    });
  }
}
