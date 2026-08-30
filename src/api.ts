import type { Page, PageSummary, Row, Field, OptionList } from './types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  listPages: () => request<PageSummary[]>('/pages'),
  getPage: (id: string) => request<Page>(`/pages/${id}`),
  createPage: (name: string, parentId: string | null) =>
    request<PageSummary>('/pages', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    }),
  updatePage: (id: string, patch: { name?: string; parentId?: string | null; order?: number; rows?: Row[] }) =>
    request<Page>(`/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),
  deletePage: (id: string) => request<void>(`/pages/${id}`, { method: 'DELETE' }),
  linkTargets: (id: string) => request<PageSummary[]>(`/pages/${id}/link-targets`),
  optionLists: {
    list: (pageId: string) => request<OptionList[]>(`/pages/${pageId}/option-lists`),
    create: (pageId: string, name: string) =>
      request<OptionList>(`/pages/${pageId}/option-lists`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    rename: (pageId: string, listId: string, name: string) =>
      request<OptionList>(`/pages/${pageId}/option-lists/${listId}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }),
    remove: (pageId: string, listId: string) =>
      request<void>(`/pages/${pageId}/option-lists/${listId}`, { method: 'DELETE' }),
    reorder: (pageId: string, orderedIds: string[]) =>
      request<OptionList[]>(`/pages/${pageId}/option-lists/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds }),
      }),
    addOption: (pageId: string, listId: string, value: string) =>
      request<OptionList>(`/pages/${pageId}/option-lists/${listId}/options`, {
        method: 'POST',
        body: JSON.stringify({ value }),
      }),
    removeOption: (pageId: string, listId: string, value: string) =>
      request<void>(`/pages/${pageId}/option-lists/${listId}/options`, {
        method: 'DELETE',
        body: JSON.stringify({ value }),
      }),
    setOptions: (pageId: string, listId: string, options: string[]) =>
      request<OptionList>(`/pages/${pageId}/option-lists/${listId}/options`, {
        method: 'PUT',
        body: JSON.stringify({ options }),
      }),
  },
};

// Local id generator for unsaved editor rows/fields (replaced server-side on save).
export function localId(): string {
  return 'local-' + Math.random().toString(36).slice(2, 10);
}

export type { Page, PageSummary, Row, Field };
