import React, { useMemo } from 'react';
import {
  FileText, Briefcase, BarChart3, Mail, Clock,
  FilePlus2, FolderOpen, Trash2, MoreHorizontal,
} from 'lucide-react';
import { RecentDoc, formatRelativeTime } from '../../services/storage';
import { Logo } from '../common/Logo';
import './StartPage.css';

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  blocks: { text: string; style?: string; bold?: boolean }[];
}

export interface TemplateBlock {
  text: string;
  style?: string;
  bold?: boolean;
}

const p = (text: string): TemplateBlock => ({ text });
const h1 = (text: string): TemplateBlock => ({ text, style: 'Heading1' });
const h2 = (text: string): TemplateBlock => ({ text, style: 'Heading2' });
const title = (text: string): TemplateBlock => ({ text, style: 'Title' });

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'A clean page, ready for anything',
    icon: <FileText size={22} strokeWidth={1.8} />,
    accent: '#2264dc',
    blocks: [p('')],
  },
  {
    id: 'resume',
    name: 'Resume',
    description: 'Structured professional resume',
    icon: <Briefcase size={22} strokeWidth={1.8} />,
    accent: '#7c3aed',
    blocks: [
      title('ALEX MORGAN'),
      p('Product Designer · alex.morgan@example.com · (555) 010-2030 · Portland, OR'),
      h1('Experience'),
      h2('Senior Product Designer — Northwind Co.'),
      p('2019 – Present · Led redesign of the core workflow suite used by 40k daily users, lifting task completion by 18%. Built and maintained the multi-platform design system.'),
      h2('Product Designer — Bluepeak Labs'),
      p('2016 – 2019 · Shipped 12 customer-facing features end to end; introduced weekly usability testing that cut support tickets by a third.'),
      h1('Education'),
      p('B.A. Interaction Design, University of Washington — 2016'),
      h1('Skills'),
      p('Design systems · Prototyping · User research · HTML/CSS · Motion design'),
    ],
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Business report with sections',
    icon: <BarChart3 size={22} strokeWidth={1.8} />,
    accent: '#0d9488',
    blocks: [
      title('Quarterly Business Report'),
      p('Prepared by the Strategy Team · Confidential draft'),
      h1('Executive Summary'),
      p('Revenue grew 14% quarter over quarter, driven primarily by expansion in mid-market accounts. Churn held steady at 2.1% while average contract value rose for the third consecutive quarter.'),
      h1('Key Metrics'),
      p('New logos: 128 · Net revenue retention: 118% · Support satisfaction: 4.6 / 5 · Cash runway: 26 months'),
      h1('Outlook'),
      p('We expect continued momentum through Q3, supported by the upcoming platform release and two enterprise pilots scheduled to convert in September.'),
    ],
  },
  {
    id: 'letter',
    name: 'Letter',
    description: 'Formal letter layout',
    icon: <Mail size={22} strokeWidth={1.8} />,
    accent: '#c2410c',
    blocks: [
      p('March 14, 2026'),
      p(''),
      p('Dear Ms. Whitfield,'),
      p('Thank you for taking the time to meet with our team last week. The discussion about your documentation workflow was genuinely helpful, and I wanted to follow up on the integration plan we outlined together.'),
      p('As discussed, we will deliver the first milestone by the end of the month and schedule a review session shortly after. Please do not hesitate to reach out if any questions come up in the meantime.'),
      p('Kind regards,'),
      p('Jordan Ellis'),
      p('Customer Success Lead'),
    ],
  },
];

interface StartPageProps {
  recents: RecentDoc[];
  userName: string;
  onOpenTemplate: (template: TemplateDef) => void;
  onOpenRecent: (doc: RecentDoc) => void;
  onRemoveRecent: (id: string) => void;
  onOpenFile: () => void;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const StartPage: React.FC<StartPageProps> = ({
  recents, userName, onOpenTemplate, onOpenRecent, onRemoveRecent, onOpenFile,
}) => {
  const greetingText = useMemo(() => `${greeting()}, ${userName}`, [userName]);
  const featured = TEMPLATES.slice(0, 4);

  return (
    <div className="start-page">
      <div className="start-scroll">
        <header className="start-hero">
          <Logo size={44} className="start-logo" />
          <h1 className="start-greeting">{greetingText}</h1>
          <p className="start-subtitle">Create something new, or pick up where you left off.</p>
        </header>

        <section className="start-section" aria-label="Templates">
          <div className="start-template-grid">
            {featured.map((tpl) => (
              <button
                key={tpl.id}
                className="template-card"
                onClick={() => onOpenTemplate(tpl)}
              >
                <span className="template-icon" style={{ color: tpl.accent, background: `${tpl.accent}14` }}>
                  {tpl.icon}
                </span>
                <span className="template-name">{tpl.name}</span>
                <span className="template-desc">{tpl.description}</span>
                <span className="template-cta" style={{ color: tpl.accent }}>Create →</span>
              </button>
            ))}
          </div>
          <button className="start-secondary-action" onClick={onOpenFile}>
            <FolderOpen size={15} strokeWidth={2} />
            Open a document from your device
          </button>
        </section>

        <section className="start-section" aria-label="Recent documents">
          <h2 className="start-heading">
            <Clock size={15} strokeWidth={2.2} />
            Recent Documents
          </h2>

          {recents.length === 0 ? (
            <div className="start-empty">
              <FilePlus2 size={26} strokeWidth={1.6} />
              <div className="start-empty-title">No recent documents</div>
              <div className="start-empty-hint">
                Documents you save will appear here so you can jump back in instantly.
              </div>
            </div>
          ) : (
            <ul className="recent-list">
              {recents.map((doc) => (
                <li key={doc.id}>
                  <button
                    className={`recent-item${doc.title ? '' : ''}`}
                    onClick={() => onOpenRecent(doc)}
                    title={`Open ${doc.title}`}
                  >
                    <span className="recent-icon">
                      <FileText size={16} strokeWidth={1.8} />
                    </span>
                    <span className="recent-meta">
                      <span className="recent-title">{doc.title || 'Untitled document'}</span>
                      <span className="recent-time">{formatRelativeTime(doc.openedAt)}</span>
                    </span>
                    <MoreHorizontal
                      size={14}
                      strokeWidth={2}
                      className="recent-dots"
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    className="recent-remove"
                    onClick={(e) => { e.stopPropagation(); onRemoveRecent(doc.id); }}
                    aria-label={`Remove ${doc.title} from recents`}
                    title="Remove from list"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="start-footer">WORD — Professional Document Editor</footer>
      </div>
    </div>
  );
};
