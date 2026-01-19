// Runtime env template (production).
// This file is processed by envsubst at container start to generate /env.js.
window.__ENV__ = {
  API_URL: "${API_URL}",
  // Optional: NAS config (used by Online Users "Disconnect" action)
  DEFAULT_NAS_IP: "${DEFAULT_NAS_IP}",
  DEFAULT_NAS_SECRET: "${DEFAULT_NAS_SECRET}",
  DEFAULT_NAS_COA_PORT: "${DEFAULT_NAS_COA_PORT}",
};

