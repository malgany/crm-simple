import "server-only";
import { z } from "zod";
import { getSiteLeadIntegrationEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeOptionalText, normalizePhone } from "@/lib/utils";

export const siteLeadIngestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail valido.")
    .max(120, "Use no maximo 120 caracteres."),
  name: z.string().trim().min(1, "Informe o nome do contato.").max(120),
  note: z
    .string()
    .trim()
    .max(1000, "Use no maximo 1000 caracteres.")
    .nullable(),
  origin: z.string().trim().min(1, "Informe a origem do lead.").max(80),
  phone: z
    .string()
    .trim()
    .refine((value) => normalizePhone(value).length >= 10, {
      message: "Informe um telefone com pelo menos 10 digitos.",
    }),
  submittedAt: z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Informe uma data de envio valida.",
  }),
});

export type SiteLeadIngestInput = z.infer<typeof siteLeadIngestSchema>;
export type SiteLeadIngestResult = {
  action: "created" | "updated";
  message: string;
};

function limitNote(body: string) {
  return body.length <= 1000 ? body : `${body.slice(0, 997)}...`;
}

function buildReentryNote(input: SiteLeadIngestInput) {
  const lines = [`Reenvio recebido via ${input.origin}.`, `Enviado em: ${input.submittedAt}`];

  if (input.note) {
    lines.push("", input.note);
  }

  return limitNote(lines.join("\n"));
}

async function resolveStageId(companyId: string) {
  const supabase = createAdminSupabaseClient();
  const { stageId: configuredStageId } = getSiteLeadIntegrationEnv();

  if (configuredStageId) {
    const { data, error } = await supabase
      .from("stages")
      .select("id")
      .eq("company_id", companyId)
      .eq("id", configuredStageId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data.id;
    }
  }

  const { data: prospectionStage, error: prospectionError } = await supabase
    .from("stages")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", "Prospeccao")
    .maybeSingle();

  if (prospectionError) {
    throw new Error(prospectionError.message);
  }

  if (prospectionStage) {
    return prospectionStage.id;
  }

  const { data: fallbackStage, error: fallbackError } = await supabase
    .from("stages")
    .select("id")
    .eq("company_id", companyId)
    .order("position")
    .limit(1)
    .maybeSingle();

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  if (!fallbackStage) {
    throw new Error("Nenhuma etapa encontrada para receber leads do site.");
  }

  return fallbackStage.id;
}

async function ensureDeal(companyId: string, contactId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: existingDeal, error: existingDealError } = await supabase
    .from("deals")
    .select("id")
    .eq("company_id", companyId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (existingDealError) {
    throw new Error(existingDealError.message);
  }

  if (existingDeal) {
    return existingDeal.id;
  }

  const stageId = await resolveStageId(companyId);
  const { data: createdDeal, error: createdDealError } = await supabase
    .from("deals")
    .insert({
      company_id: companyId,
      contact_id: contactId,
      stage_id: stageId,
    })
    .select("id")
    .single();

  if (createdDealError) {
    throw new Error(createdDealError.message);
  }

  return createdDeal.id;
}

async function insertNote(dealId: string, body: string | null) {
  const supabase = createAdminSupabaseClient();
  const normalizedBody = normalizeOptionalText(body ?? undefined);

  if (!normalizedBody) {
    return;
  }

  const { error } = await supabase.from("notes").insert({
    author_name: "Integracao do site",
    body: limitNote(normalizedBody),
    deal_id: dealId,
    author_user_id: null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function ingestSiteLead(
  input: SiteLeadIngestInput,
): Promise<SiteLeadIngestResult> {
  const supabase = createAdminSupabaseClient();
  const { companyId } = getSiteLeadIntegrationEnv();
  const phone = input.phone.trim();
  const phoneNormalized = normalizePhone(phone);
  const email = normalizeOptionalText(input.email);
  const origin = normalizeOptionalText(input.origin);

  const { data: existingContact, error: existingContactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("company_id", companyId)
    .eq("phone_normalized", phoneNormalized)
    .maybeSingle();

  if (existingContactError) {
    throw new Error(existingContactError.message);
  }

  if (existingContact) {
    const { error: updatedContactError } = await supabase
      .from("contacts")
      .update({
        email,
        name: input.name.trim(),
        origin,
        phone,
        phone_normalized: phoneNormalized,
      })
      .eq("id", existingContact.id)
      .eq("company_id", companyId);

    if (updatedContactError) {
      throw new Error(updatedContactError.message);
    }

    const dealId = await ensureDeal(companyId, existingContact.id);
    await insertNote(dealId, buildReentryNote(input));

    return {
      action: "updated",
      message: "Lead atualizado no CRM.",
    };
  }

  const stageId = await resolveStageId(companyId);
  const { data: createdContact, error: createdContactError } = await supabase
    .from("contacts")
    .insert({
      company_id: companyId,
      email,
      name: input.name.trim(),
      origin,
      phone,
      phone_normalized: phoneNormalized,
    })
    .select("id")
    .single();

  if (createdContactError) {
    throw new Error(createdContactError.message);
  }

  const { data: createdDeal, error: createdDealError } = await supabase
    .from("deals")
    .insert({
      company_id: companyId,
      contact_id: createdContact.id,
      stage_id: stageId,
    })
    .select("id")
    .single();

  if (createdDealError) {
    throw new Error(createdDealError.message);
  }

  await insertNote(createdDeal.id, input.note);

  return {
    action: "created",
    message: "Lead recebido no CRM.",
  };
}
