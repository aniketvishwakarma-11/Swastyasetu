import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMetadata {
  title: string;
  description?: string;
}

const ROUTE_META: Record<string, PageMetadata> = {
  '/': {
    title: 'SwasthyaSetu | Healthcare Continuity Layer',
    description: 'Offline-first clinical referral continuity connecting rural PHCs and District Hospitals.',
  },
  '/login': {
    title: 'Secure Clinical Staff Login | SwasthyaSetu',
    description: 'Authorized medical officer and clinician portal access with cryptographic role verification.',
  },
  '/signup': {
    title: 'Register Healthcare Staff Account | SwasthyaSetu',
    description: 'Onboard accredited medical officers, CHOs, clinicians, and transfer coordinators.',
  },
  '/phc': {
    title: 'PHC Referral Cockpit & Offline Intake | SwasthyaSetu',
    description: 'Create offline-resilient digital referrals, rapid vitals, and track post-discharge follow-ups.',
  },
  '/hospital': {
    title: 'District Hospital Triage & Identity Portal | SwasthyaSetu',
    description: 'Emergency clinical intake, fuzzy identity reconciliation, AI document OCR, and discharge summaries.',
  },
  '/triage': {
    title: '108 Ambulance Dispatch & Transfer Board | SwasthyaSetu',
    description: 'District-wide inter-facility transfer Kanban board and hospital bed capacity monitor.',
  },
  '/admin': {
    title: 'System Administration & Compliance Audit | SwasthyaSetu',
    description: 'Cryptographically sealed audit trail explorer, RBAC access controls, and network health monitoring.',
  },
  '/privacy': {
    title: 'Privacy & Clinical Data Governance Policy | SwasthyaSetu',
    description: 'Compliance with DPDP 2023, DISHA standards, ABHA ID security, and patient data confidentiality.',
  },
  '/terms': {
    title: 'Terms of Clinical Service & Tele-Triage Protocols | SwasthyaSetu',
    description: 'Clinical decision-support terms, physician authority boundaries, and liability parameters.',
  },
  '/404': {
    title: '404 Page Not Found | SwasthyaSetu',
    description: 'The requested clinical route was not found. Please return to safe emergency triage navigation.',
  },
};

export function usePageMeta() {
  const location = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[location.pathname] || ROUTE_META['/404'];

    document.title = meta.title;

    if (meta.description) {
      let metaDescTag = document.querySelector('meta[name="description"]');
      if (!metaDescTag) {
        metaDescTag = document.createElement('meta');
        metaDescTag.setAttribute('name', 'description');
        document.head.appendChild(metaDescTag);
      }
      metaDescTag.setAttribute('content', meta.description);
    }
  }, [location.pathname]);
}
