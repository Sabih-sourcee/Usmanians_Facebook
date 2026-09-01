import { supabase } from "../supabase";

export async function isStudentCidAvailable(cid: string): Promise<boolean | null> {
  const trimmed = cid.trim();
  if (!trimmed) return false;

  const { data, error } = await supabase.rpc("is_student_cid_available", {
    p_cid: trimmed,
  });

  if (error) {
    console.error("CID availability check failed:", error.message);
    return null;
  }

  return data === true;
}
