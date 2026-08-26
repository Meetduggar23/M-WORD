import React from 'react';
import {
  LayoutList, FileText, Search, Bookmark, MessageSquare, History, Paperclip,
} from 'lucide-react';
import { useUI, NavView } from '../../store/uiStore';
import './NavRail.css';

const RAIL_ITEMS: { view: NavView; label: string; icon: React.ReactNode }[] = [
  { view: 'outline', label: 'Document Outline', icon: <LayoutList size={16} strokeWidth={1.9} /> },
  { view: 'pages', label: 'Pages', icon: <FileText size={16} strokeWidth={1.9} /> },
  { view: 'search', label: 'Search', icon: <Search size={16} strokeWidth={1.9} /> },
  { view: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={16} strokeWidth={1.9} /> },
  { view: 'comments', label: 'Comments', icon: <MessageSquare size={16} strokeWidth={1.9} /> },
  { view: 'history', label: 'Version History', icon: <History size={16} strokeWidth={1.9} /> },
  { view: 'attachments', label: 'Attachments', icon: <Paperclip size={16} strokeWidth={1.9} /> },
];

export const NavRail: React.FC = () => {
  const { navView, toggleNavView } = useUI();

  return (
    <nav className="nav-rail" aria-label="Navigation panes">
      {RAIL_ITEMS.map((item) => {
        const active = navView === item.view;
        return (
          <button
            key={item.view}
            className={`nav-rail-btn${active ? ' active' : ''}`}
            onClick={() => toggleNavView(item.view)}
            title={item.label}
            aria-label={item.label}
            aria-pressed={active}
            type="button"
          >
            {item.icon}
          </button>
        );
      })}
    </nav>
  );
};
