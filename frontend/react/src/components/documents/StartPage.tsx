import React, { useMemo } from 'react';
import {
  FileText, Briefcase, BarChart3, Mail, Clock, StickyNote,
  FilePlus2, FolderOpen, Upload, LayoutGrid, MoreHorizontal, ArrowRight,
} from 'lucide-react';
import { RecentDoc, formatRelativeTime } from '../../services/storage';
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
    description: 'Start with a clean page',
    icon: <FileText size={26} strokeWidth={1.6} />,
    accent: '#1b6ac9',
    blocks: [p('')],
  },
  {
    id: 'resume',
    name: 'Resume',
    description: 'Professional resume format',
    icon: <Briefcase size={26} strokeWidth={1.6} />,
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
    description: 'Structured report with sections',
    icon: <BarChart3 size={26} strokeWidth={1.6} />,
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
    description: 'Formal letter format',
    icon: <Mail size={26} strokeWidth={1.6} />,
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
  {
    id: 'notes',
    name: 'Notes',
    description: 'Simple notes and ideas',
    icon: <StickyNote size={26} strokeWidth={1.6} />,
    accent: '#b45309',
    blocks: [
      title('Meeting Notes'),
      p('Date: March 14, 2026'),
      p(''),
      h1('Agenda'),
      p('1. Product roadmap review'),
      p('2. Q2 planning discussion'),
      p('3. Team updates'),
      p(''),
      h1('Action Items'),
      p('• Review design mockups by Friday'),
      p('• Schedule follow-up with engineering'),
      p('• Update project timeline'),
    ],
  },
];

const SHORTCUTS = [
  { keys: ['Ctrl', 'N'], label: 'New document' },
  { keys: ['Ctrl', 'O'], label: 'Open document' },
  { keys: ['Ctrl', 'S'], label: 'Save document' },
  { keys: ['Ctrl', 'F'], label: 'Find in document' },
  { keys: ['Ctrl', 'Z'], label: 'Undo' },
];

