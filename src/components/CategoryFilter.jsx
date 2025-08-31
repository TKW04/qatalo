import { Button } from "primereact/button"

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {

  return (
    <div className="category-filters">
      <Button
        className={`category-filter ${selectedCategory === "all" ? "active" : ""}`}
        onClick={() => onCategoryChange("all")}
        label="Todas"
      />
      {categories.map((category) => (
        <Button
          key={category.category_id}
          className={`category-filter ${selectedCategory === category.category_id ? "active" : ""}`}
          onClick={() => onCategoryChange(category.category_id)}
          label={category.name}
        />
      ))}
    </div>
  )
}

export default CategoryFilter
