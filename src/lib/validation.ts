import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

const emailField = z
  .string()
  .trim()
  .email("Informe um e-mail valido.")
  .max(160, "Use no maximo 160 caracteres.");

const passwordField = z
  .string()
  .min(6, "A senha deve ter pelo menos 6 caracteres.")
  .max(72, "Use no maximo 72 caracteres.");

const contactFields = {
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
};

export const contactSchema = z.object(contactFields);

export const updateContactSchema = z.object({
  email: contactFields.email,
  name: contactFields.name,
  origin: contactFields.origin,
  phone: contactFields.phone,
});

export const noteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escreva uma observacao.")
    .max(1000, "Use no maximo 1000 caracteres."),
});

export const changePasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
    currentPassword: z.string().min(1, "Informe a senha atual."),
    password: passwordField,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const moveDealSchema = z.object({
  dealId: z.string().uuid("Deal inválido."),
  stageId: z.string().uuid("Etapa inválida."),
});

export const assignDealSchema = z.object({
  assignedUserId: z.string().uuid("Usuário inválido.").nullable(),
  dealId: z.string().uuid("Deal inválido."),
});

export const stageDraftSchema = z.object({
  id: z.string().min(1, "Etapa inválida."),
  isNew: z.boolean().optional(),
  name: z.string().trim().min(1, "Informe o nome da etapa.").max(80),
  position: z.number().int().min(0),
});

export const saveStagesSchema = z.object({
  drafts: z.array(stageDraftSchema).min(1, "Mantenha ao menos uma etapa."),
});

export const companyStatusSchema = z.enum(["active", "inactive"]);
export const companyUserRoleSchema = z.enum(["admin", "member"]);
export const companyUserStatusSchema = z.enum(["active", "inactive", "deleted"]);

export const memberCreateSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirme a senha."),
    email: emailField,
    name: z.string().trim().min(1, "Informe o nome do usuário.").max(120),
    password: passwordField,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const memberUpdateSchema = z
  .object({
    confirmPassword: z.string().optional().or(z.literal("")),
    email: emailField,
    name: z.string().trim().min(1, "Informe o nome do usuário.").max(120),
    password: z.string().optional().or(z.literal("")),
    status: companyUserStatusSchema.exclude(["deleted"]),
  })
  .superRefine((value, ctx) => {
    const nextPassword = value.password?.trim() ?? "";
    const confirmPassword = value.confirmPassword?.trim() ?? "";

    if (!nextPassword && !confirmPassword) {
      return;
    }

    if (nextPassword.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A senha deve ter pelo menos 6 caracteres.",
        path: ["password"],
      });
    }

    if (nextPassword !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não conferem.",
        path: ["confirmPassword"],
      });
    }
  });

export const companyUserDraftSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirme a senha."),
    email: emailField,
    id: z.string().min(1),
    name: z.string().trim().min(1, "Informe o nome do usuário.").max(120),
    password: passwordField,
    role: companyUserRoleSchema,
    status: companyUserStatusSchema.exclude(["deleted"]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const companyUserCreateSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirme a senha."),
    email: emailField,
    name: z.string().trim().min(1, "Informe o nome do usuário.").max(120),
    password: passwordField,
    role: companyUserRoleSchema,
    status: z.enum(["active", "inactive"]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const companyUserUpdateSchema = z
  .object({
    confirmPassword: z.string().optional().or(z.literal("")),
    email: emailField,
    name: z.string().trim().min(1, "Informe o nome do usuário.").max(120),
    password: z.string().optional().or(z.literal("")),
    role: companyUserRoleSchema,
    status: companyUserStatusSchema.exclude(["deleted"]),
  })
  .superRefine((value, ctx) => {
    const password = value.password?.trim() ?? "";
    const confirmPassword = value.confirmPassword?.trim() ?? "";

    if (!password && !confirmPassword) {
      return;
    }

    if (password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A senha deve ter pelo menos 6 caracteres.",
        path: ["password"],
      });
    }

    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não conferem.",
        path: ["confirmPassword"],
      });
    }
  });

export const companyCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome da empresa.").max(120),
    users: z.array(companyUserDraftSchema).min(1, "Cadastre ao menos um usuário."),
  })
  .superRefine((value, ctx) => {
    const hasActiveAdmin = value.users.some(
      (user) => user.role === "admin" && user.status === "active",
    );

    if (!hasActiveAdmin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cadastre ao menos um admin ativo para a empresa.",
        path: ["users"],
      });
    }
  });

export const companyUpdateSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da empresa.").max(120),
  status: companyStatusSchema,
});

export type ContactSchema = z.infer<typeof contactSchema>;
export type UpdateContactSchema = z.infer<typeof updateContactSchema>;
export type NoteSchema = z.infer<typeof noteSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type MoveDealSchema = z.infer<typeof moveDealSchema>;
export type AssignDealSchema = z.infer<typeof assignDealSchema>;
export type StageDraftSchema = z.infer<typeof stageDraftSchema>;
export type MemberCreateSchema = z.infer<typeof memberCreateSchema>;
export type MemberUpdateSchema = z.infer<typeof memberUpdateSchema>;
export type CompanyCreateSchema = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateSchema = z.infer<typeof companyUpdateSchema>;
export type CompanyUserCreateSchema = z.infer<typeof companyUserCreateSchema>;
export type CompanyUserUpdateSchema = z.infer<typeof companyUserUpdateSchema>;
