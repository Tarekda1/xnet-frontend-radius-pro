import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const storedLang = (() => {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem("app.lang") || undefined;
  } catch {
    return undefined;
  }
})();

void i18n.use(initReactI18next).init({
  lng: storedLang ?? "en",
  fallbackLng: "en",
  resources: {
    en: {
      common: {
        shortcuts_title: "Keyboard shortcuts",
        shortcuts_subtitle: "Navigate faster from anywhere in the app.",
        shortcuts_hint: "Press ? when not typing in a field to open this panel.",
        shortcut_palette: "Open command palette",
        shortcut_help: "Open this help panel",
        shortcut_close: "Close dialogs",
        skip_main: "Skip to main content",
        density_label: "Table density",
        density_comfortable: "Comfortable",
        density_compact: "Compact",
        notifications_title: "Notifications",
        notifications_empty: "No invoice notifications yet.",
        activity_title: "Recent activity",
        activity_empty: "No audit entries yet.",
        health_api: "API health",
        health_db: "DB",
        health_srv: "Server",
        health_rtt: "RTT",
        health_strip_hide: "Hide API status bar",
        health_strip_label: "API status bar",
        health_strip_hint: "Shows live latency under the top navigation. You can hide it here or with the ✕ on the bar.",
      },
    },
    es: {
      common: {
        shortcuts_title: "Atajos de teclado",
        shortcuts_subtitle: "Navegue más rápido desde cualquier parte.",
        shortcuts_hint: "Pulse ? cuando no esté escribiendo en un campo para abrir este panel.",
        shortcut_palette: "Abrir paleta de comandos",
        shortcut_help: "Abrir este panel de ayuda",
        shortcut_close: "Cerrar diálogos",
        skip_main: "Ir al contenido principal",
        density_label: "Densidad de tablas",
        density_comfortable: "Cómoda",
        density_compact: "Compacta",
        notifications_title: "Notificaciones",
        notifications_empty: "Aún no hay notificaciones de facturas.",
        activity_title: "Actividad reciente",
        activity_empty: "Aún no hay entradas de auditoría.",
        health_api: "Salud API",
        health_db: "BD",
        health_srv: "Servidor",
        health_rtt: "RTT",
        health_strip_hide: "Ocultar barra de estado API",
        health_strip_label: "Barra de estado API",
        health_strip_hint:
          "Muestra latencia en vivo bajo la barra superior. Ocultar aquí o con ✕ en la barra.",
      },
    },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
