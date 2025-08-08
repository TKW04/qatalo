import { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"
import { getBusinessData, getCategoriesData, getProductsData } from "../services/storage"
import HeaderPublic from "../components/HeaderPublic"
import SearchBar from "../components/SearchBar"
import CategoryFilter from "../components/CategoryFilter"
import ProductGrid from "../components/ProductGrid"
import ProductModal from "../components/ProductModal"
import "../styles/catalog.css"

function CatalogPublic() {
  const { slug } = useParams()
  const [business, setBusiness] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      try {
        const businessData = getBusinessData()
        const categoriesData = getCategoriesData()
        const productsData = getProductsData()

        // Verificar si el slug coincide
        if (businessData.slug !== slug) {
          // En un caso real, mostrarías un 404
          console.warn("Business slug does not match")
        }

        setBusiness(businessData)
        setCategories(categoriesData)
        setProducts(productsData)
      } catch (error) {
        console.error("Error loading catalog data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [slug])

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          searchTerm === "" ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory

        return matchesSearch && matchesCategory
      })
      .sort((a, b) => a.order - b.order)
  }, [products, searchTerm, selectedCategory])

  // Meta tags para SEO
  useEffect(() => {
    if (business) {
      document.title = `${business.name} - Catálogo`

      // Meta description
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute("content", business.description || `Catálogo de productos de ${business.name}`)
      }

      // Open Graph
      const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement("meta")
      ogTitle.setAttribute("property", "og:title")
      ogTitle.setAttribute("content", business.name)
      if (!document.querySelector('meta[property="og:title"]')) {
        document.head.appendChild(ogTitle)
      }

      const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement("meta")
      ogDescription.setAttribute("property", "og:description")
      ogDescription.setAttribute("content", business.description || `Catálogo de productos de ${business.name}`)
      if (!document.querySelector('meta[property="og:description"]')) {
        document.head.appendChild(ogDescription)
      }

      if (business.logoUrl) {
        const ogImage = document.querySelector('meta[property="og:image"]') || document.createElement("meta")
        ogImage.setAttribute("property", "og:image")
        ogImage.setAttribute("content", business.logoUrl)
        if (!document.querySelector('meta[property="og:image"]')) {
          document.head.appendChild(ogImage)
        }
      }
    }
  }, [business])

  if (loading) {
    return (
      <div className="catalog">
        <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: "1rem" }}>Cargando catálogo...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="catalog">
        <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
          <h1>Catálogo no encontrado</h1>
          <p>El catálogo que buscas no existe o no está disponible.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="catalog">
      <HeaderPublic business={business} />

      <main className="catalog-main">
        <div className="container">
          <div className="catalog-controls">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar productos..." />
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          <ProductGrid products={filteredProducts} onProductClick={setSelectedProduct} />
        </div>
      </main>

      {selectedProduct && (
        <ProductModal product={selectedProduct} business={business} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}

export default CatalogPublic
