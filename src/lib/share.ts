export async function shareText(title: string, text: string): Promise<{ ok: boolean; message: string }> {
  const payload = { title, text, url: typeof window !== "undefined" ? window.location.href : "" };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return { ok: true, message: "Shared" };
    } catch {
      // fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${payload.url}`);
    return { ok: true, message: "Link copied" };
  } catch {
    return { ok: false, message: "Unable to share" };
  }
}
