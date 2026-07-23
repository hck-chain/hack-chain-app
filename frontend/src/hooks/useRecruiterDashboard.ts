import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export interface Recruiter {
  wallet_address: string;
  name: string;
  role: string;
  total_talents?: number;
}

export interface TalentSummary {
  id: number;
  wallet_address: string;
  field_of_study: string;
  created_at: string;
  is_active: boolean;
  name: string;
  total_certificates?: number;
}

interface AuthUser {
  wallet_address: string;
  name: string;
  role: string;
}

interface AuthMeResponse {
  user: AuthUser;
  modelName: string;
}

interface StudentUser {
  is_active: boolean;
  name: string;
  lastname: string | null;
}

interface StudentResponse {
  id: number;
  wallet_address: string;
  field_of_study: string | null;
  created_at: string;
  total_certificates?: number;
  user: StudentUser;
}

interface StudentsResponse {
  students: StudentResponse[];
}

interface UseRecruiterDashboardResult {
  recruiter: Recruiter | null;
  talents: TalentSummary[];
  loading: boolean;
  error: boolean;
  refetch: () => Promise<void>
}

export function useRecruiterDashboard(): UseRecruiterDashboardResult {
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [talents, setTalents] = useState<TalentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);

      const data = await api.get<AuthMeResponse>('/api/auth/me');

      const recruiterData: Recruiter = {
        wallet_address: data.user.wallet_address,
        name: data.user.name,
        role: data.user.role,
      };

      const dataTalents = await api.get<StudentsResponse>('/api/students');

      const talentsMapped: TalentSummary[] = dataTalents.students
        .map((s) => ({
          id: s.id,
          wallet_address: s.wallet_address,
          field_of_study: s.field_of_study || 'N/A',
          created_at: s.created_at,
          is_active: s.user.is_active,
          name: `${s.user.name} ${s.user.lastname || ''}`,
          total_certificates: s.total_certificates || 0,
        }))
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );

      recruiterData.total_talents = talentsMapped.length;

      setRecruiter(recruiterData);
      setTalents(talentsMapped);
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    void loadData();
  }, []);

  return {
    recruiter,
    talents,
    loading,
    error,
    refetch: loadData,
  };
}
