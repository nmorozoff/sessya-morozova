import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { captureVisitAttribution } from "./lib/utm";
import "./index.css";

captureVisitAttribution();

createRoot(document.getElementById("root")!).render(<App />);
