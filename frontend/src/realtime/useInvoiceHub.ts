import { useEffect, useState } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { invoiceKeys } from '../api/queries';

/**
 * Keeps a SignalR connection open while signed in. When the server reports an invoice change,
 * every invoice query refetches, so each role sees updates without reloading.
 */
export function useInvoiceHub(token: string | null) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/invoices', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('InvoiceUpdated', () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    });
    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => {
      setConnected(true);
      // We may have missed events while disconnected.
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    });
    connection.onclose(() => setConnected(false));

    let cancelled = false;
    const started = connection
      .start()
      .then(() => !cancelled && setConnected(true))
      .catch(() => !cancelled && setConnected(false));

    return () => {
      cancelled = true;
      // Stopping mid-negotiation logs an error (e.g. StrictMode's double mount in dev), so wait for start to settle.
      void started.then(() => {
        if (connection.state !== HubConnectionState.Disconnected) void connection.stop();
      });
    };
  }, [token, queryClient]);

  return connected;
}
