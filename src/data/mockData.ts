export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  jobCount: number;
}

export interface Job {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  description: string;
  salary: string;
  location: string;
  skills: string[];
  recruiter: string;
  status: 'Open' | 'Closed' | 'On Hold';
  createdAt: string;
  candidateCount: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: number;
  skills: string[];
  currentCompany: string;
  stage: PipelineStage;
  jobId: string;
  jobTitle: string;
  resumeUrl?: string;
  appliedAt: string;
}

export type PipelineStage = 'Applied' | 'Screened' | 'Submitted' | 'Interview' | 'Selected' | 'Rejected';

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  clientName: string;
  date: string;
  time: string;
  type: 'Phone' | 'Video' | 'In-Person';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  feedback?: string;
  notes?: string;
}

export const clients: Client[] = [
  { id: 'c1', companyName: 'TechVista Solutions', contactPerson: 'Rajesh Sharma', email: 'rajesh@techvista.com', phone: '+91 98765 43210', jobCount: 3 },
  { id: 'c2', companyName: 'GlobalFinance Corp', contactPerson: 'Priya Mehta', email: 'priya@globalfinance.com', phone: '+91 87654 32109', jobCount: 2 },
  { id: 'c3', companyName: 'InnoHealth Labs', contactPerson: 'Amit Patel', email: 'amit@innohealth.com', phone: '+91 76543 21098', jobCount: 4 },
  { id: 'c4', companyName: 'EduBridge Academy', contactPerson: 'Sneha Reddy', email: 'sneha@edubridge.com', phone: '+91 65432 10987', jobCount: 1 },
  { id: 'c5', companyName: 'RetailMax India', contactPerson: 'Vikram Singh', email: 'vikram@retailmax.in', phone: '+91 54321 09876', jobCount: 2 },
];

export const jobs: Job[] = [
  { id: 'j1', title: 'Senior React Developer', clientId: 'c1', clientName: 'TechVista Solutions', description: 'Build modern web apps', salary: '₹18-25 LPA', location: 'Bangalore', skills: ['React', 'TypeScript', 'Node.js'], recruiter: 'Anita Desai', status: 'Open', createdAt: '2025-03-15', candidateCount: 12 },
  { id: 'j2', title: 'Data Analyst', clientId: 'c2', clientName: 'GlobalFinance Corp', description: 'Analyze financial data', salary: '₹10-15 LPA', location: 'Mumbai', skills: ['Python', 'SQL', 'Tableau'], recruiter: 'Rohan Kumar', status: 'Open', createdAt: '2025-03-10', candidateCount: 8 },
  { id: 'j3', title: 'Product Manager', clientId: 'c1', clientName: 'TechVista Solutions', description: 'Lead product strategy', salary: '₹22-30 LPA', location: 'Hyderabad', skills: ['Product Strategy', 'Agile', 'Analytics'], recruiter: 'Anita Desai', status: 'Open', createdAt: '2025-03-01', candidateCount: 6 },
  { id: 'j4', title: 'UX Designer', clientId: 'c3', clientName: 'InnoHealth Labs', description: 'Design healthcare UX', salary: '₹12-18 LPA', location: 'Pune', skills: ['Figma', 'User Research', 'Prototyping'], recruiter: 'Meera Joshi', status: 'On Hold', createdAt: '2025-02-20', candidateCount: 4 },
  { id: 'j5', title: 'DevOps Engineer', clientId: 'c3', clientName: 'InnoHealth Labs', description: 'Cloud infra management', salary: '₹15-22 LPA', location: 'Remote', skills: ['AWS', 'Docker', 'Kubernetes'], recruiter: 'Rohan Kumar', status: 'Open', createdAt: '2025-03-18', candidateCount: 9 },
  { id: 'j6', title: 'Business Analyst', clientId: 'c2', clientName: 'GlobalFinance Corp', description: 'Requirements gathering', salary: '₹8-12 LPA', location: 'Delhi', skills: ['JIRA', 'SQL', 'Business Analysis'], recruiter: 'Meera Joshi', status: 'Closed', createdAt: '2025-01-15', candidateCount: 15 },
  { id: 'j7', title: 'Content Strategist', clientId: 'c4', clientName: 'EduBridge Academy', description: 'Develop content strategy', salary: '₹7-10 LPA', location: 'Chennai', skills: ['Content Writing', 'SEO', 'Analytics'], recruiter: 'Anita Desai', status: 'Open', createdAt: '2025-03-20', candidateCount: 5 },
  { id: 'j8', title: 'Sales Manager', clientId: 'c5', clientName: 'RetailMax India', description: 'Lead sales team', salary: '₹12-18 LPA', location: 'Bangalore', skills: ['Sales', 'CRM', 'Team Management'], recruiter: 'Rohan Kumar', status: 'Open', createdAt: '2025-03-22', candidateCount: 7 },
];

