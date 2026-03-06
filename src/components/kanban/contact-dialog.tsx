"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeft,
  LoaderCircle,
  Mail,
  MessageCircleMore,
  NotebookPen,
  Phone,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { KanbanCard, Stage } from "@/lib/app.types";
import type { NoteSchema, UpdateContactSchema } from "@/lib/validation";
import { noteSchema, updateContactSchema } from "@/lib/validation";
import {
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsappUrl,
  formatDateTime,
  formatPhone,
} from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";

type ContactDialogProps = {
  canAssign: boolean;
  card: KanbanCard | null;
  initialFocus: "details" | "notes";
  onAssign: (dealId: string, assignedUserId: string | null) => Promise<boolean>;
  onAddNote: (dealId: string, values: NoteSchema) => Promise<boolean>;
  onMove: (dealId: string, stageId: string) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  onUpdateContact: (
    dealId: string,
    values: UpdateContactSchema,
  ) => Promise<boolean>;
  open: boolean;
  stages: Stage[];
  viewerId: string;
};

function ContactShortcut({
  href,
  icon: Icon,
  label,
}: {
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!href) {
    return null;
  }

  return (
    <a
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
      href={href}
      rel="noreferrer"
      target={href.startsWith("mailto:") || href.startsWith("tel:") ? undefined : "_blank"}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

export function ContactDialog({
  canAssign,
  card,
  initialFocus,
  onAssign,
  onAddNote,
  onMove,
  onOpenChange,
  onUpdateContact,
  open,
  stages,
  viewerId,
}: ContactDialogProps) {
  const [selectedStageId, setSelectedStageId] = useState(card?.stageId ?? "");
  const contactForm = useForm<UpdateContactSchema>({
    defaultValues: {
      email: "",
      name: "",
      origin: "",
      phone: "",
    },
    resolver: zodResolver(updateContactSchema),
  });
  const noteForm = useForm<NoteSchema>({
    defaultValues: {
      body: "",
    },
    resolver: zodResolver(noteSchema),
  });

  useEffect(() => {
    if (!card) {
      return;
    }

    contactForm.reset({
      email: card.contact.email ?? "",
      name: card.contact.name,
      origin: card.contact.origin ?? "",
      phone: card.contact.phone,
    });
    noteForm.reset({ body: "" });
  }, [card, contactForm, noteForm]);

  useEffect(() => {
    if (!open || initialFocus !== "notes" || !card) {
      return;
    }

    const frame = requestAnimationFrame(() => noteForm.setFocus("body"));

    return () => cancelAnimationFrame(frame);
  }, [card, initialFocus, noteForm, open]);

  if (!card) {
    return null;
  }

  const whatsappUrl = buildWhatsappUrl(card.contact.phone);
  const telUrl = buildTelUrl(card.contact.phone);
  const mailtoUrl = buildMailtoUrl(card.contact.email);
  const currentStageName =
    stages.find((stage) => stage.id === card.stageId)?.name ?? "Etapa atual";

  const handleUpdateContact = contactForm.handleSubmit(async (values) => {
    await onUpdateContact(card.id, values);
  });

  const handleAddNote = noteForm.handleSubmit(async (values) => {
    const success = await onAddNote(card.id, values);

    if (success) {
      noteForm.reset({ body: "" });
      requestAnimationFrame(() => noteForm.setFocus("body"));
    }
  });

  const handleMove = async () => {
    if (!selectedStageId || selectedStageId === card.stageId) {
      return;
    }

    const moved = await onMove(card.id, selectedStageId);

    if (!moved) {
      setSelectedStageId(card.stageId);
    }
  };

  const handleAssignToggle = async () => {
    await onAssign(
      card.id,
      card.assignedUser?.auth_user_id === viewerId ? null : viewerId,
    );
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,60rem)]">
        <DialogHeader>
          <DialogTitle>{card.contact.name}</DialogTitle>
          <DialogDescription>
            Etapa atual: <strong>{currentStageName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Acoes rapidas
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <ContactShortcut
                  href={whatsappUrl}
                  icon={MessageCircleMore}
                  label="WhatsApp"
                />
                <ContactShortcut href={telUrl} icon={Phone} label="Ligar" />
                <ContactShortcut href={mailtoUrl} icon={Mail} label="E-mail" />
                {canAssign ? (
                  <Button onClick={handleAssignToggle} type="button" variant="outline">
                    {card.assignedUser?.auth_user_id === viewerId
                      ? "Liberar assinatura"
                      : "Assinar para mim"}
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {card.assignedUser
                  ? `Acompanhado por ${card.assignedUser.name}.`
                  : "Nenhum usuario assinou este card ainda."}
              </p>
            </div>
            <form className="space-y-5" onSubmit={handleUpdateContact}>
              <div className="space-y-2">
                <Label htmlFor="contact-name">Nome</Label>
                <Input id="contact-name" {...contactForm.register("name")} />
                <p className="text-sm text-[var(--danger)]">
                  {contactForm.formState.errors.name?.message}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Telefone</Label>
                <Input id="contact-phone" {...contactForm.register("phone")} />
                <p className="text-sm text-[var(--danger)]">
                  {contactForm.formState.errors.phone?.message}
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">E-mail</Label>
                  <Input id="contact-email" {...contactForm.register("email")} />
                  <p className="text-sm text-[var(--danger)]">
                    {contactForm.formState.errors.email?.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-origin">Origem</Label>
                  <Input id="contact-origin" {...contactForm.register("origin")} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={contactForm.formState.isSubmitting}
                  type="submit"
                  variant="secondary"
                >
                  {contactForm.formState.isSubmitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar contato
                </Button>
              </div>
            </form>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="move-stage">Mover para etapa</Label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                    id="move-stage"
                    onChange={(event) => setSelectedStageId(event.target.value)}
                    value={selectedStageId}
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  disabled={
                    !selectedStageId ||
                    selectedStageId === card.stageId ||
                    contactForm.formState.isSubmitting ||
                    noteForm.formState.isSubmitting
                  }
                  onClick={handleMove}
                  type="button"
                  variant="outline"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Mover
                </Button>
              </div>
            </div>
          </section>
          <section className="space-y-5">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="text-lg font-semibold text-slate-950">
                  Observacoes
                </h3>
              </div>
              <form className="space-y-3" onSubmit={handleAddNote}>
                <Textarea
                  id="note-body"
                  maxLength={1000}
                  placeholder="Ex.: falou que retorna depois do almoco."
                  {...noteForm.register("body")}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--danger)]">
                    {noteForm.formState.errors.body?.message}
                  </p>
                  <Button disabled={noteForm.formState.isSubmitting} type="submit">
                    {noteForm.formState.isSubmitting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : null}
                    Registrar observacao
                  </Button>
                </div>
              </form>
            </div>
            <div className="space-y-3">
              {card.notes.length ? (
                card.notes.map((note) => (
                  <article
                    className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4"
                    key={note.id}
                  >
                    <p className="text-sm leading-6 text-slate-700">{note.body}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {note.authorName} • {formatDateTime(note.createdAt)}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
                  Ainda nao ha observacoes para {card.contact.name}. O telefone
                  principal e {formatPhone(card.contact.phone)}.
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
