import "./polyfills";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App.jsx";
import store from "./store/index.jsx";
import "./styles/globals.css";

// Inicializamos el cliente de caché de TanStack
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita peticiones a AWS solo por cambiar de pestaña
      retry: 1, // Si falla la conexión, reintenta 1 vez antes de dar error
      staleTime: 1000 * 60 * 5, // La data del catálogo se considera "fresca" por 5 minutos
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Provider>
);