export const candidates: Candidate[] = [
  { id: 'ca1', name: 'Arjun Nair', email: 'arjun@gmail.com', phone: '+91 99887 76655', experience: 5, skills: ['React', 'TypeScript', 'Node.js'], currentCompany: 'Infosys', stage: 'Interview', jobId: 'j1', jobTitle: 'Senior React Developer', appliedAt: '2025-03-16' },
  { id: 'ca2', name: 'Kavitha Rao', email: 'kavitha@gmail.com', phone: '+91 88776 65544', experience: 3, skills: ['Python', 'SQL', 'Tableau'], currentCompany: 'Wipro', stage: 'Screened', jobId: 'j2', jobTitle: 'Data Analyst', appliedAt: '2025-03-12' },
  { id: 'ca3', name: 'Deepak Verma', email: 'deepak@gmail.com', phone: '+91 77665 54433', experience: 7, skills: ['React', 'JavaScript', 'AWS'], currentCompany: 'TCS', stage: 'Selected', jobId: 'j1', jobTitle: 'Senior React Developer', appliedAt: '2025-03-15' },
  { id: 'ca4', name: 'Neha Gupta', email: 'neha@gmail.com', phone: '+91 66554 43322', experience: 4, skills: ['Figma', 'User Research', 'CSS'], currentCompany: 'Accenture', stage: 'Submitted', jobId: 'j4', jobTitle: 'UX Designer', appliedAt: '2025-02-22' },
  { id: 'ca5', name: 'Suresh Iyer', email: 'suresh@gmail.com', phone: '+91 55443 32211', experience: 6, skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'], currentCompany: 'Amazon', stage: 'Applied', jobId: 'j5', jobTitle: 'DevOps Engineer', appliedAt: '2025-03-19' },
  { id: 'ca6', name: 'Pooja Sharma', email: 'pooja@gmail.com', phone: '+91 44332 21100', experience: 2, skills: ['Content Writing', 'SEO'], currentCompany: 'Freshworks', stage: 'Screened', jobId: 'j7', jobTitle: 'Content Strategist', appliedAt: '2025-03-21' },
  { id: 'ca7', name: 'Rahul Menon', email: 'rahul@gmail.com', phone: '+91 33221 10099', experience: 8, skills: ['Product Strategy', 'Agile'], currentCompany: 'Flipkart', stage: 'Interview', jobId: 'j3', jobTitle: 'Product Manager', appliedAt: '2025-03-03' },
  { id: 'ca8', name: 'Anjali Das', email: 'anjali@gmail.com', phone: '+91 22110 09988', experience: 1, skills: ['Python', 'SQL'], currentCompany: 'Cognizant', stage: 'Rejected', jobId: 'j2', jobTitle: 'Data Analyst', appliedAt: '2025-03-11' },
  { id: 'ca9', name: 'Manoj Pillai', email: 'manoj@gmail.com', phone: '+91 11009 98877', experience: 5, skills: ['Sales', 'CRM', 'Negotiation'], currentCompany: 'HCL', stage: 'Applied', jobId: 'j8', jobTitle: 'Sales Manager', appliedAt: '2025-03-23' },
  { id: 'ca10', name: 'Divya Krishnan', email: 'divya@gmail.com', phone: '+91 99008 87766', experience: 4, skills: ['React', 'TypeScript'], currentCompany: 'Mindtree', stage: 'Submitted', jobId: 'j1', jobTitle: 'Senior React Developer', appliedAt: '2025-03-17' },
  { id: 'ca11', name: 'Siddharth Jain', email: 'siddharth@gmail.com', phone: '+91 88007 76655', experience: 6, skills: ['JIRA', 'SQL', 'Business Analysis'], currentCompany: 'Deloitte', stage: 'Selected', jobId: 'j6', jobTitle: 'Business Analyst', appliedAt: '2025-01-18' },
  { id: 'ca12', name: 'Lakshmi Nair', email: 'lakshmi@gmail.com', phone: '+91 77006 65544', experience: 3, skills: ['AWS', 'Docker', 'Linux'], currentCompany: 'Zoho', stage: 'Screened', jobId: 'j5', jobTitle: 'DevOps Engineer', appliedAt: '2025-03-20' },
];

export const interviews: Interview[] = [
  { id: 'i1', candidateId: 'ca1', candidateName: 'Arjun Nair', jobTitle: 'Senior React Developer', clientName: 'TechVista Solutions', date: '2025-04-05', time: '10:00 AM', type: 'Video', status: 'Scheduled', notes: 'Focus on React architecture patterns' },
  { id: 'i2', candidateId: 'ca7', candidateName: 'Rahul Menon', jobTitle: 'Product Manager', clientName: 'TechVista Solutions', date: '2025-04-03', time: '2:00 PM', type: 'In-Person', status: 'Completed', feedback: 'Strong product sense, excellent communication. Recommended for final round.', notes: 'Met with CTO and VP Product' },
  { id: 'i3', candidateId: 'ca3', candidateName: 'Deepak Verma', jobTitle: 'Senior React Developer', clientName: 'TechVista Solutions', date: '2025-03-28', time: '11:30 AM', type: 'Video', status: 'Completed', feedback: 'Outstanding technical skills. Offered the position.' },
  { id: 'i4', candidateId: 'ca5', candidateName: 'Suresh Iyer', jobTitle: 'DevOps Engineer', clientName: 'InnoHealth Labs', date: '2025-04-07', time: '3:00 PM', type: 'Phone', status: 'Scheduled' },
  { id: 'i5', candidateId: 'ca9', candidateName: 'Manoj Pillai', jobTitle: 'Sales Manager', clientName: 'RetailMax India', date: '2025-04-08', time: '10:30 AM', type: 'In-Person', status: 'Scheduled' },
];

export const recruiters = ['Anita Desai', 'Rohan Kumar', 'Meera Joshi'];

export const pipelineStages: PipelineStage[] = ['Applied', 'Screened', 'Submitted', 'Interview', 'Selected', 'Rejected'];

export const stageColors: Record<PipelineStage, string> = {
  Applied: 'bg-info/10 text-info border-info/20',
  Screened: 'bg-warning/10 text-warning border-warning/20',
  Submitted: 'bg-accent/10 text-accent border-accent/20',
  Interview: 'bg-primary/10 text-primary border-primary/20',
  Selected: 'bg-success/10 text-success border-success/20',
  Rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export const chartData = {
  candidatesPerStage: [
    { stage: 'Applied', count: 3 },
    { stage: 'Screened', count: 3 },
    { stage: 'Submitted', count: 2 },
    { stage: 'Interview', count: 2 },
    { stage: 'Selected', count: 2 },
    { stage: 'Rejected', count: 1 },
  ],
  monthlyClosures: [
    { month: 'Oct', closures: 4 },
    { month: 'Nov', closures: 6 },
    { month: 'Dec', closures: 3 },
    { month: 'Jan', closures: 8 },
    { month: 'Feb', closures: 5 },
    { month: 'Mar', closures: 7 },
  ],
  recruiterPerformance: [
    { name: 'Anita Desai', hires: 12, interviews: 28, submissions: 45 },
    { name: 'Rohan Kumar', hires: 9, interviews: 22, submissions: 38 },
    { name: 'Meera Joshi', hires: 7, interviews: 18, submissions: 30 },
  ],
};
