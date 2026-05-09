import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";

// Production console logging cleanup
if (process.env.NODE_ENV === 'production') {
  window.console = Object.assign(window.console, {
    log: () => {},
    info: () => {},
    warn: () => {}
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <HashRouter>
    <App />
  </HashRouter>
);
