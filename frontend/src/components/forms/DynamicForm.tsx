import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useDomain, type DomainField } from '../../contexts/DomainContext';
import { X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DynamicFormProps {
  entity: string; // "Project", "Curriculum", "Resource"
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  className?: string;
}

export function DynamicForm({ entity, values, onChange, className }: DynamicFormProps) {
  const { getDomainFieldsForEntity } = useDomain();
  const fields = getDomainFieldsForEntity(entity);

  const handleFieldChange = (fieldName: string, value: any) => {
    const newValues = { ...values, [fieldName]: value };
    onChange(newValues);
  };

  const handleArrayAdd = (fieldName: string) => {
    const currentArray = Array.isArray(values[fieldName]) ? values[fieldName] : [];
    handleFieldChange(fieldName, [...currentArray, '']);
  };

  const handleArrayRemove = (fieldName: string, index: number) => {
    const currentArray = Array.isArray(values[fieldName]) ? values[fieldName] : [];
    const newArray = currentArray.filter((_: any, i: number) => i !== index);
    handleFieldChange(fieldName, newArray);
  };

  const handleArrayItemChange = (fieldName: string, index: number, value: string) => {
    const currentArray = Array.isArray(values[fieldName]) ? values[fieldName] : [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleFieldChange(fieldName, newArray);
  };

  const renderField = (field: DomainField) => {
    const fieldValue = values[field.fieldName] ?? field.defaultValue ?? '';

    switch (field.fieldType) {
      case 'string':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.fieldName}
              type="text"
              value={typeof fieldValue === 'string' ? fieldValue : ''}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              placeholder={field.label}
              required={field.required}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.fieldName}
              type="number"
              value={typeof fieldValue === 'number' ? fieldValue : (fieldValue || '')}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value ? parseFloat(e.target.value) : 0)}
              placeholder={field.label}
              required={field.required}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <input
              id={field.fieldName}
              type="checkbox"
              checked={fieldValue === true || fieldValue === 'true'}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor={field.fieldName} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'select':
        let options: string[] = [];
        if (field.options) {
          try {
            options = JSON.parse(field.options);
          } catch (e) {
            console.error('Failed to parse select options:', e);
          }
        }

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
              id={field.fieldName}
              value={typeof fieldValue === 'string' ? fieldValue : ''}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required={field.required}
            >
              <option value="">Selecione...</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'array':
        const arrayValue = Array.isArray(fieldValue) ? fieldValue : (fieldValue ? [fieldValue] : []);

        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {arrayValue.map((item: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayItemChange(field.fieldName, index, e.target.value)}
                    placeholder={`${field.label} ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove(field.fieldName, index)}
                    className="h-11 w-11 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleArrayAdd(field.fieldName)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar {field.label}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.fieldName}
              type="text"
              value={typeof fieldValue === 'string' ? fieldValue : String(fieldValue || '')}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              placeholder={field.label}
              required={field.required}
            />
          </div>
        );
    }
  };

  if (fields.length === 0) {
    return null;
  }

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className={cn("space-y-4", className)}>
      {sortedFields.map((field) => renderField(field))}
    </div>
  );
}




