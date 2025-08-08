"use client"

function CategoryFilter({ categories, selectedCategory, onCategoryChange }) {
  return (
    <div className="category-filters">
      <button
        className={`category-filter ${selectedCategory === "all" ? "active" : ""}`}
        onClick={() => onCategoryChange("all")}
      >
        Todas
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`category-filter ${selectedCategory === category.id ? "active" : ""}`}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
