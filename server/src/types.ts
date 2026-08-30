// Shared domain types — keep in sync with src/types.ts

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

// Lightweight page summary used for the navigation tree.
// A reusable form-element template stored globally (not tied to a page).
// Created via the "Global" sidebar action. Fields of matching type can later
// reference these as preset form elements.
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
