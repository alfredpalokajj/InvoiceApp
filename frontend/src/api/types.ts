export type Role = 'SuperAdmin' | 'Finance' | 'Courier' | 'Client';

export const ROLES: Role[] = ['SuperAdmin', 'Finance', 'Courier', 'Client'];

export type InvoiceStatus = 'Created' | 'ReadyForDelivery' | 'InTransit' | 'Delivered' | 'Paid';

export const INVOICE_STATUSES: InvoiceStatus[] = ['Created', 'ReadyForDelivery', 'InTransit', 'Delivered', 'Paid'];

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  clientId: number | null;
}

export interface NewUserInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

/** The role can't change after creation. A null password keeps the current one. */
export interface UserUpdateInput {
  fullName: string;
  email: string;
  password: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface ClientInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  password?: string;
}

export interface Courier {
  id: number;
  fullName: string;
  email: string;
}

export interface CourierInput {
  fullName: string;
  email: string;
  password: string;
}

export interface Invoice {
  id: number;
  number: string;
  client: Client;
  courier: Courier | null;
  amount: number;
  currency: string;
  details: string;
  issueDate: string; // yyyy-MM-dd
  dueDate: string; // yyyy-MM-dd
  status: InvoiceStatus;
  createdAt: string;
  readyAt: string | null;
  startedAt: string | null;
  deliveredAt: string | null;
  paidAt: string | null;
}

export interface InvoiceInput {
  clientId: number;
  amount: number;
  currency: string;
  details: string;
  issueDate: string | null;
  dueDate: string;
}
