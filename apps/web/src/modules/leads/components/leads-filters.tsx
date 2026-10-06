import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

interface Option {
  value: string;
  label: string;
}

export interface LeadsFilterValues {
  busca?: string;
  etapa?: string;
  origem?: string;
  imovel?: string;
}

/** Filtros por GET: a URL guarda o estado e funciona sem JavaScript. */
export function LeadsFilters({
  values,
  stages,
  sources,
  properties,
}: {
  values: LeadsFilterValues;
  stages: Option[];
  sources: Option[];
  properties: Option[];
}) {
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <form
      method="get"
      aria-label="Filtrar leads"
      className="grid gap-3 rounded-xl border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="busca">Buscar</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="busca"
            name="busca"
            defaultValue={values.busca}
            placeholder="Nome, e-mail ou telefone"
            className="pl-9"
          />
        </div>
      </div>
      <FilterSelect id="etapa" label="Etapa" value={values.etapa} options={stages} />
      <FilterSelect id="origem" label="Origem" value={values.origem} options={sources} />
      <FilterSelect id="imovel" label="Imóvel" value={values.imovel} options={properties} />
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="flex-1 lg:flex-none">
          Filtrar
        </Button>
        {hasFilters ? (
          <Button asChild variant="ghost">
            <Link href="/leads">Limpar</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
}: {
  id: string;
  label: string;
  value?: string;
  options: Option[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} name={id} defaultValue={value ?? ""}>
        <option value="">Todas</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
