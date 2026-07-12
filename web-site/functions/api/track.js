// Cloudflare Pages Function: /api/track
// Receives the visit beacon from the static site (same-origin, always stable),
// enriches it with the visitor's real IP + country (available at the CF edge),
// and forwards it to the analytics server. When the server's tunnel URL
// rotates, update ONE Pages env var (TRACK_UPSTREAM) — the site never changes.

const DEFAULT_UPSTREAM = "https://comes-reforms-preferences-anytime.trycloudflare.com";

export async function onRequestPost(context) {
    const { request, env } = context;
    const upstream = ((env && env.TRACK_UPSTREAM) || DEFAULT_UPSTREAM).replace(/\/+$/, "");

    let body = "{}";
    try { body = await request.text(); } catch (_) {}

    const cf = request.cf || {};
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const country = cf.country || request.headers.get("CF-IPCountry") || "";
    const city = cf.city || "";
    const region = cf.region || "";
    const org = cf.asOrganization || "";

    // Forward in the background so the visitor's request returns instantly.
    context.waitUntil((async () => {
        try {
            await fetch(upstream + "/site/track", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": request.headers.get("User-Agent") || "",
                    "X-Visitor-Ip": ip,
                    "X-Visitor-Country": country,
                    "X-Visitor-City": city,
                    "X-Visitor-Region": region,
                    "X-Visitor-Org": org,
                    "Origin": "https://shamsiyev.uz",
                },
                body,
            });
        } catch (_) {}
    })());

    return new Response(null, { status: 204 });
}

export function onRequestOptions() {
    return new Response(null, { status: 204 });
}
