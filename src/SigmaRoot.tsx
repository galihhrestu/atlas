import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./sigma/styles/globals.css";
import SigmaApp from "./sigma/App";
import { AppDataProvider } from "./sigma/context/AppDataContext";
import { AuthProvider } from "./sigma/context/AuthContext";
import { ThemeProvider } from "./sigma/context/ThemeContext";
import { getSigmaBasePath } from "./runtime";

export default function SigmaRoot() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "SIGMA Dashboard | ATLAS";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <BrowserRouter basename={getSigmaBasePath()}>
      <ThemeProvider>
        <AuthProvider>
          <AppDataProvider>
            <SigmaApp />
          </AppDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
