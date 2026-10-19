import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Calculator,
  ChefHat,
  Save,
} from "lucide-react";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { formatted } from "../../../helpers/utils";
import {
  Button,
  IconButton,
  Modal,
  EmptyState,
  Field,
  SkeletonTable,
} from "../../../components/admin";
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe } from "../../../services/recipesApi";
import {
  STANDARD_UNITS,
  computeRecipePlan,
  normalizeUnit,
  quantityLabel,
  recipeCost,
  packagingCostPerUnit,
  roundMoney,
} from "../../../helpers/recipeMath";
import reportStyles from "../../../components/SellReport.module.css";
import styles from "./Production.module.css";
import rs from "./Recipes.module.css";

// Recetas: solo control de costos. No afecta inventario ni usa el API de /production.

const money = (v) => (v === null || v === undefined ? "—" : `RD$ ${formatted(v)}`);
const fmtNum = (v) =>
  Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });

const UNIT_OPTIONS = [
  { value: "oz", label: "oz (onzas)" },
  { value: "lb", label: "lb (libras)" },
  { value: "ud", label: "ud (unidades)" },
  { value: "other", label: "Otra…" },
];

let rowSeq = 0;
const newKey = () => `row-${++rowSeq}`;

const emptyIngredient = () => ({ key: newKey(), name: "", quantity: "", unitChoice: "oz", unitOther: "", cost_per_recipe: "", store: "" });
const emptyPackaging = () => ({ key: newKey(), name: "", quantity_per_unit: "", unit_cost: "", store: "" });

const str = (v) => (v === null || v === undefined ? "" : String(v));

const toForm = (recipe) => ({
  name: recipe?.name || "",
  yield_lb: str(recipe?.yield_lb),
  notes: recipe?.notes || "",
  ingredients: (recipe?.ingredients?.length ? recipe.ingredients : [null]).map((it) => {
    if (!it) return emptyIngredient();
    const u = normalizeUnit(it.unit);
    const standard = STANDARD_UNITS.includes(u);
    return {
      key: newKey(),
      name: it.name || "",
      quantity: str(it.quantity),
      unitChoice: standard ? u : "other",
      unitOther: standard ? "" : str(it.unit).trim(),
      cost_per_recipe: str(it.cost_per_recipe),
      store: it.store || "",
    };
  }),
  packaging: (recipe?.packaging || []).map((p) => ({
    key: newKey(),
    name: p.name || "",
    quantity_per_unit: str(p.quantity_per_unit),
    unit_cost: str(p.unit_cost),
    store: p.store || "",
  })),
});

// Payload limpio (sin recipe_id ni fechas) a partir de una receta del API: usado al duplicar
const toPayload = (recipe, nameOverride) => ({
  name: nameOverride ?? recipe.name,
  yield_lb: Number(recipe.yield_lb),
  ...(recipe.notes ? { notes: recipe.notes } : {}),
  ingredients: (recipe.ingredients || []).map((it) => ({
    name: it.name,
    quantity: Number(it.quantity),
    unit: it.unit,
    cost_per_recipe: Number(it.cost_per_recipe),
    ...(it.store ? { store: it.store } : {}),
  })),
  packaging: (recipe.packaging || []).map((p) => ({
    name: p.name,
    quantity_per_unit: Number(p.quantity_per_unit),
    unit_cost: Number(p.unit_cost),
    ...(p.store ? { store: p.store } : {}),
  })),
});

const isBlank = (v) => String(v ?? "").trim() === "";
const isPositive = (v) => !isBlank(v) && Number.isFinite(Number(v)) && Number(v) > 0;
const isNonNegative = (v) => !isBlank(v) && Number.isFinite(Number(v)) && Number(v) >= 0;

