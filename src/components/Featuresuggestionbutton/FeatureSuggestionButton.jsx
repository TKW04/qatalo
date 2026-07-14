import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lightbulb, X, Send, Check } from "lucide-react";
import { useNotification } from "../UI/NotificationProvider";
import { createSuggestion } from "../../services/suggestionsApi";
import styles from "./FeatureSuggestionButton.module.css";

const TYPES = [
  { value: "improvement", label: "💡 Mejora" },
  { value: "feature", label: "✨ Nueva función" },
  { value: "bug", label: "🐞 Problema / error" },
  { value: "other", label: "💬 Otra idea" },
];

const MAX_TITLE = 120;
const MAX_DESC = 2000;

const emptyForm = { type: "improvement", title: "", description: "" };

const FeatureSuggestionButton = () => {
  const { showSuccess, showWarning, showError } = useNotification();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const close = () => {
    setOpen(false);
    // pequeño delay para no ver el reset mientras cierra
    setTimeout(() => { setForm(emptyForm); setSent(false); }, 200);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createSuggestion({
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
      }),
    onSuccess: () => {
      setSent(true);
      showSuccess("¡Gracias!", "Tu sugerencia fue enviada. La revisaremos pronto.");
    },
    onError: (e) => showError("Error", e.message || "No se pudo enviar la sugerencia"),
  });

  const submit = () => {
    if (!form.title.trim()) return showWarning("Aviso", "Escribe un título breve");
    if (!form.description.trim()) return showWarning("Aviso", "Cuéntanos un poco más en la descripción");
    mutation.mutate();
  };

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label="Sugerir una mejora"
        title="Sugerir una mejora"
      >
        <Lightbulb size={18} />
        <span className={styles.fabLabel}>Sugerir</span>
      </button>

      {open && (
        <div className={styles.overlay} onClick={close}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.close} onClick={close} aria-label="Cerrar"><X size={18} /></button>

            {sent ? (
              <div className={styles.doneState}>
                <div className={styles.doneIcon}><Check size={28} strokeWidth={2.5} /></div>
                <h3 className={styles.doneTitle}>¡Sugerencia enviada!</h3>
                <p className={styles.doneDesc}>Gracias por ayudarnos a mejorar Qatalo. Leemos todas las ideas.</p>
                <button className={styles.primaryBtn} onClick={close}>Cerrar</button>
              </div>
            ) : (
              <>
                <div className={styles.head}>
                  <Lightbulb size={20} className={styles.headIcon} />
                  <div>
                    <h3 className={styles.title}>Sugerir una mejora</h3>
                    <p className={styles.subtitle}>¿Qué te gustaría ver en Qatalo? Tu idea nos ayuda a priorizar.</p>
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Tipo</label>
                  <div className={styles.pills}>
                    {TYPES.map((t) => (
                      <button
                        type="button"
                        key={t.value}
                        className={`${styles.pill} ${form.type === t.value ? styles.pillActive : ""}`}
                        onClick={() => set("type", t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Título</label>
                  <input
                    className={styles.input}
                    value={form.title}
                    onChange={(e) => set("title", e.target.value.slice(0, MAX_TITLE))}
                    placeholder="Ej. Poder duplicar un producto"
                    maxLength={MAX_TITLE}
                  />
                  <span className={styles.counter}>{form.title.length}/{MAX_TITLE}</span>
                </div>

                <div className={styles.field}>
                  <label>Descripción</label>
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value.slice(0, MAX_DESC))}
                    placeholder="Cuéntanos qué necesitas y por qué te ayudaría. Mientras más detalle, mejor."
                    maxLength={MAX_DESC}
                  />
                  <span className={styles.counter}>{form.description.length}/{MAX_DESC}</span>
                </div>

                <div className={styles.actions}>
                  <button className={styles.ghostBtn} onClick={close} disabled={mutation.isPending}>Cancelar</button>
                  <button className={styles.primaryBtn} onClick={submit} disabled={mutation.isPending}>
                    {mutation.isPending ? "Enviando…" : <><Send size={15} /> Enviar sugerencia</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureSuggestionButton;