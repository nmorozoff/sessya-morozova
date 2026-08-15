import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { captureUtmFromUrl } from "./lib/utm";
import "./index.css";

captureUtmFromUrl();

createRoot(document.getElementById("root")!).render(<App />);
