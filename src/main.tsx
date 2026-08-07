import { createRoot } from "react-dom/client";

const root = document.getElementById("root");

if (!root) {
  throw new Error("ATLAS root element was not found.");
}

const rootRenderer = createRoot(root);
const isSigmaRoute = window.location.pathname.split("/").filter(Boolean).includes("sigma");

if (isSigmaRoute) {
  void import("./SigmaRoot").then(({ default: SigmaRoot }) => {
    rootRenderer.render(<SigmaRoot />);
  });
} else {
  void Promise.all([import("./App"), import("./styles.css")]).then(([{ default: AtlasApp }]) => {
    rootRenderer.render(<AtlasApp />);
  });
}
