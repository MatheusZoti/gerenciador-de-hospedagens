import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Reservas" };

export default function ReservasPage() {
  return (
    <ComingSoon
      title="Reservas"
      description="Calendário único com reservas diretas e do Airbnb, sem conflito de datas."
      phase="Fase 2"
      icon={CalendarDays}
      features={[
        "Calendário por imóvel com reservas diretas e do Airbnb",
        "Importação automática do iCal do Airbnb a cada 15 minutos",
        "Exportação de iCal para o Airbnb bloquear as datas das reservas diretas",
        "Converter lead em reserva e detectar conflitos de datas",
        "Fase 5: integração com o novo site de reservas pela API pública",
      ]}
    />
  );
}
