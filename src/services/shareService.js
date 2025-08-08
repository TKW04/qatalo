let toastTimeout = null

export const showToast = (message, duration = 3000) => {
  // Remove existing toast
  const existingToast = document.querySelector(".toast")
  if (existingToast) {
    existingToast.remove()
  }

  // Clear existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }

  // Create new toast
  const toast = document.createElement("div")
  toast.className = "toast"
  toast.textContent = message
  document.body.appendChild(toast)

  // Remove toast after duration
  toastTimeout = setTimeout(() => {
    if (toast.parentNode) {
      toast.remove()
    }
  }, duration)
}

export const shareContent = async (text, url) => {
  // Try Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Catálogo",
        text: text,
        url: url,
      })
      return
    } catch (error) {
      // User cancelled or error occurred, fall back to clipboard
      console.log("Share cancelled or failed:", error)
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(url)
    showToast("Enlace copiado al portapapeles")
  } catch (error) {
    // Final fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = url
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand("copy")
      showToast("Enlace copiado al portapapeles")
    } catch (err) {
      showToast("No se pudo copiar el enlace")
    }

    document.body.removeChild(textArea)
  }
}
