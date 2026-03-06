"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  GripVertical,
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
      href={href}
      onClick={(event) => event.stopPropagation()}
      rel="noreferrer"
      target={href.startsWith("mailto:") || href.startsWith("tel:") ? undefined : "_blank"}
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

export function DealCard({
  card,
  onOpenDetails,
  stageId,
}: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      data: {
        dealId: card.id,
        stageId,
      },
      id: card.id,
    });
  const { "aria-describedby": _ariaDescription, ...draggableAttributes } =
    attributes;
  void _ariaDescription;

  const whatsappUrl = buildWhatsappUrl(card.contact.phone);
  const telUrl = buildTelUrl(card.contact.phone);
  const mailtoUrl = buildMailtoUrl(card.contact.email);
  const style = !isDragging && transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <article
      className={cn(
        "surface-shadow cursor-pointer rounded-[1.5rem] border border-white/70 bg-white/95 p-4 transition-transform hover:-translate-y-0.5",
        isDragging && "pointer-events-none opacity-0",
      )}
      onClick={() => onOpenDetails(card.id)}
      ref={setNodeRef}
      style={style}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-950">
            {card.contact.name}
          </h3>
          <p className="text-sm text-slate-600">{formatPhone(card.contact.phone)}</p>
        </div>
        <button
          aria-label="Arrastar card"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:text-slate-950"
          onClick={(event) => event.stopPropagation()}
          type="button"
          {...draggableAttributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {card.contact.origin ? (
          <span className="inline-flex rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-semibold text-[var(--secondary-foreground)]">
            {card.contact.origin}
          </span>
        ) : null}
        <span className="inline-flex rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600">
          {card.assignedUser ? `Assinado: ${card.assignedUser.name}` : "Sem assinar"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <QuickAction href={whatsappUrl} icon={MessageCircleMore} label="WhatsApp" />
          <QuickAction href={telUrl} icon={Phone} label="Telefone" />
          <QuickAction href={mailtoUrl} icon={Mail} label="E-mail" />
        </div>
        <div className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600">
          {card.notes.length} nota{card.notes.length === 1 ? "" : "s"}
        </div>
      </div>
    </article>
  );
}
