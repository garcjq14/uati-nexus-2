import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DomainFieldDefinition {
  id: string;
  entity: string;
  fieldName: string;
  fieldType: string;
  label: string;
  required: boolean;
  options?: string | null;
  defaultValue?: string | null;
}

/**
 * Valida campos customizados baseado nas definições de DomainField
 */
export async function validateCustomFields(
  domainId: string | null,
  entity: string,
  customFields: Record<string, any>
): Promise<{ valid: boolean; errors: string[]; sanitized: Record<string, any> }> {
  const errors: string[] = [];
  const sanitized: Record<string, any> = {};

  if (!domainId) {
    // Sem domínio, aceitar qualquer campo customizado sem validação
    return { valid: true, errors: [], sanitized: customFields };
  }

  // Buscar campos definidos para este domínio e entidade
  const fieldDefinitions = await prisma.domainField.findMany({
    where: {
      domainId,
      entity,
      isActive: true,
    },
  });

  // Validar campos obrigatórios
  for (const field of fieldDefinitions) {
    if (field.required) {
      if (customFields[field.fieldName] === undefined || customFields[field.fieldName] === null || customFields[field.fieldName] === '') {
        errors.push(`Campo obrigatório '${field.label}' (${field.fieldName}) não foi fornecido`);
      }
    }

    // Aplicar valor padrão se não fornecido
    if (customFields[field.fieldName] === undefined || customFields[field.fieldName] === null) {
      if (field.defaultValue !== null && field.defaultValue !== undefined) {
        sanitized[field.fieldName] = parseDefaultValue(field.defaultValue, field.fieldType);
      }
    } else {
      // Validar tipo e valor
      const validationResult = validateFieldValue(
        customFields[field.fieldName],
        field.fieldType,
        field.options
      );
      
      if (!validationResult.valid) {
        errors.push(`Campo '${field.label}' (${field.fieldName}): ${validationResult.error}`);
      } else {
        sanitized[field.fieldName] = validationResult.value;
      }
    }
  }

  // Permitir campos adicionais não definidos (flexibilidade)
  for (const [key, value] of Object.entries(customFields)) {
    if (!fieldDefinitions.find(f => f.fieldName === key)) {
      sanitized[key] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Valida um valor individual baseado no tipo do campo
 */
function validateFieldValue(
  value: any,
  fieldType: string,
  options?: string | null
): { valid: boolean; error?: string; value: any } {
  switch (fieldType) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: 'deve ser uma string', value };
      }
      return { valid: true, value: value.trim() };

    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        return { valid: false, error: 'deve ser um número', value };
      }
      return { valid: true, value: numValue };

    case 'boolean':
      if (typeof value === 'string') {
        const boolValue = value.toLowerCase() === 'true' || value === '1';
        return { valid: true, value: boolValue };
      }
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'deve ser um booleano', value };
      }
      return { valid: true, value };

    case 'array':
      if (!Array.isArray(value)) {
        if (typeof value === 'string') {
          // Tentar parsear JSON string
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return { valid: true, value: parsed };
            }
          } catch {
            // Se não for JSON válido, tratar como array de strings separado por vírgula
            const arrayValue = value.split(',').map((item: string) => item.trim()).filter(Boolean);
            return { valid: true, value: arrayValue };
          }
        }
        return { valid: false, error: 'deve ser um array', value };
      }
      return { valid: true, value };

    case 'select':
      if (!options) {
        return { valid: false, error: 'campo select requer opções definidas', value };
      }
      try {
        const optionsArray = JSON.parse(options);
        if (!Array.isArray(optionsArray)) {
          return { valid: false, error: 'opções inválidas para campo select', value };
        }
        if (!optionsArray.includes(value)) {
          return { valid: false, error: `deve ser uma das opções: ${optionsArray.join(', ')}`, value };
        }
        return { valid: true, value };
      } catch {
        return { valid: false, error: 'opções inválidas para campo select', value };
      }

    default:
      return { valid: true, value }; // Tipo desconhecido, aceitar como está
  }
}

/**
 * Aplica valores padrão baseado no tipo
 */
function parseDefaultValue(defaultValue: string, fieldType: string): any {
  switch (fieldType) {
    case 'string':
      return defaultValue;
    case 'number':
      return parseFloat(defaultValue) || 0;
    case 'boolean':
      return defaultValue.toLowerCase() === 'true' || defaultValue === '1';
    case 'array':
      try {
        return JSON.parse(defaultValue);
      } catch {
        return defaultValue.split(',').map((item: string) => item.trim()).filter(Boolean);
      }
    default:
      return defaultValue;
  }
}

/**
 * Obtém campos customizados de uma entidade e aplica valores padrão
 */
export async function getCustomFieldsWithDefaults(
  domainId: string | null,
  entity: string,
  existingCustomFields: Record<string, any> = {}
): Promise<Record<string, any>> {
  if (!domainId) {
    return existingCustomFields;
  }

  const fieldDefinitions = await prisma.domainField.findMany({
    where: {
      domainId,
      entity,
      isActive: true,
    },
    orderBy: { order: 'asc' },
  });

  const result: Record<string, any> = { ...existingCustomFields };

  for (const field of fieldDefinitions) {
    if (result[field.fieldName] === undefined || result[field.fieldName] === null) {
      if (field.defaultValue !== null && field.defaultValue !== undefined) {
        result[field.fieldName] = parseDefaultValue(field.defaultValue, field.fieldType);
      }
    }
  }

  return result;
}

/**
 * Converte customFields JSON string para objeto
 */
export function parseCustomFields(customFields: string | null | undefined): Record<string, any> {
  if (!customFields || customFields === '{}') {
    return {};
  }
  try {
    return JSON.parse(customFields);
  } catch (error) {
    console.error('Failed to parse customFields:', error);
    return {};
  }
}

/**
 * Converte objeto para JSON string de customFields
 */
export function stringifyCustomFields(customFields: Record<string, any>): string {
  if (!customFields || Object.keys(customFields).length === 0) {
    return '{}';
  }
  return JSON.stringify(customFields);
}




