import "./polyfills";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App.jsx";
import store from "./store/index.jsx";
import "./styles/globals.css";



const root = ReactDOM.createRoot(document.getElementById("root"));

// wrap the application with AuthProvider
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
