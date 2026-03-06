import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

export const contactSchema = z.object({
  email: z
    .string()
    .trim()
    .max(120, "Use no maximo 120 caracteres.")
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "Informe um e-mail valido.",
    }),
  name: z.string().trim().min(1, "Informe o nome do contato.").max(120),
  origin: z.string().trim().max(80, "Use no maximo 80 caracteres.").optional(),
  phone: z
    .string()
    .trim()
    .refine((value) => normalizePhone(value).length >= 10, {
      message: "Informe um telefone com pelo menos 10 digitos.",
    }),
  stageId: z.string().uuid("Selecione uma etapa valida."),
});

export const updateContactSchema = contactSchema.omit({ stageId: true });

export const noteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escreva uma observacao.")
    .max(1000, "Use no maximo 1000 caracteres."),
});

export type ContactSchema = z.infer<typeof contactSchema>;
export type UpdateContactSchema = z.infer<typeof updateContactSchema>;
export type NoteSchema = z.infer<typeof noteSchema>;