interface StartPageProps {
  recents: RecentDoc[];
  userName: string;
  onOpenTemplate: (template: TemplateDef) => void;
  onOpenRecent: (doc: RecentDoc) => void;
  onRemoveRecent: (id: string) => void;
  onOpenFile: () => void;
  onOpenGenerator: () => void;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Word-style file type icon color */
function fileTypeColor(title: string): string {
  const ext = title.split('.').pop()?.toLowerCase() || '';
  if (['doc', 'docx'].includes(ext)) return '#2b579a';
  if (['pdf'].includes(ext)) return '#d32f2f';
  if (['xls', 'xlsx'].includes(ext)) return '#217346';
  if (['ppt', 'pptx'].includes(ext)) return '#b7472a';
  return '#616161';
}

function fileIcon(title: string): React.ReactNode {
  const color = fileTypeColor(title);
  return (
    <span className="recent-file-icon" style={{ color }}>
      <FileText size={18} strokeWidth={1.6} />
    </span>
  );
}

export const StartPage: React.FC<StartPageProps> = ({
  recents, userName, onOpenTemplate, onOpenRecent, onOpenFile, onOpenGenerator,
}) => {
  const greetingText = useMemo(() => `${greeting()}, ${userName}`, [userName]);

  return (
    <div className="start-page">
      <div className="start-scroll">
        {/* ── Hero: greeting + quick actions ── */}
        <div className="start-hero-row">
          <div className="start-hero-left">
            <h1 className="start-greeting">{greetingText}</h1>
            <p className="start-subtitle">Create something new, or continue where you left off.</p>
          </div>

          <div className="start-hero-right">
            <span className="quick-actions-label">Quick actions</span>
            <div className="quick-actions-row">
              <button className="quick-action-btn" onClick={onOpenFile}>
                <FolderOpen size={16} strokeWidth={1.8} />
                Open
              </button>
              <button className="quick-action-btn" onClick={onOpenGenerator}>
                <Upload size={16} strokeWidth={1.8} />
                Import
              </button>
              <button className="quick-action-btn" onClick={() => onOpenTemplate(TEMPLATES[0])}>
                <LayoutGrid size={16} strokeWidth={1.8} />
                New from template
              </button>
            </div>
          </div>
        </div>

        {/* ── Create New: template cards ── */}
        <section className="start-section" aria-label="Create new">
          <h2 className="start-section-title">Create New</h2>

          <div className="start-template-row">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className="template-card"
                onClick={() => onOpenTemplate(tpl)}
              >
                <span
                  className="template-icon"
                  style={{ color: tpl.accent, background: `${tpl.accent}12` }}
                >
                  {tpl.icon}
                </span>
                <span className="template-name">{tpl.name}</span>
                <span className="template-desc">{tpl.description}</span>
              </button>
            ))}

            <button className="template-card template-card-more" onClick={onOpenGenerator}>
              <span className="template-icon template-icon-more">
                <span className="plus-icon">+</span>
              </span>
              <span className="template-name">More templates</span>
            </button>
          </div>
        </section>

        {/* ── Recent Documents ── */}
        <section className="start-section" aria-label="Recent documents">
          <div className="start-section-header">
            <h2 className="start-section-title">
              <Clock size={16} strokeWidth={2} />
              Recent Documents
            </h2>
            {recents.length > 0 && (
              <button className="view-all-btn">
                View all
                <ArrowRight size={13} strokeWidth={2.2} />
              </button>
            )}
          </div>

          {recents.length === 0 ? (
            <div className="start-empty">
              <FilePlus2 size={26} strokeWidth={1.6} />
              <div className="start-empty-title">No recent documents</div>
              <div className="start-empty-hint">
                Documents you save will appear here so you can jump back in instantly.
              </div>
            </div>
          ) : (
            <div className="recent-table">
              <div className="recent-table-header">
                <span className="rt-col rt-col-name">Name</span>
                <span className="rt-col rt-col-time">Date modified</span>
                <span className="rt-col rt-col-author">Author</span>
                <span className="rt-col rt-col-actions" />
              </div>
              {recents.map((doc) => (
                <div
                  key={doc.id}
                  className="recent-table-row"
                  onClick={() => onOpenRecent(doc)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenRecent(doc);
                    }
                  }}
                  title={`Open ${doc.title}`}
                >
                  <span className="rt-col rt-col-name">
                    {fileIcon(doc.title)}
                    <span className="rt-title">{doc.title || 'Untitled document'}</span>
                  </span>
                  <span className="rt-col rt-col-time">
                    {formatRelativeTime(doc.openedAt)}
                  </span>
                  <span className="rt-col rt-col-author">
                    {userName || 'User'}
                  </span>
                  <span className="rt-col rt-col-actions">
                    <button
                      className="rt-more-btn"
                      onClick={(e) => { e.stopPropagation(); }}
                      title="More options"
                      aria-label={`More options for ${doc.title}`}
                    >
                      <MoreHorizontal size={14} strokeWidth={2} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="start-footer">WORD — Professional Document Editor</footer>
      </div>

      {/* ── Right sidebar: Tips & Shortcuts ── */}
      <aside className="start-sidebar">
        <div className="tips-section">
          <div className="tips-header">
            <span className="tips-diamond">◆</span>
            Tips &amp; Shortcuts
          </div>
          <ul className="tips-list">
            {SHORTCUTS.map((sc, i) => (
              <li key={i} className="tips-item">
                <span className="tips-keys">
                  {sc.keys.map((k, j) => (
                    <span key={j}>
                      <kbd>{k}</kbd>
                      {j < sc.keys.length - 1 && <span className="tips-plus">+</span>}
                    </span>
                  ))}
                </span>
                <span className="tips-label">{sc.label}</span>
              </li>
            ))}
          </ul>
          <button className="tips-more-btn">
            See more shortcuts
            <ArrowRight size={12} strokeWidth={2.2} />
          </button>
        </div>
      </aside>
    </div>
  );
};
