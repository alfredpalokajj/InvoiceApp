import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Client, ClientInput, Courier, CourierInput, Invoice, InvoiceInput } from './types';

// Every invoice query key starts with 'invoices' so one realtime event can refresh them all.
export const invoiceKeys = {
  all: ['invoices'] as const,
  list: () => ['invoices', 'list'] as const,
  detail: (id: number) => ['invoices', 'detail', id] as const,
};

export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.list(),
    queryFn: async () => (await api.get<Invoice[]>('/invoices')).data,
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: invoiceKeys.detail(id ?? 0),
    queryFn: async () => (await api.get<Invoice>(`/invoices/${id}`)).data,
    enabled: id !== undefined,
    retry: false,
  });
}

export function useSaveInvoice(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InvoiceInput) =>
      id
        ? (await api.put<Invoice>(`/invoices/${id}`, input)).data
        : (await api.post<Invoice>('/invoices', input)).data,
    onSuccess: (invoice) => {
      qc.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      qc.invalidateQueries({ queryKey: invoiceKeys.list() });
    },
  });
}

export type InvoiceAction = 'start' | 'deliver' | 'pay';

/** Status changes. `ready` needs a courier; the rest take no body. */
export function useInvoiceTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number; action: InvoiceAction } | { id: number; action: 'ready'; courierId: number }) => {
      const body = args.action === 'ready' ? { courierId: args.courierId } : undefined;
      return (await api.post<Invoice>(`/invoices/${args.id}/${args.action}`, body)).data;
    },
    onSuccess: (invoice) => {
      qc.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      qc.invalidateQueries({ queryKey: invoiceKeys.list() });
    },
  });
}

export async function downloadInvoicePdf(invoice: Pick<Invoice, 'id' | 'number'>, lang: string) {
  const res = await api.get<Blob>(`/invoices/${invoice.id}/pdf`, { params: { lang }, responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.number}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await api.get<Client[]>('/clients')).data,
  });
}

export function useClient(id: number | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => (await api.get<Client>(`/clients/${id}`)).data,
    enabled: id !== undefined,
  });
}

export function useSaveClient(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput) =>
      id ? (await api.put<Client>(`/clients/${id}`, input)).data : (await api.post<Client>('/clients', input)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      // Invoices embed client details.
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useCouriers() {
  return useQuery({
    queryKey: ['couriers'],
    queryFn: async () => (await api.get<Courier[]>('/couriers')).data,
  });
}

export function useCreateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CourierInput) => (await api.post<Courier>('/couriers', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['couriers'] }),
  });
}
