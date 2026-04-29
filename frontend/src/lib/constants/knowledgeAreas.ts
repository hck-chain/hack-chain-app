export interface KnowledgeArea {
  id: string;
  label: string;
  category: 'security' | 'development' | 'infrastructure';
}

export const KNOWLEDGE_AREAS: KnowledgeArea[] = [
  // Security
  { id: 'web-sec',        label: 'Web Application Security',    category: 'security' },
  { id: 'network-sec',    label: 'Network Security',             category: 'security' },
  { id: 'crypto',         label: 'Cryptography',                 category: 'security' },
  { id: 'reverse-eng',    label: 'Reverse Engineering',          category: 'security' },
  { id: 'malware',        label: 'Malware Analysis',             category: 'security' },
  { id: 'pentesting',     label: 'Penetration Testing',          category: 'security' },
  { id: 'devsecops',      label: 'DevSecOps',                    category: 'security' },
  { id: 'cloud-sec',      label: 'Cloud Security',               category: 'security' },
  { id: 'mobile-sec',     label: 'Mobile Security',              category: 'security' },
  { id: 'iot-sec',        label: 'IoT & Hardware Security',      category: 'security' },
  { id: 'threat-intel',   label: 'Threat Intelligence',          category: 'security' },
  { id: 'forensics',      label: 'Incident Response & Forensics', category: 'security' },
  { id: 'social-eng',     label: 'Social Engineering',           category: 'security' },
  { id: 'smart-contract', label: 'Smart Contract Security',      category: 'security' },
  { id: 'blockchain-sec', label: 'Blockchain Security',          category: 'security' },
  { id: 'red-team',       label: 'Red Team',                     category: 'security' },
  { id: 'blue-team',      label: 'Blue Team / SOC',              category: 'security' },
  { id: 'grc',            label: 'Compliance & GRC',             category: 'security' },
  { id: 'ai-sec',         label: 'AI/ML Security',               category: 'security' },
  // Development
  { id: 'web-dev',        label: 'Web Development',              category: 'development' },
  { id: 'mobile-dev',     label: 'Mobile Development',           category: 'development' },
  { id: 'backend-dev',    label: 'Backend Development',          category: 'development' },
  { id: 'frontend-dev',   label: 'Frontend Development',         category: 'development' },
  { id: 'fullstack',      label: 'Full Stack Development',       category: 'development' },
  { id: 'cpp',            label: 'C / C++',                      category: 'development' },
  { id: 'python',         label: 'Python',                       category: 'development' },
  { id: 'rust',           label: 'Rust',                         category: 'development' },
  { id: 'golang',         label: 'Go',                           category: 'development' },
  { id: 'solidity',       label: 'Solidity / Smart Contracts',   category: 'development' },
  { id: 'data-science',   label: 'Data Science & ML',            category: 'development' },
  // Infrastructure
  { id: 'linux',          label: 'Linux / Unix Systems',         category: 'infrastructure' },
  { id: 'cloud-infra',    label: 'Cloud Infrastructure',         category: 'infrastructure' },
  { id: 'devops',         label: 'DevOps',                       category: 'infrastructure' },
  { id: 'containers',     label: 'Containers & Kubernetes',      category: 'infrastructure' },
  { id: 'networking',     label: 'Networking & Protocols',       category: 'infrastructure' },
] as const;

export const KNOWLEDGE_AREA_LABELS = new Set(KNOWLEDGE_AREAS.map((a) => a.label));

export const MAX_KNOWLEDGE_AREAS = 5;
