export const ContactTeam = (name, email, message, showError, showSuccess) => {
  return async () => {
    const ContactTeamInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}team/contact`, {
        method: "POST",
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    };

    try {
      const response = await ContactTeamInfo();

      if (response.status === 200) {
        showSuccess("Éxito!", "Mensaje enviado correctamente");
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo enviar el mensaje");
    }
  };
};
