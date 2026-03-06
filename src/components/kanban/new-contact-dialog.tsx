"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Stage } from "@/lib/app.types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NewContactDialogProps = {
  onCreate: (values: ContactSchema) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  stages: Stage[];
};

export function NewContactDialog({
  onCreate,
  onOpenChange,
  open,
  stages,
}: NewContactDialogProps) {
  const form = useForm<ContactSchema>({
    defaultValues: {
      email: "",
      name: "",
      origin: "",
      phone: "",
      stageId: stages[0]?.id ?? "",
    },
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        email: "",
        name: "",
        origin: "",
        phone: "",
        stageId: stages[0]?.id ?? "",
      });
      return;
    }

    form.setValue("stageId", stages[0]?.id ?? "");
  }, [form, open, stages]);

  const onSubmit = form.handleSubmit(async (values) => {
    const created = await onCreate(values);

    if (created) {
      onOpenChange(false);
    }
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo contato</DialogTitle>
          <DialogDescription>
            Cadastre um lead com os dados minimos e escolha a etapa inicial.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-contact-name">Nome</Label>
            <Input
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
              id="new-contact-phone"
              placeholder="(65) 99999-1111"
              {...form.register("phone")}
            />
            <p className="text-sm text-[var(--danger)]">
              {form.formState.errors.phone?.message}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-contact-email">E-mail</Label>
              <Input
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
                id="new-contact-origin"
                placeholder="Instagram"
                {...form.register("origin")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-contact-stage">Etapa inicial</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
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
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Cancelar
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
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
