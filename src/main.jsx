import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Do not import default Vite App.css to avoid conflicting global styles
// import "./App.css";

createRoot(document.getElementById("root")).render(<App />);
