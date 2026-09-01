const DUPLICATE_CID_MESSAGE =
  "This Student ID is already registered. Log in with your existing account or use a different CID.";

const DUPLICATE_EMAIL_MESSAGE =
  "An account with this email already exists. Try logging in instead.";

export function normalizeAuthError(error: unknown): string {
  if (!error) return "Something went wrong. Please try again.";

  if (typeof error === "string") {
    return mapKnownAuthMessage(error);
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === "string"
        ? record.message
        : typeof record.error_description === "string"
          ? record.error_description
          : typeof record.msg === "string"
            ? record.msg
            : "";

    if (message.trim()) {
      return mapKnownAuthMessage(message);
    }
  }

  return "Something went wrong. Please try again.";
}

function mapKnownAuthMessage(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("student id is already registered") ||
    lower.includes("duplicate key") ||
    lower.includes("profiles_student_cid_key") ||
    lower.includes("database error saving new user")
  ) {
    return DUPLICATE_CID_MESSAGE;
  }

  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return DUPLICATE_EMAIL_MESSAGE;
  }

  if (lower.includes("email rate limit exceeded")) {
    return "Too many signup attempts. Please wait a while and try again.";
  }

  return message;
}

export { DUPLICATE_CID_MESSAGE, DUPLICATE_EMAIL_MESSAGE };
