// Filtros de categoría (pills / segmentos) con aria-pressed.
// Las clases vienen de cada plantilla para conservar su estilo.
const CategoryPills = ({
  categories = [],
  selected,
  onChange,
  allLabel = "Todas",
  label = "Categorías",
  className,
  pillClassName,
  activeClassName,
}) => {
  const items = [{ category_id: "all", name: allLabel }, ...categories];
  return (
    <nav className={className} aria-label={label}>
      {items.map((cat) => {
        const active = selected === cat.category_id;
        return (
          <button
            key={cat.category_id}
            type="button"
            className={`${pillClassName} ${active ? activeClassName : ""}`}
            aria-pressed={active}
            onClick={() => onChange(cat.category_id)}
          >
            {cat.name}
          </button>
        );
      })}
    </nav>
  );
};

export default CategoryPills;
