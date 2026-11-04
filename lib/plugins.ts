export type PluginCategory = "İletişim" | "Satış" | "Operasyon" | "Analiz";

export type BusinessPlugin = {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  icon: string;
  status: "available" | "connection-required";
};

// Add integrations here. Keep credentials server-side; never expose secrets to the browser.
export const businessPlugins: BusinessPlugin[] = [
  { id: "reports", name: "Akıllı raporlar", description: "Satış ve operasyon verilerini özetle", category: "Analiz", icon: "◫", status: "available" },
  { id: "crm", name: "CRM bağlantısı", description: "Müşteri kayıtları ve fırsat takibi", category: "Satış", icon: "◎", status: "connection-required" },
  { id: "email", name: "E-posta asistanı", description: "Yanıt taslakları ve gelen kutusu akışları", category: "İletişim", icon: "✉", status: "connection-required" },
  { id: "calendar", name: "Takvim", description: "Toplantı ve görev planlama", category: "Operasyon", icon: "▦", status: "connection-required" },
];

export function getPluginContext(enabled: string[]) {
  return businessPlugins
    .filter((plugin) => enabled.includes(plugin.id) && plugin.status === "available")
    .map((plugin) => plugin.name + ": " + plugin.description)
    .join("\n");
}
