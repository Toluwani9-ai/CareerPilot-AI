import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Unable to start CareerPilot AI because the HTML element with id="root" was not found.',
  );
}

/* Create the React root */
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);