"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { CSSProperties } from "react";
import type { Stage } from "@/lib/app.types";
import { resolveInitialContactStageId } from "@/lib/kanban";
import type { ContactSchema } from "@/lib/validation";
import { contactSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme/theme-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NewContactDialogProps = {
  initialStageId?: string | null;
  onCreate: (values: ContactSchema) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  stages: Stage[];
};

const fieldClassName =
  "rounded-[0.55rem] border border-[var(--board-dialog-border)] bg-[var(--board-dialog-input-surface)] placeholder:text-[#9fadbc]";

const selectClassName =
  "flex h-11 w-full rounded-[0.55rem] border border-[var(--board-dialog-border)] bg-[var(--board-dialog-input-surface)] px-4 text-sm text-[var(--foreground)] outline-none transition-[border-color,box-shadow,background-color] focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]";

export function NewContactDialog({
  initialStageId,
  onCreate,
  onOpenChange,
  open,
  stages,
}: NewContactDialogProps) {
  const { theme } = useTheme();
  const form = useForm<ContactSchema>({
    defaultValues: {
      email: "",
      name: "",
      origin: "",
      phone: "",
      stageId: resolveInitialContactStageId(stages, initialStageId),
    },
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    const stageId = resolveInitialContactStageId(stages, initialStageId);

    form.reset({
      email: "",
      name: "",
      origin: "",
      phone: "",
      stageId,
    });
  }, [form, initialStageId, open, stages]);

  const onSubmit = form.handleSubmit(async (values) => {
    const created = await onCreate(values);

    if (created) {
      onOpenChange(false);
    }
  });

  const dialogStyle = {
    ["--border" as string]: "var(--board-dialog-border)",
    ["--input-surface" as string]: "var(--board-dialog-input-surface)",
    background: theme === "light" ? "#ffffff" : "var(--board-dialog-surface)",
    borderColor: "var(--board-dialog-border)",
  } satisfies CSSProperties;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,39rem)]" style={dialogStyle}>
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            <Plus className="h-4 w-4 text-[var(--primary)]" />
            Novo lead
          </div>
          <DialogTitle>Novo contato</DialogTitle>
          <DialogDescription>
            Cadastre os dados principais e escolha a etapa inicial do card.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-contact-name">Nome</Label>
            <Input
              autoFocus
              className={fieldClassName}
              id="new-contact-name"
              placeholder="Ex.: Maria Oliveira"
              {...form.register("name")}
            />
            <p className="text-sm text-[var(--danger)]">
              {form.formState.errors.name?.message}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-contact-phone">Telefone</Label>
            <Input
              className={fieldClassName}
              id="new-contact-phone"
              placeholder="(65) 99999-1111"
              {...form.register("phone")}
            />
            <p className="text-sm text-[var(--danger)]">
              {form.formState.errors.phone?.message}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-contact-email">E-mail</Label>
              <Input
                className={fieldClassName}
                id="new-contact-email"
                placeholder="maria@empresa.com"
                {...form.register("email")}
              />
              <p className="text-sm text-[var(--danger)]">
                {form.formState.errors.email?.message}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-contact-origin">Origem</Label>
              <Input
                className={fieldClassName}
                id="new-contact-origin"
                placeholder="Instagram"
                {...form.register("origin")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-contact-stage">Etapa inicial</Label>
            <select
              className={selectClassName}
              id="new-contact-stage"
              {...form.register("stageId")}
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-[var(--danger)]">
              {form.formState.errors.stageId?.message}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button
              className="sm:min-w-32"
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="sm:min-w-40"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Criar contato
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
