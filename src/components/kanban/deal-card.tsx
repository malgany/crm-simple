"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Mail,
  MessageCircleMore,
  Phone,
} from "lucide-react";
import {
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsappUrl,
  cn,
  formatPhone,
} from "@/lib/utils";
import type { KanbanCard } from "@/lib/app.types";

type DealCardProps = {
  card: KanbanCard;
  contextLabel?: string | null;
  draggable?: boolean;
  className?: string;
  isSimpleMode?: boolean;
  onOpenDetails: (dealId: string) => void;
  stageId: string;
};

function QuickAction({
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
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[0.55rem] border border-[var(--border)] bg-[var(--input-surface)] text-[var(--muted-foreground)] transition-[background-color,border-color,color] hover:border-white/16 hover:bg-[var(--subtle-surface)] hover:text-[var(--foreground)]"
      href={href}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      rel="noreferrer"
      target={href.startsWith("mailto:") || href.startsWith("tel:") ? undefined : "_blank"}
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

export function DealCard({
  card,
  contextLabel,
  draggable = true,
  className,
  isSimpleMode = false,
  onOpenDetails,
  stageId,
}: DealCardProps) {
  const {
    attributes,
    isDragging,
    isOver,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    data: {
      dealId: card.id,
      stageId,
      type: "card",
    },
    disabled: !draggable,
    id: card.id,
  });
  const { "aria-describedby": _ariaDescription, ...draggableAttributes } = attributes;
  void _ariaDescription;

  const whatsappUrl = buildWhatsappUrl(card.contact.phone);
  const telUrl = buildTelUrl(card.contact.phone);
  const mailtoUrl = buildMailtoUrl(card.contact.email);
  const style = {
    background: "var(--board-card-surface)",
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      className={cn(
        "surface-shadow cursor-pointer rounded-[0.5rem] border border-transparent p-3 transition-[border-color,box-shadow,transform] hover:!border-[var(--board-card-hover-border)] focus-visible:!border-[var(--board-card-hover-border)] focus-visible:outline-none",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "pointer-events-none opacity-0",
        isOver && !isDragging && "border-white/20",
        className,
      )}
      onClick={() => onOpenDetails(card.id)}
      ref={setNodeRef}
      style={style}
      {...(draggable ? draggableAttributes : {})}
      {...(draggable ? listeners : {})}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-5 text-[var(--foreground)]">
            {card.contact.name}
          </h3>
          {!isSimpleMode ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatPhone(card.contact.phone)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {contextLabel ? (
          <span className="inline-flex rounded-[0.5rem] border border-[var(--border)] bg-[var(--subtle-surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
            {contextLabel}
          </span>
        ) : null}
        {card.contact.origin ? (
          <span className="inline-flex rounded-[0.5rem] border border-[var(--border)] bg-[var(--secondary)] px-3 py-1 text-xs font-semibold text-[var(--secondary-foreground)]">
            {card.contact.origin}
          </span>
        ) : null}
        <span
          className="inline-flex rounded-[0.5rem] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]"
          style={{ background: "var(--subtle-surface)" }}
        >
          {card.assignedUser ? `Assinado: ${card.assignedUser.name}` : "Sem assinar"}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {!isSimpleMode ? (
            <>
              <QuickAction href={whatsappUrl} icon={MessageCircleMore} label="WhatsApp" />
              <QuickAction href={telUrl} icon={Phone} label="Telefone" />
              <QuickAction href={mailtoUrl} icon={Mail} label="E-mail" />
            </>
          ) : null}
        </div>
        <div
          className="rounded-[0.5rem] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]"
          style={{ background: "var(--subtle-surface)" }}
        >
          {card.notes.length} nota{card.notes.length === 1 ? "" : "s"}
        </div>
      </div>
    </article>
  );
}
