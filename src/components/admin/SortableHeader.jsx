import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import styles from "./admin.module.css";

const ICONS = { ascending: ArrowUp, descending: ArrowDown, none: ArrowUpDown };
const NEXT_LABEL = { ascending: "descendente", descending: "ascendente", none: "ascendente" };

/**
 * <th> ordenable: botón accesible + aria-sort. Usar con useSortableData.
 *   <SortableHeader sortKey="total" sort={sortState}>Total</SortableHeader>
 *   sort = { getSortDirection, requestSort } (lo que devuelve useSortableData)
 */
const SortableHeader = ({ sortKey, sort, children, className, ...rest }) => {
  const direction = sort.getSortDirection(sortKey);
  const Icon = ICONS[direction] || ArrowUpDown;
  return (
    <th aria-sort={direction} className={className} {...rest}>
      <button
        type="button"
        className={`${styles.sortBtn} ${direction !== "none" ? styles.sortBtnActive : ""}`}
        onClick={() => sort.requestSort(sortKey)}
        title={`Ordenar ${NEXT_LABEL[direction]}`}
      >
        <span>{children}</span>
        <Icon size={14} aria-hidden="true" className={styles.sortIcon} />
      </button>
    </th>
  );
};

export default SortableHeader;
