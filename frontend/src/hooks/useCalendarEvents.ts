import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { MyClassRequest } from '@/hooks/useMyClassRequests';
import type { EducatorClassRequest } from '@/hooks/useEducatorClassRequests';

export interface CalendarEvent {
  id: number;
  date: string;
  startTime: string;
  durationMinutes: number;
  className: string | null;
  counterpartName: string | null;
  counterpartPhoto: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

interface TalentResponse  { requests: MyClassRequest[] }
interface EducatorResponse { requests: EducatorClassRequest[] }

function fromTalent(r: MyClassRequest): CalendarEvent {
  return {
    id: r.id,
    date: r.requested_date,
    startTime: r.start_time,
    durationMinutes: r.duration_minutes,
    className: r.class_name,
    counterpartName: r.issuer_organization,
    counterpartPhoto: r.issuer_photo,
    status: r.status,
  };
}

function fromEducator(r: EducatorClassRequest): CalendarEvent {
  return {
    id: r.id,
    date: r.requested_date,
    startTime: r.start_time,
    durationMinutes: r.duration_minutes,
    className: r.class_name,
    counterpartName: r.student_name,
    counterpartPhoto: null,
    status: r.status,
  };
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const isEducator = user?.role === 'issuer';

  const talentQuery = useQuery<MyClassRequest[]>({
    queryKey: ['my-class-requests'],
    queryFn: () => api.get<TalentResponse>('/api/class-requests/sent').then(r => r.requests),
    enabled: !isEducator,
    staleTime: 30_000,
  });

  const educatorQuery = useQuery<EducatorClassRequest[]>({
    queryKey: ['class-requests', 'educator-mine'],
    queryFn: () => api.get<EducatorResponse>('/api/class-requests/mine').then(r => r.requests),
    enabled: isEducator,
    staleTime: 30_000,
  });

  const raw = isEducator ? educatorQuery.data : talentQuery.data;
  const isPending = isEducator ? educatorQuery.isPending : talentQuery.isPending;

  const events = useMemo<CalendarEvent[]>(() => {
    if (!raw) return [];
    return (raw as (MyClassRequest | EducatorClassRequest)[])
      .filter(r => r.status !== 'cancelled')
      .map(r => isEducator ? fromEducator(r as EducatorClassRequest) : fromTalent(r as MyClassRequest));
  }, [raw, isEducator]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  return { events, eventsByDate, isPending, isEducator };
}
