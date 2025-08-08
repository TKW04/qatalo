import { Search } from "lucide-react";
const SearchBar = ({ value, onChange }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="input search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar productos"
      />
      <span
        className="search-icon"
        aria-hidden="true"
        style={{ marginLeft: "-10px" }}
      >
        <Search />
      </span>
    </div>
  );
};

export default SearchBar;