// Valida el formulario. Las filas completamente vacías se ignoran.
const validate = (form) => {
  const errors = { rows: {} };
  if (isBlank(form.name)) errors.name = "Escribe el nombre de la receta";
  if (!isPositive(form.yield_lb)) errors.yield_lb = "Ingresa las libras que rinde una tanda (mayor que 0)";

  const ingredients = form.ingredients.filter(
    (r) => !(isBlank(r.name) && isBlank(r.quantity) && isBlank(r.cost_per_recipe) && isBlank(r.store) && isBlank(r.unitOther))
  );
  ingredients.forEach((r) => {
    const e = {};
    if (isBlank(r.name)) e.name = "Nombre requerido";
    if (!isPositive(r.quantity)) e.quantity = "Cantidad mayor que 0";
    if (r.unitChoice === "other" && isBlank(r.unitOther)) e.unit = "Escribe la unidad";
    if (!isNonNegative(r.cost_per_recipe)) e.cost_per_recipe = "Costo 0 o mayor";
    if (Object.keys(e).length) errors.rows[r.key] = e;
  });
  if (ingredients.length === 0) errors.ingredients = "Agrega al menos un ingrediente";

  const packaging = form.packaging.filter(
    (r) => !(isBlank(r.name) && isBlank(r.quantity_per_unit) && isBlank(r.unit_cost) && isBlank(r.store))
  );
  packaging.forEach((r) => {
    const e = {};
    if (isBlank(r.name)) e.name = "Nombre requerido";
    if (!isPositive(r.quantity_per_unit)) e.quantity_per_unit = "Piezas mayor que 0";
    if (!isNonNegative(r.unit_cost)) e.unit_cost = "Costo 0 o mayor";
    if (Object.keys(e).length) errors.rows[r.key] = e;
  });

  const hasErrors = !!(errors.name || errors.yield_lb || errors.ingredients || Object.keys(errors.rows).length);
  return { errors, hasErrors, ingredients, packaging };
};

const buildPayload = (form, ingredients, packaging) => {
  const notes = form.notes.trim();
  return {
    name: form.name.trim(),
    yield_lb: Number(form.yield_lb),
    notes,
    ingredients: ingredients.map((r) => {
      const store = r.store.trim();
      return {
        name: r.name.trim(),
        quantity: Number(r.quantity),
        unit: r.unitChoice === "other" ? r.unitOther.trim() : r.unitChoice,
        cost_per_recipe: Number(r.cost_per_recipe),
        ...(store ? { store } : {}),
      };
    }),
    packaging: packaging.map((r) => {
      const store = r.store.trim();
      return {
        name: r.name.trim(),
        quantity_per_unit: Number(r.quantity_per_unit),
        unit_cost: Number(r.unit_cost),
        ...(store ? { store } : {}),
      };
    }),
  };
};

const scrollTop = () => {
  try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* sin window */ }
};

