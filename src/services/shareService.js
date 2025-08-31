export const shareContent = async (text, url, showSuccess,showWarning) => {
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
    showSuccess("Enlace copiado al portapapeles")
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
      showSuccess("Enlace copiado al portapapeles")
    } catch (err) {
      showWarning("No se pudo copiar el enlace")
    }

    document.body.removeChild(textArea)
  }
}
