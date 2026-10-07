import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lightbulb, Send, Check, Sparkles, Bug, MessageCircle } from "lucide-react";
import { Modal, Button, Field } from "../admin";
import { useNotification } from "../UI/NotificationProvider";
import { createSuggestion } from "../../services/suggestionsApi";
import styles from "./FeatureSuggestionButton.module.css";

const TYPES = [
  { value: "improvement", label: "Mejora", icon: Lightbulb },
  { value: "feature", label: "Nueva función", icon: Sparkles },
  { value: "bug", label: "Problema o error", icon: Bug },
  { value: "other", label: "Otra idea", icon: MessageCircle },
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

  const pending = mutation.isPending;

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label="Sugerir una mejora"
        title="Sugerir una mejora"
      >
        <Lightbulb size={18} aria-hidden="true" />
        <span className={styles.fabLabel}>Sugerir</span>
      </button>

      <Modal
        open={open}
        onClose={close}
        dismissible={!pending}
        size="sm"
        title={sent ? undefined : "Sugerir una mejora"}
        description={sent ? undefined : "¿Qué te gustaría ver en Qatalo? Tu idea nos ayuda a priorizar."}
        footer={
          sent ? (
            <Button onClick={close} block>Cerrar</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close} disabled={pending}>Cancelar</Button>
              <Button onClick={submit} loading={pending} icon={Send}>
                {pending ? "Enviando..." : "Enviar sugerencia"}
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <div className={styles.doneState} role="status">
            <div className={styles.doneIcon} aria-hidden="true"><Check size={28} strokeWidth={2.5} /></div>
            <h3 className={styles.doneTitle}>¡Sugerencia enviada!</h3>
            <p className={styles.doneDesc}>Gracias por ayudarnos a mejorar Qatalo. Leemos todas las ideas.</p>
          </div>
        ) : (
          <>
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Tipo</legend>
              <div className={styles.pills}>
                {TYPES.map(({ value, label, icon }) => {
                  const Icon = icon;
                  const active = form.type === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                      aria-pressed={active}
                      onClick={() => set("type", value)}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Field label="Título" hint={`${form.title.length}/${MAX_TITLE}`}>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => set("title", e.target.value.slice(0, MAX_TITLE))}
                placeholder="Ej. Poder duplicar un producto"
                maxLength={MAX_TITLE}
              />
            </Field>

            <Field label="Descripción" hint={`${form.description.length}/${MAX_DESC}`}>
              <textarea
                className={styles.textarea}
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value.slice(0, MAX_DESC))}
                placeholder="Cuéntanos qué necesitas y por qué te ayudaría. Mientras más detalle, mejor."
                maxLength={MAX_DESC}
              />
            </Field>
          </>
        )}
      </Modal>
    </>
  );
};

export default FeatureSuggestionButton;