/* ---------- Editor de receta ---------- */
const RecipeEditor = ({ recipe, onCancel, onSaved }) => {
  const { showWarning, showSuccess } = useNotification();
  const queryClient = useQueryClient();
  const isEdit = !!recipe?.recipe_id;

  const [form, setForm] = useState(() => toForm(recipe));
  const [errors, setErrors] = useState({ rows: {} });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setRow = (list, key, field, value) =>
    setForm((f) => ({ ...f, [list]: f[list].map((r) => (r.key === key ? { ...r, [field]: value } : r)) }));
  const addRow = (list) =>
    setForm((f) => ({ ...f, [list]: [...f[list], list === "ingredients" ? emptyIngredient() : emptyPackaging()] }));
  const removeRow = (list, key) => setForm((f) => ({ ...f, [list]: f[list].filter((r) => r.key !== key) }));

  const totalPerRecipe = useMemo(
    () => recipeCost(form.ingredients.map((r) => ({ cost_per_recipe: isNonNegative(r.cost_per_recipe) ? r.cost_per_recipe : 0 }))),
    [form.ingredients]
  );
  const packPerUnit = useMemo(
    () =>
      packagingCostPerUnit(
        form.packaging.map((r) => ({
          quantity_per_unit: isPositive(r.quantity_per_unit) ? r.quantity_per_unit : 0,
          unit_cost: isNonNegative(r.unit_cost) ? r.unit_cost : 0,
        }))
      ),
    [form.packaging]
  );
  const perLb = isPositive(form.yield_lb) ? roundMoney(totalPerRecipe / Number(form.yield_lb)) : null;

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? updateRecipe(recipe.recipe_id, payload) : createRecipe(payload)),
    onSuccess: (saved) => {
      showSuccess("¡Éxito!", isEdit ? "Receta actualizada" : "Receta creada");
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      onSaved(saved?.recipe_id || recipe?.recipe_id || null);
    },
    onError: (error) => showWarning("Revisa la información", error.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const { errors: next, hasErrors, ingredients, packaging } = validate(form);
    setErrors(next);
    if (hasErrors) return showWarning("Valida tu información", "Revisa los campos marcados");
    saveMutation.mutate(buildPayload(form, ingredients, packaging));
  };

  const rowErr = (key, field) => errors.rows?.[key]?.[field];
  const inputCls = (key, field) => (rowErr(key, field) ? "input error" : "input");
  const errorCount = Object.keys(errors.rows || {}).length;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={rs.toolbar}>
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onCancel} disabled={saveMutation.isPending}>
          Volver a recetas
        </Button>
      </div>

      <section className={styles.card} aria-labelledby="recipe-editor-title">
        <h2 id="recipe-editor-title">{isEdit ? "Editar receta" : "Nueva receta"}</h2>
        <div className={styles.formRow}>
          <Field label="Nombre" required error={errors.name}>
            <input id="recipe-name" className="input" maxLength={120} value={form.name} onChange={set("name")} placeholder="Ej. Dulce de coco" />
          </Field>
          <Field label="Rendimiento (lb por tanda)" required error={errors.yield_lb} hint="Libras producidas cada vez que haces la receta.">
            <input
              id="recipe-yield"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={form.yield_lb}
              onChange={set("yield_lb")}
              placeholder="Ej. 5"
            />
          </Field>
        </div>
        <Field label="Notas" hint="Opcional. Ej. tiempo de cocción, pasos clave.">
          <textarea id="recipe-notes" className="input" rows={3} maxLength={1000} value={form.notes} onChange={set("notes")} />
        </Field>
      </section>

      {/* Ingredientes */}
      <section className={styles.card} aria-labelledby="recipe-ingredients-title">
        <div className={styles.listHeader}>
          <h2 id="recipe-ingredients-title">Ingredientes (por receta)</h2>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => addRow("ingredients")}>
            Agregar ingrediente
          </Button>
        </div>
        <div className={reportStyles.tableWrap}>
          <table className={`${reportStyles.table} ${rs.editTable}`}>
            <thead>
              <tr>
                <th scope="col" className={rs.colName}>Ingrediente</th>
                <th scope="col" className={rs.colNum}>Cantidad</th>
                <th scope="col" className={rs.colUnit}>Unidad</th>
                <th scope="col" className={rs.colNum}>Costo por receta (RD$)</th>
                <th scope="col" className={rs.colStore}>Lugar de compra</th>
                <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {form.ingredients.map((r, i) => (
                <tr key={r.key}>
                  <td>
                    <input
                      className={inputCls(r.key, "name")}
                      aria-label={`Nombre del ingrediente ${i + 1}`}
                      aria-invalid={rowErr(r.key, "name") ? true : undefined}
                      title={rowErr(r.key, "name")}
                      maxLength={120}
                      value={r.name}
                      onChange={(e) => setRow("ingredients", r.key, "name", e.target.value)}
                      placeholder="Ej. Coquitos"
                    />
                  </td>
                  <td>
                    <input
                      className={inputCls(r.key, "quantity")}
                      aria-label={`Cantidad del ingrediente ${i + 1}`}
                      aria-invalid={rowErr(r.key, "quantity") ? true : undefined}
                      title={rowErr(r.key, "quantity")}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={r.quantity}
                      onChange={(e) => setRow("ingredients", r.key, "quantity", e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <div className={rs.unitCell}>
                      <select
                        className="input"
                        aria-label={`Unidad del ingrediente ${i + 1}`}
                        value={r.unitChoice}
                        onChange={(e) => setRow("ingredients", r.key, "unitChoice", e.target.value)}
                      >
                        {UNIT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {r.unitChoice === "other" && (
                        <input
                          className={inputCls(r.key, "unit")}
                          aria-label={`Unidad personalizada del ingrediente ${i + 1}`}
                          aria-invalid={rowErr(r.key, "unit") ? true : undefined}
                          title={rowErr(r.key, "unit")}
                          maxLength={30}
                          value={r.unitOther}
                          onChange={(e) => setRow("ingredients", r.key, "unitOther", e.target.value)}
                          placeholder="Ej. lata"
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <input
                      className={inputCls(r.key, "cost_per_recipe")}
                      aria-label={`Costo por receta del ingrediente ${i + 1}`}
                      aria-invalid={rowErr(r.key, "cost_per_recipe") ? true : undefined}
                      title={rowErr(r.key, "cost_per_recipe")}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={r.cost_per_recipe}
                      onChange={(e) => setRow("ingredients", r.key, "cost_per_recipe", e.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      aria-label={`Lugar de compra del ingrediente ${i + 1}`}
                      maxLength={120}
                      value={r.store}
                      onChange={(e) => setRow("ingredients", r.key, "store", e.target.value)}
                      placeholder="Opcional"
                    />
                  </td>
                  <td className={styles.actionsCell}>
                    <IconButton
                      icon={Trash2}
                      variant="danger"
                      label={`Quitar ingrediente ${r.name || i + 1}`}
                      onClick={() => removeRow("ingredients", r.key)}
                    />
                  </td>
                </tr>
              ))}
              <tr className={reportStyles.totalRow}>
                <td colSpan={3}>Total por receta</td>
                <td className={styles.numCell}>{money(totalPerRecipe)}</td>
                <td colSpan={2} className={rs.mutedSmall}>
                  {perLb !== null ? `${money(perLb)} por lb` : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {errors.ingredients && <p className={styles.err} role="alert">{errors.ingredients}</p>}
      </section>

      {/* Empaque */}
      <section className={styles.card} aria-labelledby="recipe-packaging-title">
        <div className={styles.listHeader}>
          <h2 id="recipe-packaging-title">Empaque (por unidad terminada)</h2>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => addRow("packaging")}>
            Agregar pieza
          </Button>
        </div>
        {form.packaging.length === 0 ? (
          <p className={rs.mutedSmall}>Opcional. Agrega fundas, etiquetas, envases, etc. que usa cada producto terminado.</p>
        ) : (
          <div className={reportStyles.tableWrap}>
            <table className={`${reportStyles.table} ${rs.editTable}`}>
              <thead>
                <tr>
                  <th scope="col" className={rs.colName}>Pieza</th>
                  <th scope="col" className={rs.colNum}>Piezas por unidad</th>
                  <th scope="col" className={rs.colNum}>Costo por pieza (RD$)</th>
                  <th scope="col" className={rs.colStore}>Lugar de compra</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {form.packaging.map((r, i) => (
                  <tr key={r.key}>
                    <td>
                      <input
                        className={inputCls(r.key, "name")}
                        aria-label={`Nombre de la pieza ${i + 1}`}
                        aria-invalid={rowErr(r.key, "name") ? true : undefined}
                        title={rowErr(r.key, "name")}
                        maxLength={120}
                        value={r.name}
                        onChange={(e) => setRow("packaging", r.key, "name", e.target.value)}
                        placeholder="Ej. Funda"
                      />
                    </td>
                    <td>
                      <input
                        className={inputCls(r.key, "quantity_per_unit")}
                        aria-label={`Piezas por unidad de la pieza ${i + 1}`}
                        aria-invalid={rowErr(r.key, "quantity_per_unit") ? true : undefined}
                        title={rowErr(r.key, "quantity_per_unit")}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={r.quantity_per_unit}
                        onChange={(e) => setRow("packaging", r.key, "quantity_per_unit", e.target.value)}
                        placeholder="1"
                      />
                    </td>
                    <td>
                      <input
                        className={inputCls(r.key, "unit_cost")}
                        aria-label={`Costo por pieza ${i + 1}`}
                        aria-invalid={rowErr(r.key, "unit_cost") ? true : undefined}
                        title={rowErr(r.key, "unit_cost")}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={r.unit_cost}
                        onChange={(e) => setRow("packaging", r.key, "unit_cost", e.target.value)}
                        placeholder="0.00"
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        aria-label={`Lugar de compra de la pieza ${i + 1}`}
                        maxLength={120}
                        value={r.store}
                        onChange={(e) => setRow("packaging", r.key, "store", e.target.value)}
                        placeholder="Opcional"
                      />
                    </td>
                    <td className={styles.actionsCell}>
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        label={`Quitar pieza ${r.name || i + 1}`}
                        onClick={() => removeRow("packaging", r.key)}
                      />
                    </td>
                  </tr>
                ))}
                <tr className={reportStyles.totalRow}>
                  <td colSpan={2}>Empaque por unidad</td>
                  <td className={styles.numCell}>{money(packPerUnit)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {errorCount > 0 && (
        <p className={styles.err} role="alert">
          Hay {errorCount} {errorCount === 1 ? "fila" : "filas"} con datos incompletos o inválidos (marcadas en rojo).
        </p>
      )}

      <div className={`${styles.formActions} ${rs.stickyActions}`}>
        <Button type="submit" icon={Save} loading={saveMutation.isPending}>
          {saveMutation.isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear receta"}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saveMutation.isPending}>
          Cancelar
        </Button>
        <span className={rs.totalBadge}>Total por receta: <strong>{money(totalPerRecipe)}</strong></span>
      </div>
    </form>
  );
};

/* ---------- Detalle + planificador ---------- */
const parseIntInput = (v) => {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};

const RecipeDetail = ({ recipe, onBack, onEdit }) => {
  const [batchesInput, setBatchesInput] = useState("1");
  const [unitsInput, setUnitsInput] = useState("");

  const batches = parseIntInput(batchesInput);
  const units = parseIntInput(unitsInput);
  const batchesError = batches === null || Number.isNaN(batches) || batches < 1 ? "Ingresa un número entero de 1 o más" : null;
  const unitsError = units !== null && (Number.isNaN(units) || units < 0) ? "Ingresa un número entero de 0 o más" : null;

  const plan = useMemo(
    () => (batchesError || unitsError ? null : computeRecipePlan(recipe, { batches, units: units || 0 })),
    [recipe, batches, units, batchesError, unitsError]
  );

  const hasPackaging = (recipe.packaging || []).length > 0;

  return (
    <div>
      <div className={rs.toolbar}>
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>Volver a recetas</Button>
        <Button variant="secondary" size="sm" icon={Pencil} onClick={onEdit}>Editar receta</Button>
      </div>

      <section className={styles.card} aria-labelledby="recipe-detail-title">
        <h2 id="recipe-detail-title">{recipe.name}</h2>
        <p className={rs.meta}>
          Rinde <strong>{fmtNum(recipe.yield_lb)} lb</strong> por tanda · Costo por receta{" "}
          <strong>{money(recipeCost(recipe.ingredients))}</strong>
          {hasPackaging && <> · Empaque por unidad <strong>{money(packagingCostPerUnit(recipe.packaging))}</strong></>}
        </p>
        {recipe.notes && <p className={rs.notes}>{recipe.notes}</p>}

        <h3 className={rs.subTitle}>Planificador</h3>
        <div className={styles.formRow}>
          <Field label="Para N recetas" required error={batchesError}>
            <input
              id="recipe-plan-batches"
              className="input"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={batchesInput}
              onChange={(e) => setBatchesInput(e.target.value)}
            />
          </Field>
          <Field
            label="Unidades terminadas a producir"
            error={unitsError}
            hint={hasPackaging ? "Opcional. Se usa para calcular el empaque y el costo por unidad." : "Opcional. Se usa para el costo por unidad."}
          >
            <input
              id="recipe-plan-units"
              className="input"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={unitsInput}
              onChange={(e) => setUnitsInput(e.target.value)}
              placeholder="Ej. 40"
            />
          </Field>
        </div>
      </section>

      {plan && (
        <>
          <div className={reportStyles.kpis}>
            <div className={reportStyles.kpi}>
              <span>Libras totales</span>
              <strong>{fmtNum(plan.totalLb)} lb</strong>
            </div>
            <div className={reportStyles.kpi}>
              <span>Costo total</span>
              <strong>{money(plan.total)}</strong>
            </div>
            <div className={reportStyles.kpi}>
              <span>Costo por libra</span>
              <strong>{money(plan.costPerLb)}</strong>
            </div>
            {plan.units > 0 && (
              <div className={reportStyles.kpi}>
                <span>Costo por unidad</span>
                <strong>{money(plan.costPerUnit)}</strong>
              </div>
            )}
          </div>

          <div className={reportStyles.tableCard}>
            <h3>Ingredientes para {plan.batches} {plan.batches === 1 ? "receta" : "recetas"}</h3>
            <div className={reportStyles.tableWrap}>
              <table className={reportStyles.table}>
                <thead>
                  <tr>
                    <th scope="col">Ingrediente</th>
                    <th scope="col" className={styles.numCell}>Por receta</th>
                    <th scope="col" className={styles.numCell}>Total</th>
                    <th scope="col" className={styles.numCell}>Costo por receta</th>
                    <th scope="col" className={styles.numCell}>Costo total</th>
                    <th scope="col">Lugar</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.ingredients.map((it, i) => (
                    <tr key={`${it.name}-${i}`}>
                      <td>{it.name || "—"}</td>
                      <td className={`${styles.numCell} ${reportStyles.cellMuted}`}>
                        {quantityLabel(recipe.ingredients[i]?.quantity, it.unit)}
                      </td>
                      <td className={styles.numCell}><strong>{it.quantityLabel}</strong></td>
                      <td className={`${styles.numCell} ${reportStyles.cellMuted}`}>{money(it.costPerRecipe)}</td>
                      <td className={styles.numCell}><strong>{money(it.cost)}</strong></td>
                      <td className={reportStyles.cellMuted}>{it.store || "—"}</td>
                    </tr>
                  ))}
                  {plan.ingredients.length === 0 && (
                    <tr><td colSpan={6} className={reportStyles.tableEmpty}>Esta receta no tiene ingredientes.</td></tr>
                  )}
                  <tr className={reportStyles.totalRow}>
                    <td colSpan={4}>Subtotal ingredientes</td>
                    <td className={styles.numCell}>{money(plan.ingredientsSubtotal)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {hasPackaging && (
            <div className={`${reportStyles.tableCard} ${reportStyles.stacked}`}>
              <h3>Empaque para {fmtNum(plan.units)} {plan.units === 1 ? "unidad" : "unidades"}</h3>
              {plan.units === 0 && (
                <p className={rs.mutedSmall}>Indica las unidades terminadas a producir para calcular el empaque.</p>
              )}
              <div className={reportStyles.tableWrap}>
                <table className={reportStyles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Pieza</th>
                      <th scope="col" className={styles.numCell}>Piezas por unidad</th>
                      <th scope="col" className={styles.numCell}>Piezas totales</th>
                      <th scope="col" className={styles.numCell}>Costo por pieza</th>
                      <th scope="col" className={styles.numCell}>Costo total</th>
                      <th scope="col">Lugar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.packaging.map((p, i) => (
                      <tr key={`${p.name}-${i}`}>
                        <td>{p.name || "—"}</td>
                        <td className={`${styles.numCell} ${reportStyles.cellMuted}`}>{fmtNum(p.quantityPerUnit)}</td>
                        <td className={styles.numCell}><strong>{fmtNum(p.pieces)}</strong></td>
                        <td className={`${styles.numCell} ${reportStyles.cellMuted}`}>{money(p.unitCost)}</td>
                        <td className={styles.numCell}><strong>{money(p.cost)}</strong></td>
                        <td className={reportStyles.cellMuted}>{p.store || "—"}</td>
                      </tr>
                    ))}
                    <tr className={reportStyles.totalRow}>
                      <td colSpan={4}>Subtotal empaque</td>
                      <td className={styles.numCell}>{money(plan.packagingSubtotal)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <section className={`${styles.card} ${rs.summary}`} aria-labelledby="recipe-summary-title">
            <h2 id="recipe-summary-title">Resumen de costos</h2>
            <dl className={rs.summaryList}>
              <div><dt>Ingredientes</dt><dd>{money(plan.ingredientsSubtotal)}</dd></div>
              <div><dt>Empaque</dt><dd>{money(plan.packagingSubtotal)}</dd></div>
              <div className={rs.summaryTotal}><dt>COSTO TOTAL</dt><dd>{money(plan.total)}</dd></div>
              <div>
                <dt>COSTO POR LIBRA</dt>
                <dd>{plan.costPerLb === null ? "— (rendimiento en 0 lb)" : money(plan.costPerLb)}</dd>
              </div>
              {plan.units > 0 && (
                <div><dt>COSTO POR UNIDAD</dt><dd>{money(plan.costPerUnit)}</dd></div>
              )}
            </dl>
          </section>
        </>
      )}
    </div>
  );
};

/* ---------- Lista de recetas ---------- */
const Recipes = ({ tenantId }) => {
  const { showError, showSuccess, showWarning } = useNotification();
  const queryClient = useQueryClient();

  // view: { mode: "list" } | { mode: "edit", id?: string } | { mode: "detail", id: string }
  const [view, setView] = useState({ mode: "list" });
  const [toDelete, setToDelete] = useState(null);

  const { data: recipes = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["recipes", tenantId],
    queryFn: fetchRecipes,
    enabled: !!tenantId,
    retry: false,
  });

  const sorted = useMemo(
    () => [...recipes].sort((a, b) => (a.name || "").localeCompare(b.name || "", "es")),
    [recipes]
  );
  const current = view.id ? recipes.find((r) => r.recipe_id === view.id) : null;

  const go = (next) => {
    setView(next);
    scrollTop();
  };

  const duplicateMutation = useMutation({
    mutationFn: (recipe) => createRecipe(toPayload(recipe, `${recipe.name} (copia)`)),
    onSuccess: () => {
      showSuccess("¡Éxito!", "Receta duplicada");
      queryClient.invalidateQueries({ queryKey: ["recipes", tenantId] });
    },
    onError: (err) => showWarning("No se pudo duplicar", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRecipe(id),
    onSuccess: () => {
      showSuccess("Eliminada", "Receta eliminada");
      queryClient.invalidateQueries({ queryKey: ["recipes", tenantId] });
      setToDelete(null);
      setView({ mode: "list" });
    },
    onError: (err) => showError("Error", err.message),
  });

  if (view.mode === "edit") {
    return (
      <RecipeEditor
        key={view.id || "new"}
        recipe={current}
        onCancel={() => go(view.id && current ? { mode: "detail", id: view.id } : { mode: "list" })}
        onSaved={(id) => go(id ? { mode: "detail", id } : { mode: "list" })}
      />
    );
  }

  if (view.mode === "detail" && current) {
    return (
      <RecipeDetail
        key={current.recipe_id}
        recipe={current}
        onBack={() => go({ mode: "list" })}
        onEdit={() => go({ mode: "edit", id: current.recipe_id })}
      />
    );
  }

  return (
    <>
      <div className={styles.listHeader}>
        <h2>Recetas</h2>
        <div className={styles.listTools}>
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={isFetching && !isLoading} onClick={() => refetch()}>
            Actualizar
          </Button>
          <Button size="sm" icon={Plus} onClick={() => go({ mode: "edit" })}>Nueva receta</Button>
        </div>
      </div>
      <p className={styles.footnote + " " + rs.intro}>
        Solo para control de costos: las recetas no modifican el inventario ni los registros de fabricación.
      </p>

      {isLoading ? (
        <SkeletonTable rows={4} label="Cargando recetas..." />
      ) : isError ? (
        <p className={styles.errorText} role="alert">{error?.message || "No se pudieron cargar las recetas"}</p>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Aún no tienes recetas"
          description="Registra tus ingredientes y empaque para calcular cuánto cuesta producir cada libra y cada unidad."
          action={<Button icon={Plus} onClick={() => go({ mode: "edit" })}>Nueva receta</Button>}
        />
      ) : (
        <div className={reportStyles.tableCard}>
          <div className={reportStyles.tableWrap}>
            <table className={reportStyles.table}>
              <thead>
                <tr>
                  <th scope="col">Receta</th>
                  <th scope="col" className={styles.numCell}>Rinde (lb/tanda)</th>
                  <th scope="col" className={styles.numCell}>Ingredientes</th>
                  <th scope="col" className={styles.numCell}>Costo por receta</th>
                  <th scope="col" className={styles.numCell}>Costo por lb</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const cost = recipeCost(r.ingredients);
                  const perLb = Number(r.yield_lb) > 0 ? roundMoney(cost / Number(r.yield_lb)) : null;
                  return (
                    <tr key={r.recipe_id}>
                      <td>
                        <button type="button" className={rs.linkBtn} onClick={() => go({ mode: "detail", id: r.recipe_id })}>
                          {r.name || "—"}
                        </button>
                      </td>
                      <td className={styles.numCell}>{fmtNum(r.yield_lb)}</td>
                      <td className={styles.numCell}>{(r.ingredients || []).length}</td>
                      <td className={styles.numCell}><strong>{money(cost)}</strong></td>
                      <td className={`${styles.numCell} ${reportStyles.cellMuted}`}>{money(perLb)}</td>
                      <td className={styles.actionsCell}>
                        <IconButton icon={Calculator} label={`Planificar ${r.name}`} onClick={() => go({ mode: "detail", id: r.recipe_id })} />
                        <IconButton icon={Pencil} label={`Editar ${r.name}`} onClick={() => go({ mode: "edit", id: r.recipe_id })} />
                        <IconButton
                          icon={Copy}
                          label={`Duplicar ${r.name}`}
                          disabled={duplicateMutation.isPending}
                          onClick={() => duplicateMutation.mutate(r)}
                        />
                        <IconButton icon={Trash2} variant="danger" label={`Eliminar ${r.name}`} onClick={() => setToDelete(r)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminar receta"
        size="sm"
        dismissible={!deleteMutation.isPending}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete.recipe_id)}>
              {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </>
        }
      >
        <p className={styles.modalText}>
          ¿Seguro que deseas eliminar la receta <strong>{toDelete?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  );
};

export default Recipes;
