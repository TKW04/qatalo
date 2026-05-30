import "./polyfills";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
// 1. Importamos las herramientas de TanStack Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App.jsx";
import store from "./store/index.jsx";
import "./styles/globals.css";

// 2. Inicializamos el cliente con configuraciones globales estratégicas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos vivirán en caché y no se volverán a pedir a la API por 5 minutos
      staleTime: 1000 * 60 * 5,
      // Evita hacer llamadas a la base de datos cada vez que el usuario cambia de pestaña en Chrome
      refetchOnWindowFocus: false,
      // Si la API falla por un problema de red, intentará 1 vez más automáticamente
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    {/* 3. Envolvemos la aplicación con el Provider de TanStack */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Provider>
);