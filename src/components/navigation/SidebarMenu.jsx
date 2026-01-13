import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RISK_LEVELS } from '../../utils/risk';

// Menu configuration
const menuItems = [
  {
    id: 'dashboard',
    label: 'Risk Dashboard',
    icon: 'bi-speedometer2',
    path: '/',
  },
  {
    id: 'risks-all',
    label: 'All Risks',
    icon: 'bi-clipboard-data',
    path: '/risks',
  },
  {
    id: 'risk-register',
    label: 'Risk Register',
    icon: 'bi-file-plus',
    path: '/risks/new',
  },
  {
    id: 'risk-levels',
    label: 'Risk Levels',
    icon: 'bi-bar-chart-line',
    children: RISK_LEVELS.map((lvl) => ({
      id: `risk-level-${lvl.key}`,
      label: lvl.labelEn || lvl.label, // short label: Low, Low-Moderate, Moderate, Moderate-High, High
      path: `/risks?level=${lvl.key}`,
    })),
  },
  {
    id: 'mitigation',
    label: 'Mitigation Plans',
    icon: 'bi-shield-check',
    path: '/mitigations',
  },
  {
    id: 'evaluation',
    label: 'Monthly Evaluation',
    icon: 'bi-calendar-check',
    path: '/evaluations',
  },
  { type: 'header', label: 'ADMIN' },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'bi-gear',
    path: '/settings',
  },
];

function MenuItem({ item, collapsed, level = 0 }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    // Check if any child is active to auto-expand
    if (item.children) {
      return item.children.some(child => 
        child.path === location.pathname || 
        (child.children && child.children.some(grandchild => grandchild.path === location.pathname))
      );
    }
    return false;
  });

  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren
    ? item.children.some((child) =>
        child.path === location.pathname ||
        (child.children && child.children.some((grandchild) => grandchild.path === location.pathname))
      )
    : false;
  const isActive = item.path === location.pathname || isChildActive;
  const paddingLeft = level > 0 ? `${level * 0.75}rem` : undefined;

  // Render header
  if (item.type === 'header') {
    return (
      <li 
        className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/60 transition-opacity duration-300 ${
          collapsed ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100'
        }`}
      >
        {item.label}
      </li>
    );
  }

  const isDisabled = item.path === '#';

  const linkClasses = `
    flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
    ${isActive 
      ? 'bg-white/15 text-white' 
      : 'text-white/90 hover:text-white hover:bg-white/10'
    }
    ${level > 0 ? 'text-white/75' : ''}
    ${isDisabled ? 'opacity-70 cursor-default hover:bg-transparent hover:text-white/75' : ''}
  `;

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
      return;
    }
    if (isDisabled) {
      e.preventDefault();
    }
  };

  const content = (
    <>
      <i 
        className={`bi ${item.icon} ${item.iconColor || 'text-white'} text-base w-6 shrink-0 text-center`}
      />
      <span 
        className={`flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 ${
          collapsed && level === 0 ? 'opacity-0 w-0' : 'opacity-100'
        }`}
        style={{ paddingLeft }}
      >
        {item.label}
      </span>
      {item.badge && !collapsed && (
        <span className={`${item.badge.color} text-white text-xs px-2 py-0.5 rounded-full`}>
          {item.badge.text}
        </span>
      )}
      {hasChildren && !collapsed && (
        <i 
          className={`bi bi-chevron-right text-xs text-white/80 transition-transform duration-300 ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
      )}
    </>
  );

  return (
    <li className={`mb-0.5 ${isOpen ? 'menu-open' : ''}`}>
      {item.path && !hasChildren && !isDisabled ? (
        <Link to={item.path} className={linkClasses}>
          {content}
        </Link>
      ) : (
        <a href="#" onClick={handleClick} className={linkClasses}>
          {content}
        </a>
      )}

      {/* Submenu */}
      {hasChildren && (
        <ul 
          className={`overflow-hidden transition-all duration-300 ${
            isOpen && !collapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {item.children.map(child => (
            <MenuItem 
              key={child.id} 
              item={{ ...child, icon: child.icon || 'bi-circle' }} 
              collapsed={collapsed}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SidebarMenu({ collapsed }) {
  return (
    <nav className="mt-2">
      <ul className="space-y-0.5" role="navigation" aria-label="Main navigation">
        {menuItems.map((item, index) => (
          <MenuItem 
            key={item.id || `header-${index}`} 
            item={item} 
            collapsed={collapsed}
          />
        ))}
      </ul>
    </nav>
  );
}

