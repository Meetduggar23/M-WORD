import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Briefcase, BarChart3, Mail, Clock, StickyNote,
  FilePlus2, FolderOpen, Upload, LayoutGrid, ArrowRight,
  ChevronDown, ChevronUp, Keyboard, Command, Settings, CircleHelp, Trash2,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { RecentDoc, formatRelativeTime } from '../../services/storage';
import { getGreeting } from '../../features/personalization/greeting';
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

interface StartPageProps {
  recents: RecentDoc[];
  userName: string;
  isAuthenticated: boolean;
  onOpenTemplate: (template: TemplateDef) => void;
  onOpenRecent: (doc: RecentDoc) => void;
  onRemoveRecent: (id: string) => void;
  onOpenFile: () => void;
  onOpenGenerator: () => void;
  onOpenSettings: () => void;
  onOpenSettingsPage: () => void;
  onOpenCommandCenter: () => void;
  onLogin?: () => void;
}

type FooterAction = { label: string; icon: React.ReactNode; run: () => void };

const FooterLink: React.FC<{ action: FooterAction }> = ({ action }) => (
  <button type="button" className="start-footer-link" onClick={action.run}>
    {action.icon}
    <span>{action.label}</span>
  </button>
);

const StartFooter: React.FC<{
  onOpenTemplate: (template: TemplateDef) => void;
  onOpenFile: () => void;
  onOpenGenerator: () => void;
  onOpenSettings: () => void;
  onOpenSettingsPage: () => void;
  onOpenCommandCenter: () => void;
}> = ({ onOpenTemplate, onOpenFile, onOpenGenerator, onOpenSettings, onOpenSettingsPage, onOpenCommandCenter }) => {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuFocus, setMenuFocus] = useState(0);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const shortcuts = () => onOpenSettings();
  const quickActions: FooterAction[] = [
    { label: 'New document', icon: <FilePlus2 size={14} />, run: () => onOpenTemplate(TEMPLATES[0]) },
    { label: 'Open', icon: <FolderOpen size={14} />, run: onOpenFile },
    { label: 'Templates', icon: <LayoutGrid size={14} />, run: () => scrollTo('start-templates') },
    { label: 'Import', icon: <Upload size={14} />, run: onOpenGenerator },
  ];
  const groups: { label: string; items: FooterAction[] }[] = [
    { label: 'Product', items: [
      { label: 'Home', icon: <Logo size={14} />, run: () => scrollTo('start-home') },
      quickActions[0],
      quickActions[2],
      { label: 'Recent documents', icon: <Clock size={14} />, run: () => scrollTo('start-recent') },
    ] },
    { label: 'Tools', items: [
      { label: 'Keyboard shortcuts', icon: <Keyboard size={14} />, run: shortcuts },
      { label: 'Command center', icon: <Command size={14} />, run: onOpenCommandCenter },
    ] },
    { label: 'Support', items: [
      { label: 'Help & shortcuts', icon: <CircleHelp size={14} />, run: shortcuts },
    ] },
    { label: 'App', items: [
      { label: 'Settings', icon: <Settings size={14} />, run: onOpenSettingsPage },
    ] },
  ];
  const featureItems = groups.flatMap((group) => group.items);

  useEffect(() => {
    if (!featuresOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!featuresRef.current?.contains(target) && !menuRef.current?.contains(target)) setFeaturesOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setFeaturesOpen(false); return; }
      if (event.key === 'ArrowDown') { event.preventDefault(); setMenuFocus((i) => Math.min(featureItems.length - 1, i + 1)); }
      if (event.key === 'ArrowUp') { event.preventDefault(); setMenuFocus((i) => Math.max(0, i - 1)); }
      if (event.key === 'Home') { event.preventDefault(); setMenuFocus(0); }
      if (event.key === 'End') { event.preventDefault(); setMenuFocus(featureItems.length - 1); }
      if (event.key === 'Enter') { event.preventDefault(); featureItems[menuFocus]?.run(); setFeaturesOpen(false); }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, [featuresOpen, featureItems, menuFocus]);

  const toggleFeatures = () => { setFeaturesOpen((open) => !open); setMenuFocus(0); };
  const menu = featuresOpen && createPortal(
    <div ref={menuRef} className="start-features-menu" role="menu" aria-label="All features">
      <div className="start-features-heading">All features</div>
      {featureItems.map((item, index) => (
        <button key={`${item.label}-${index}`} type="button" role="menuitem" tabIndex={index === menuFocus ? 0 : -1}
          className={`start-feature-item${index === menuFocus ? ' is-focused' : ''}`} onClick={() => { item.run(); setFeaturesOpen(false); }}
          onMouseEnter={() => setMenuFocus(index)}>
          {item.icon}<span>{item.label}</span>
        </button>
      ))}
    </div>, document.body,
  );

  return (
    <footer className="start-footer">
      <div className="start-footer-top">
        <div className="start-footer-brand"><Logo size={24} /><div><strong>WORD</strong><span>Professional document editor</span></div></div>
        <div className="start-footer-top-actions">
          <FooterLink action={{ label: 'Shortcuts', icon: <Keyboard size={14} />, run: shortcuts }} />
          <FooterLink action={{ label: 'Command center', icon: <Command size={14} />, run: onOpenCommandCenter }} />
          <FooterLink action={{ label: 'Settings', icon: <Settings size={14} />, run: onOpenSettingsPage }} />
        </div>
      </div>
      <div className="start-footer-body">
        <div className="start-footer-quick"><span className="start-footer-label">Quick actions</span>{quickActions.map((action) => <FooterLink key={action.label} action={action} />)}</div>
        <nav className="start-footer-nav" aria-label="Home navigation">
          {groups.map((group) => <div key={group.label} className="start-footer-group">
            <button type="button" className="start-footer-group-toggle" aria-expanded={mobileGroup === group.label} onClick={() => setMobileGroup((current) => current === group.label ? null : group.label)}>
              {group.label}{mobileGroup === group.label ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className={`start-footer-group-items${mobileGroup === group.label ? ' is-open' : ''}`}>{group.items.map((item) => <FooterLink key={item.label} action={item} />)}</div>
          </div>)}
        </nav>
      </div>
      <div className="start-footer-bottom">
        <span className="start-footer-credit">Made by Meet Duggar · All rights reserved</span>
        <span>© 2025 WORD</span>
        <div className="start-footer-bottom-actions"><div ref={featuresRef} className="start-features-wrap"><button type="button" className="start-features-trigger" aria-expanded={featuresOpen} aria-haspopup="menu" onClick={toggleFeatures}>All features {featuresOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>{menu}</div></div>
      </div>
    </footer>
  );
};

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

const TIPS = [
  { keys: ['Ctrl', 'N'], label: 'New document' },
  { keys: ['Ctrl', 'O'], label: 'Open document' },
  { keys: ['Ctrl', 'S'], label: 'Save document' },
  { keys: ['Ctrl', 'F'], label: 'Find in document' },
  { keys: ['Ctrl', 'Z'], label: 'Undo' },
];

export const StartPage: React.FC<StartPageProps> = ({
  recents, userName, isAuthenticated, onOpenTemplate, onOpenRecent, onRemoveRecent, onOpenFile, onOpenGenerator, onOpenSettings, onOpenSettingsPage, onOpenCommandCenter, onLogin,
}) => {
  const hour = new Date().getHours();
  const recentDocs = recents.map((d) => ({ title: d.title, openedAt: d.openedAt }));

  // When not logged in, show a generic greeting without any name
  const { greeting: authGreeting, tagline: authTagline } = useMemo(
    () => getGreeting({ userName, hour, recentDocs }),
    [userName, hour, recentDocs],
  );

  const greetingText = authGreeting;
  const tagline = authTagline;

  return (
    <div className="start-page" id="start-home">
      <div className="start-scroll">
        <div className="start-layout">
          <div className="start-main">
            {/* ── Hero: greeting + quick actions ── */}
            <div className="start-hero-row">
              <div className="start-hero-left">
                <h1 className="start-greeting">{greetingText}</h1>
                <p className="start-subtitle">{tagline}</p>
                {!isAuthenticated && onLogin && (
                  <button className="quick-action-btn" style={{ marginTop: 12 }} onClick={onLogin}>
                    Sign in to get started
                  </button>
                )}
              </div>

              <div className="start-hero-right">
                <span className="quick-actions-label">Quick actions</span>
                <div className="quick-actions-row">
                  <button className="quick-action-btn quick-action-primary" onClick={() => onOpenTemplate(TEMPLATES[0])}>
                    <FilePlus2 size={16} strokeWidth={1.8} />
                    New document
                  </button>
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
            <section className="start-section" id="start-templates" aria-label="Create new">
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
            <section className="start-section" id="start-recent" aria-label="Recent documents">
              <div className="start-section-header">
                <h2 className="start-section-title">
                  <Clock size={16} strokeWidth={2} />
                  Recent Documents
                </h2>
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
                        {userName || (isAuthenticated ? 'You' : 'Guest')}
                      </span>
                      <span className="rt-col rt-col-actions">
                        <button
                          className="rt-more-btn"
                          onClick={(e) => { e.stopPropagation(); onRemoveRecent(doc.id); }}
                          title="Remove from recent documents"
                          aria-label={`Remove ${doc.title} from recent documents`}
                        >
                          <Trash2 size={14} strokeWidth={1.8} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* ── Right sidebar: Tips & Shortcuts ── */}
          <aside className="start-sidebar">
            <div className="tips-section">
              <div className="tips-header">
                <span className="tips-diamond">&#9670;</span>
                Tips &amp; Shortcuts
              </div>
              <ul className="tips-list">
                {TIPS.map((tip: { keys: string[]; label: string }, i: number) => (
                  <li key={i} className="tips-item">
                    <span className="tips-keys">
                      {tip.keys.map((k: string, j: number) => (
                        <React.Fragment key={j}>
                          {j > 0 && <span className="tips-plus">+</span>}
                          <kbd>{k}</kbd>
                        </React.Fragment>
                      ))}
                    </span>
                    <span className="tips-label">{tip.label}</span>
                  </li>
                ))}
              </ul>
              <button className="tips-more-btn" onClick={() => onOpenSettings?.()}>
                See more shortcuts
                <ArrowRight size={12} strokeWidth={2.5} />
              </button>
            </div>
          </aside>
        </div>
        <StartFooter
          onOpenTemplate={onOpenTemplate}
          onOpenFile={onOpenFile}
          onOpenGenerator={onOpenGenerator}
          onOpenSettings={onOpenSettings}
          onOpenSettingsPage={onOpenSettingsPage}
          onOpenCommandCenter={onOpenCommandCenter}
        />
      </div>
    </div>
  );
};
