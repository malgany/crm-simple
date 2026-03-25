"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeft,
  CircleAlert,
  LoaderCircle,
  Mail,
  MessageCircleMore,
  NotebookPen,
  Phone,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { CSSProperties } from "react";
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
import { useTheme } from "@/components/theme/theme-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ContactDialogProps = {
  canAssign: boolean;
  card: KanbanCard | null;
  initialFocus: "details" | "notes";
  onAssign: (dealId: string, assignedUserId: string | null) => Promise<boolean>;
  onAddNote: (dealId: string, values: NoteSchema) => Promise<boolean>;
  onDeleteContact: (dealId: string) => Promise<boolean>;
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

const fieldClassName =
  "rounded-[0.55rem] border border-[var(--board-dialog-border)] bg-[var(--board-dialog-input-surface)] placeholder:text-[#9fadbc]";

const selectClassName =
  "flex h-11 w-full rounded-[0.55rem] border border-[var(--board-dialog-border)] bg-[var(--board-dialog-input-surface)] px-4 text-sm text-[var(--foreground)] outline-none transition-[border-color,box-shadow,background-color] focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]";

const noteCardStyle = {
  background: "var(--board-dialog-input-surface)",
  borderColor: "var(--board-dialog-border)",
} satisfies CSSProperties;

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
      className="inline-flex items-center gap-2 rounded-[0.55rem] border border-[var(--board-dialog-border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-[background-color,border-color,color] hover:border-white/16 hover:bg-[var(--board-dialog-input-surface)]"
      href={href}
      rel="noreferrer"
      target={
        href.startsWith("mailto:") || href.startsWith("tel:")
          ? undefined
          : "_blank"
      }
    >
      <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
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
  onDeleteContact,
  onMove,
  onOpenChange,
  onUpdateContact,
  open,
  stages,
  viewerId,
}: ContactDialogProps) {
  const { theme } = useTheme();
  const dividerStyle = {
    borderColor:
      theme === "light" ? "rgb(232 234 235)" : "rgba(255, 255, 255, 0.06)",
  } satisfies CSSProperties;
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

    setConfirmDeleteOpen(false);
    setSelectedStageId(card.stageId);
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

  useEffect(() => {
    if (!open) {
      setConfirmDeleteOpen(false);
      setIsDeleting(false);
    }
  }, [open]);

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

  const handleDeleteContact = async () => {
    setIsDeleting(true);

    try {
      const success = await onDeleteContact(card.id);

      if (success) {
        setConfirmDeleteOpen(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const dialogStyle = {
    ["--border" as string]: "var(--board-dialog-border)",
    ["--input-surface" as string]: "var(--board-dialog-input-surface)",
    background: theme === "light" ? "#ffffff" : "var(--board-dialog-surface)",
    borderColor: "var(--board-dialog-border)",
  } satisfies CSSProperties;

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="w-[min(95vw,61rem)]" style={dialogStyle}>
          <DialogHeader className="gap-2">
            <DialogTitle>{card.contact.name}</DialogTitle>
            <DialogDescription>
              Etapa atual: <strong>{currentStageName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-4">
              <div className="space-y-3 border-b pb-4" style={dividerStyle}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Acoes rapidas
                </p>
                <div className="flex flex-wrap gap-2">
                  <ContactShortcut
                    href={whatsappUrl}
                    icon={MessageCircleMore}
                    label="WhatsApp"
                  />
                  <ContactShortcut href={telUrl} icon={Phone} label="Ligar" />
                  <ContactShortcut
                    href={mailtoUrl}
                    icon={Mail}
                    label="E-mail"
                  />
                  {canAssign ? (
                    <Button
                      onClick={handleAssignToggle}
                      type="button"
                      variant="outline"
                    >
                      {card.assignedUser?.auth_user_id === viewerId
                        ? "Liberar assinatura"
                        : "Assinar para mim"}
                    </Button>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {card.assignedUser
                    ? `Acompanhado por ${card.assignedUser.name}.`
                    : "Nenhum usuario assinou este card ainda."}
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleUpdateContact}>
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Nome</Label>
                  <Input
                    className={fieldClassName}
                    id="contact-name"
                    {...contactForm.register("name")}
                  />
                  <p className="text-sm text-[var(--danger)]">
                    {contactForm.formState.errors.name?.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Telefone</Label>
                  <Input
                    className={fieldClassName}
                    id="contact-phone"
                    {...contactForm.register("phone")}
                  />
                  <p className="text-sm text-[var(--danger)]">
                    {contactForm.formState.errors.phone?.message}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">E-mail</Label>
                    <Input
                      className={fieldClassName}
                      id="contact-email"
                      {...contactForm.register("email")}
                    />
                    <p className="text-sm text-[var(--danger)]">
                      {contactForm.formState.errors.email?.message}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-origin">Origem</Label>
                    <Input
                      className={fieldClassName}
                      id="contact-origin"
                      {...contactForm.register("origin")}
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    disabled={
                      contactForm.formState.isSubmitting ||
                      noteForm.formState.isSubmitting ||
                      isDeleting
                    }
                    onClick={() => setConfirmDeleteOpen(true)}
                    type="button"
                    variant="danger"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir contato
                  </Button>
                  <Button
                    disabled={contactForm.formState.isSubmitting || isDeleting}
                    type="submit"
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

              <div className="space-y-2 border-t pt-4" style={dividerStyle}>
                <Label htmlFor="move-stage">Mover para etapa</Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <select
                      className={selectClassName}
                      id="move-stage"
                      onChange={(event) =>
                        setSelectedStageId(event.target.value)
                      }
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
                      noteForm.formState.isSubmitting ||
                      isDeleting
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

            <section
              className="space-y-4 lg:border-l lg:pl-5"
              style={dividerStyle}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <NotebookPen className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    Observacoes
                  </h3>
                </div>
                <form className="space-y-3" onSubmit={handleAddNote}>
                  <Textarea
                    className={`${fieldClassName} min-h-32`}
                    id="note-body"
                    maxLength={1000}
                    placeholder="Ex.: falou que retorna depois do almoco."
                    {...noteForm.register("body")}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[var(--danger)]">
                      {noteForm.formState.errors.body?.message}
                    </p>
                    <Button
                      disabled={noteForm.formState.isSubmitting || isDeleting}
                      type="submit"
                    >
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
                      className="rounded-[0.75rem] border p-4"
                      key={note.id}
                      style={noteCardStyle}
                    >
                      <p className="text-sm leading-6 text-[var(--foreground)]">
                        {note.body}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        {note.authorName} • {formatDateTime(note.createdAt)}
                      </p>
                    </article>
                  ))
                ) : (
                  <div
                    className="rounded-[0.75rem] border border-dashed p-6 text-center text-sm text-[var(--muted-foreground)]"
                    style={{
                      background: "transparent",
                      borderColor: "var(--board-dialog-border)",
                    }}
                  >
                    Ainda nao ha observacoes para {card.contact.name}. O
                    telefone principal e {formatPhone(card.contact.phone)}.
                  </div>
                )}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setConfirmDeleteOpen} open={confirmDeleteOpen}>
        <DialogContent className="w-[min(94vw,28rem)]" style={dialogStyle}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <CircleAlert className="h-5 w-5 text-[var(--danger)]" />
              Excluir contato
            </DialogTitle>
            <DialogDescription>
              Gostaria mesmo de excluir <strong>{card.contact.name}</strong>?
              Esta acao remove o card e as observacoes vinculadas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              disabled={isDeleting}
              onClick={() => setConfirmDeleteOpen(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleDeleteContact}
              type="button"
              variant="danger"
            >
              {isDeleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Confirmar exclusao
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
