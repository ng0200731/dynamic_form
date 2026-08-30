// Shared domain types — mirror server/src/types.ts

export type FieldType =
  | 'input'
  | 'textarea'
  | 'dropdown'
  | 'radio'
  | 'image'
  | 'button';

export type LinkType = 'page' | 'url' | 'action';
export type LinkAction = 'submit' | 'back' | 'close';
export type LinkOpenIn = 'same' | 'new';

export interface FieldLink {
  type: LinkType;
  targetPageId?: string;
  url?: string;
  action?: LinkAction;
  openIn?: LinkOpenIn;
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  optionListId?: string;
  globalTemplateId?: string;
  link?: FieldLink;
}

export interface Row {
  id: string;
  columns: 1 | 2;
  fields: Field[];
}

// A named list of options owned by a Page. Dropdown/Radio fields can reference
// one of these as their option source instead of inline `options`.
export interface OptionList {
  id: string;
  name: string;
  position: number;
  options: string[];
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  rows: Row[];
  optionLists: OptionList[];
  globalTemplates: GlobalTemplate[];
}

// A reusable form-element template stored globally (not tied to a page).
export interface GlobalTemplate {
  id: string;
  name: string;
  type: FieldType;
  options: string[];
}

export interface PageSummary {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
}

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'input', label: 'Input' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio' },
  { value: 'image', label: 'Image' },
  { value: 'button', label: 'Button' },
];

// Field types that support an options list.
export const OPTION_FIELD_TYPES: FieldType[] = ['dropdown', 'radio'];
