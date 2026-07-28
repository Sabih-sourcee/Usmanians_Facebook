import { supabase } from "../supabase";

function safeName(file: File): string {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

export async function uploadUserFile(
  bucket: "avatars" | "post-images" | "attachments",
  userId: string,
  file: File
): Promise<{ path: string; publicUrl: string | null; error: string | null }> {
  const path = `${userId}/${safeName(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return { path: "", publicUrl: null, error: error.message };

  if (bucket === "avatars" || bucket === "post-images") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl, error: null };
  }

  const { data, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signedError) return { path, publicUrl: null, error: signedError.message };
  return { path, publicUrl: data.signedUrl, error: null };
}
