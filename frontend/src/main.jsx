import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./index.css";

// Finds the HTML element where the React application will be displayed
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Unable to start CareerPilot AI because the HTML element with id="root" was not found.',
  );
}

// Starts the React application
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);