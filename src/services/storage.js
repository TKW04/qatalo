import { Currency } from "lucide-react"

const STORAGE_KEY = "catalog_app_data"

const defaultData = {
  business: {
    name: "Mi Tienda",
    slug: "mi-tienda",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Wikimedia_Brand_Guidelines_Update_2022_Wikimedia_Logo_Brandmark.png",
    phone: "18095551234",
    description: "Productos artesanales hechos a mano",
  },
  categories: [
    { id: "cat-1", name: "Ropa", slug: "ropa" },
    { id: "cat-2", name: "Accesorios", slug: "accesorios" },
  ],
  products: [
    {
      id: "prod-1",
      name: "Camisa de lino",
      description: "Camisa fresca 100% lino, perfecta para el verano.",
      price: 1850.0,
      currency: "RD$",
      imagesUrl: ["https://qatalo.s3.us-east-1.amazonaws.com/demo/white-linen-shirt.png"],
      categoryId: "cat-1",
      available: true,
      order: 1,
    },
    {
      id: "prod-2",
      name: "Gafas de sol",
      description: "Gafas de sol con protección UV, estilo moderno.",
      price: 750.0,
      currency: "RD$",
      imagesUrl: ["https://qatalo.s3.us-east-1.amazonaws.com/demo/black-sunglasses.png"],
      categoryId: "cat-2",
      available: true,
      order: 2,
    },
    {
      id: "prod-3",
      name: "Bolso de cuero",
      description: "Bolso artesanal de cuero genuino, hecho a mano.",
      price: 2500.0,
      currency: "RD$",
      imagesUrl: ["https://qatalo.s3.us-east-1.amazonaws.com/demo/marron-leather-bag.png"],
      categoryId: "cat-2",
      available: false,
      order: 3,
    },
  ],
}

export const getData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : defaultData
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return defaultData
  }
}

export const setData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Error writing to localStorage:", error)
  }
}

export const seedDataIfEmpty = () => {
  const existingData = localStorage.getItem(STORAGE_KEY)
  if (!existingData) {
    setData(defaultData)
  }
}

// Business data functions
export const getBusinessData = () => {
  const data = getData()
  return data.business
}

export const setBusinessData = (business) => {
  const data = getData()
  data.business = business
  setData(data)
}

// Categories data functions
export const getCategoriesData = () => {
  const data = getData()
  return data.categories
}

export const setCategoriesData = (categories) => {
  const data = getData()
  data.categories = categories
  setData(data)
}

// Products data functions
export const getProductsData = () => {
  const data = getData()
  return data.products
}

export const setProductsData = (products) => {
  const data = getData()
  data.products = products
  setData(data)
}
