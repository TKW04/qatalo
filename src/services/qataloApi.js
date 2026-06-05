const API_URL = import.meta.env.VITE_APP_API_URL;

export const contactTeam = async ({ name, email, message }) => {
  const res = await fetch(`${API_URL}contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });
  if (!res.ok) throw new Error("No se pudo enviar el mensaje");
  return res.json().catch(() => ({}));
};