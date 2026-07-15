import BusinessHoursEditor from "./BusinessHoursEditor";
import { defaultBusinessHours } from "../../helpers/businessHours";

// Compone el horario GENERAL del negocio + overrides opcionales por localidad.
// business: formData del negocio (business_hours_enabled/hours_mode/business_hours/locality_hours)
// localities: array de nombres de localidad
// onChange(patch): mezcla el patch en el formData del negocio
const BusinessHoursSettings = ({ business = {}, localities = [], onChange }) => {
    // --- General: adaptamos las claves genéricas del editor a las del negocio ---
    const handleGeneral = (patch) => {
        const map = {};
        if ("enabled" in patch) map.business_hours_enabled = patch.enabled;
        if ("mode" in patch) map.hours_mode = patch.mode;
        if ("hours" in patch) map.business_hours = patch.hours;
        onChange?.(map);
    };

    // --- Por localidad ---
    const localityHours = business.locality_hours || {};
    const setLocality = (loc, patch) => {
        const cur = localityHours[loc] || { enabled: false, mode: "inform", hours: defaultBusinessHours() };
        onChange?.({ locality_hours: { ...localityHours, [loc]: { ...cur, ...patch } } });
    };

    return (
        <div>
            <BusinessHoursEditor
                enabled={business.business_hours_enabled}
                mode={business.hours_mode}
                hours={business.business_hours}
                onChange={handleGeneral}
            />

            {business.business_hours_enabled && (localities || []).length > 0 && (
                <div style={S.localBlock}>
                    <h3 style={S.localTitle}>Horarios especiales por localidad</h3>
                    <p style={S.localHint}>
                        Por defecto cada zona usa el <strong>horario general</strong> de arriba. Enciende una zona solo si
                        tiene un horario diferente (ej. una sucursal que cierra más tarde).
                    </p>

                    {localities.map((loc) => {
                        const entry = localityHours[loc] || { enabled: false, mode: "inform", hours: defaultBusinessHours() };
                        return (
                            <div key={loc} style={S.localCard}>
                                <BusinessHoursEditor
                                    enabled={entry.enabled}
                                    mode={entry.mode}
                                    hours={entry.hours}
                                    masterLabel={`${loc} · horario propio`}
                                    masterHint="Si lo apagas, esta zona usa el horario general."
                                    onChange={(patch) => setLocality(loc, patch)}
                                />
                            </div>
                            
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const S = {
    localBlock: { marginTop: "1.75rem", borderTop: "2px solid #eef0f3", paddingTop: "1.25rem" },
    localTitle: { margin: 0, color: "#113f67", fontSize: "1.05rem" },
    localHint: { fontSize: ".85rem", color: "#667085", margin: ".35rem 0 1rem", lineHeight: 1.5 },
    localCard: { border: "1px solid #eef0f3", borderRadius: 12, padding: "1rem 1.1rem", marginBottom: "1rem", background: "#fafbfc" },
};

export default BusinessHoursSettings;