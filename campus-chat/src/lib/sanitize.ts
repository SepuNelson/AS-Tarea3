import DOMPurify from "dompurify";

export const sanitizeHtml = (input?: string | null) => {
  if (!input) return "";
  return DOMPurify.sanitize(input, { USE_PROFILES: { html: true } });
};




