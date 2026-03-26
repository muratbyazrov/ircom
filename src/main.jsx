import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import { initMetrika } from "./utils/metrika.js";

initMetrika();

createRoot(document.getElementById("root")).render(
  <App />
);
