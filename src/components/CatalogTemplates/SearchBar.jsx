import { useId } from "react";
import { Search } from "lucide-react";
import shared from "./catalogShared.module.css";

// Buscador del catálogo con label accesible (oculto visualmente).
// `styles` = módulo CSS de la plantilla; se usan sus clases root/icon/input
// para conservar el look de cada tema.
const SearchBar = ({
  value,
  onChange,
  placeholder = "Buscar productos...",
  label = "Buscar productos",
  className,
  iconClassName,
  inputClassName,
  iconSize = 20,
}) => {
  const id = useId();
  return (
    <div className={className} role="search">
      <label htmlFor={id} className={shared.visuallyHidden}>{label}</label>
      <Search size={iconSize} className={iconClassName} aria-hidden="true" />
      <input
        id={id}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
    </div>
  );
};

export default SearchBar;
