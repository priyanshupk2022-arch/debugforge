import { useState, useEffect, useCallback, useRef } from "react";

export interface TelemetryEvent {
  event_id?: string;
  run_id?: string;
  target_id?: string;
  node_id: string; // e.g. "RUN", "BROKEN", "EVIDENCE", "DIAGNOSIS", "PROPOSAL", "GATE", "HEAL", "RE_RUN", "VERIFIED"
  status: "UPCOMING" | "ACTIVE" | "PASS" | "FAIL" | "SUCCESS" | "HEALED" | string;
  message: string;
  payload?: any;
  timestamp: string;
}

export type TelemetryFrame = TelemetryEvent;

export type ConnectionState = "connected" | "reconnecting" | "offline";

export function useTelemetryStream(filterRunId?: string) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<TelemetryEvent | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("offline");
  const [nodeStates, setNodeStates] = useState<Record<string, "UPCOMING" | "ACTIVE" | "PASS" | "FAIL">>({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
    setNodeStates({});
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const sseUrl = `${apiBase}/api/telemetry/stream`;

    try {
      setConnectionState("reconnecting");
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionState("connected");
      };

      es.onmessage = (e) => {
        try {
          if (!e.data || e.data.trim() === ": heartbeat") return;
          const raw = JSON.parse(e.data);
          const event: TelemetryEvent = {
            event_id: raw.event_id || raw.id,
            run_id: raw.run_id,
            target_id: raw.target_id,
            node_id: (raw.node_id || "").toUpperCase(),
            status: (raw.status || "").toUpperCase(),
            message: raw.message || "",
            payload: raw.payload,
            timestamp: raw.timestamp || new Date().toISOString(),
          };

          if (filterRunId && event.run_id && event.run_id !== filterRunId) {
            return;
          }

          setLatestEvent(event);
          setEvents((prev) => [event, ...prev.slice(0, 99)]);

          if (event.node_id) {
            let mappedStatus: "UPCOMING" | "ACTIVE" | "PASS" | "FAIL" = "ACTIVE";
            if (event.status === "PASS" || event.status === "SUCCESS" || event.status === "HEALED" || event.status === "COMPLETED") {
              mappedStatus = "PASS";
            } else if (event.status === "FAIL" || event.status === "FAILED" || event.status === "ERROR") {
              mappedStatus = "FAIL";
            } else if (event.status === "ACTIVE" || event.status === "RUNNING" || event.status === "IN_PROGRESS") {
              mappedStatus = "ACTIVE";
            }

            setNodeStates((prev) => ({
              ...prev,
              [event.node_id]: mappedStatus,
            }));
          }
        } catch (err) {
          // ignore malformed frame
        }
      };

      es.onerror = () => {
        setConnectionState("offline");
        es.close();
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };
    } catch (err) {
      setConnectionState("offline");
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [filterRunId]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return {
    events,
    latestEvent,
    connectionState,
    nodeStates,
    clearEvents,
    reconnect: connect,
  };
}
