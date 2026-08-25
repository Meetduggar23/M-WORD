import React, { useState } from 'react';
import './NavigationPane.css';

interface NavigationPaneProps {
  onClose: () => void;
}

type NavigationTab = 'headings' | 'pages' | 'results';

export const NavigationPane: React.FC<NavigationPaneProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('headings');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: NavigationTab; label: string; icon: string }[] = [
    { id: 'headings', label: 'Headings', icon: '📑' },
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'results', label: 'Results', icon: '🔍' },
  ];

  // Placeholder headings
  const headings = [
    { level: 1, text: 'Introduction', page: 1 },
    { level: 2, text: 'Background', page: 1 },
    { level: 2, text: 'Objectives', page: 2 },
    { level: 1, text: 'Methodology', page: 3 },
    { level: 2, text: 'Data Collection', page: 3 },
    { level: 2, text: 'Analysis', page: 4 },
    { level: 1, text: 'Results', page: 5 },
    { level: 1, text: 'Conclusion', page: 8 },
  ];

  return (
    <div className="navigation-pane">
      <div className="navigation-header">
        <div className="navigation-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`navigation-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
            </button>
          ))}
        </div>
        <button className="close-button" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      <div className="navigation-content">
        {activeTab === 'headings' && (
          <div className="headings-list">
            {headings.map((heading, index) => (
              <div 
                key={index} 
                className={`heading-item level-${heading.level}`}
                onClick={() => {/* Navigate to heading */}}
              >
                <span className="heading-text">{heading.text}</span>
                <span className="heading-page">{heading.page}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="pages-list">
            <div className="page-thumbnail active">
              <div className="page-preview">1</div>
              <span className="page-number">Page 1</span>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="results-panel">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button className="search-button">🔍</button>
            </div>
            <div className="results-list">
              {searchQuery && (
                <div className="no-results">
                  Type to search the document
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
