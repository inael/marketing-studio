import { PageHeader } from "@/components/ui";
import { ConfigTabs } from "@/components/config-tabs";
import { Aparencia } from "@/components/aparencia";

export const dynamic = "force-dynamic";

// D47: aba Aparencia, com previa ao vivo de tema e densidade
export default function AparenciaPage() {
  return (
    <>
      <PageHeader title="Configurações" subtitle="Aparência do estúdio neste navegador" />
      <ConfigTabs atual="aparencia" />
      <Aparencia />
    </>
  );
}
