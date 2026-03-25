"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
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

const noteCardStyle = {
  background: "var(--board-dialog-input-surface)",
  borderColor: "var(--board-dialog-border)",
} satisfies CSSProperties;

function getAvatarLabel(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return "??";
  }

  return normalized.slice(0, 2).toUpperCase();
}


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
  onOpenChange,
  onUpdateContact,
  open,
  stages,
  viewerId,
}: ContactDialogProps) {
  const { theme } = useTheme();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
        <DialogContent
          className="flex max-h-[80vh] w-[min(95vw,62rem)] flex-col gap-0 overflow-y-auto p-0 sm:rounded-2xl md:p-0 lg:overflow-hidden"
          style={dialogStyle}
        >
          <DialogHeader
            className="mb-0 shrink-0 border-b px-6 py-5 md:px-7"
            style={{ borderColor: "var(--board-dialog-border)" }}
          >
            <DialogTitle className="text-xl font-bold">{card.contact.name}</DialogTitle>
            <DialogDescription className="mt-1">
              Etapa atual: <strong>{currentStageName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div
            className="grid divide-y lg:min-h-0 lg:flex-1 lg:grid-cols-[1.15fr_0.85fr] lg:divide-y-0 lg:divide-x lg:overflow-hidden"
            style={{ borderColor: "var(--board-dialog-border)" }}
          >
            {/* LADO B: FORMULARIO (Mais claro) */}
            <section
              className="space-y-7 px-6 pt-6 pb-8 md:px-7 md:pt-7 md:pb-10 lg:min-h-0 lg:overflow-y-auto lg:pr-5 custom-scrollbar"
              style={{ background: "var(--board-dialog-section-surface)" }}
            >
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)] border-b pb-2" style={{ borderColor: "var(--board-dialog-border)" }}>
                  Ações rápidas
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
                      className="bg-transparent hover:bg-[var(--board-dialog-surface)] hover:text-[var(--foreground)] border-[var(--board-dialog-border)]"
                    >
                      {card.assignedUser?.auth_user_id === viewerId
                        ? "Liberar assinatura"
                        : "Assinar para mim"}
                    </Button>
                  ) : null}
                </div>
                <p className="text-[13px] text-[var(--muted-foreground)]">
                  {card.assignedUser
                    ? `Acompanhado por ${card.assignedUser.name}.`
                    : "Nenhum usuario assinou este card ainda."}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleUpdateContact}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)] border-b pb-2" style={{ borderColor: "var(--board-dialog-border)" }}>
                  Detalhes do contato
                </p>

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

                <div className="flex flex-col-reverse gap-3 mt-1 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    disabled={
                      contactForm.formState.isSubmitting ||
                      noteForm.formState.isSubmitting ||
                      isDeleting
                    }
                    onClick={() => setConfirmDeleteOpen(true)}
                    type="button"
                    variant="ghost"
                    className="text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
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
            </section>

            {/* LADO B: OBSERVACOES (Mais escuro, fundo padrao) */}
            <section
              className="flex flex-col space-y-5 px-6 pt-6 pb-8 md:px-7 md:pt-7 md:pb-10 lg:min-h-0"
              style={{ background: "transparent" }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--board-dialog-border)" }}>
                  <NotebookPen className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--foreground)]">
                    Observações
                  </h3>
                </div>
                <form className="space-y-3" onSubmit={handleAddNote}>
                  <Input
                    className={`${fieldClassName} h-11`}
                    id="note-body"
                    maxLength={1000}
                    placeholder="Escrever um comentário..."
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
                      Salvar
                    </Button>
                  </div>
                </form>
              </div>

              <div className="custom-scrollbar flex-1 space-y-3 pt-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                {card.notes.length ? (
                  card.notes.map((note) => (
                    <article
                      className="flex gap-3"
                      key={note.id}
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
                        {getAvatarLabel(note.authorName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[14px] font-semibold text-[var(--foreground)]">
                            {note.authorName}
                          </span>
                          <span className="text-[13px] text-[var(--muted-foreground)]">
                            {formatDateTime(note.createdAt)}
                          </span>
                        </div>
                        <div
                          className="rounded-[0.65rem] border px-4 py-3 surface-shadow"
                          style={noteCardStyle}
                        >
                          <p className="text-[14px] leading-relaxed text-[var(--card-foreground)] break-words whitespace-pre-wrap">
                            {note.body}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div
                    className="rounded-[0.7rem] border border-dashed px-4 py-8 text-center text-[13px] text-[var(--muted-foreground)]"
                    style={{
                      background: "transparent",
                      borderColor: "var(--board-dialog-border)",
                    }}
                  >
                    Ainda não há observações para {card.contact.name}.
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
              Esta ação remove o card e as observações vinculadas.
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
              Confirmar exclusão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
