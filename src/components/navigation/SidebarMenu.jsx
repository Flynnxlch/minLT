import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBulletin } from '../../context/BulletinContext';
import { useSidebar } from '../../context/SidebarContext';
import { RISK_LEVELS } from '../../utils/risk';

// Menu configuration
const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard Risiko',
    icon: 'bi-speedometer2',
    path: '/',
  },
  {
    id: 'risks-all',
    label: 'Semua Risiko',
    icon: 'bi-clipboard-data',
    path: '/risks',
  },
  {
    id: 'open-risks',
    label: 'Risiko Belum Dianalisis',
    icon: 'bi-clipboard2',
    path: '/open-risks',
  },
  {
    id: 'risk-register',
    label: 'Risk Register',
    icon: 'bi-file-plus',
    path: '/risks/new',
  },
  {
    id: 'risk-levels',
    label: 'Tingkat Risiko',
    icon: 'bi-bar-chart-line',
    children: RISK_LEVELS.map((lvl) => ({
      id: `risk-level-${lvl.key}`,
      label: lvl.labelId || lvl.label, // Use Indonesian label: Rendah, Rendah-Menengah, Menengah, Menengah-Tinggi, Tinggi
      path: `/risks?level=${lvl.key}`,
    })),
  },
  {
    id: 'mitigation',
    label: 'Rencana Mitigasi',
    icon: 'bi-shield-check',
    path: '/mitigations',
  },
  {
    id: 'evaluation',
    label: 'Evaluasi Keberhasilan',
    icon: 'bi-calendar-check',
    path: '/evaluations',
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    icon: 'bi-gear',
    path: '/settings',
  },
  {
    id: 'guide',
    label: 'Buletin',
    icon: 'bi-book',
    path: '/guide',
  },
];

function MenuItem({ item, collapsed, level = 0 }) {
  const location = useLocation();
  const { isMobile, closeSidebar } = useSidebar();
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
        className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white/50 transition-opacity duration-300 ${
          collapsed ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100'
        }`}
      >
        {item.label}
      </li>
    );
  }

  const isDisabled = item.path === '#';

  const linkClasses = `
    flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 relative
    ${collapsed && level === 0 
      ? 'px-3 py-3 gap-0' 
      : 'px-3 py-2.5 gap-3 justify-start'
    }
    ${isActive 
      ? collapsed && level === 0
        ? 'bg-white/20 text-white shadow-lg shadow-white/20' 
        : 'bg-white/15 text-white shadow-md'
      : 'text-white/90 hover:text-white hover:bg-white/10'
    }
    ${level > 0 ? 'text-white/80 ml-2' : ''}
    ${isDisabled ? 'opacity-50 cursor-default hover:bg-transparent hover:text-white/75' : ''}
    ${!isActive && !isDisabled ? 'hover:scale-[1.02]' : ''}
  `;
  
  // Active border - positioned to match icon margin when collapsed
  // When collapsed: icon is centered, border should be at left edge with same vertical margin as icon
  // When expanded: border on left edge
  const activeBorderStyle = isActive 
    ? collapsed && level === 0
      ? 'before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:bg-white before:rounded-r-full before:shadow-lg before:shadow-white/30'
      : 'before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-white/80 before:rounded-r-full'
    : '';

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
      return;
    }
    if (isDisabled) {
      e.preventDefault();
    }
    // Close sidebar on mobile when menu item is clicked
    if (isMobile && !hasChildren && !isDisabled) {
      closeSidebar();
    }
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (isMobile && !hasChildren && !isDisabled) {
      closeSidebar();
    }
  };

  const content = (
    <>
      <i 
        className={`bi ${item.icon} ${item.iconColor || 'text-white'} text-lg shrink-0 transition-transform duration-200 ${
          collapsed && level === 0 ? 'mx-auto' : 'w-6 text-center'
        } ${
          isActive ? 'scale-110' : ''
        }`}
      />
      <span 
        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
          collapsed && level === 0 
            ? 'hidden' 
            : 'flex-1 opacity-100'
        }`}
        style={{ paddingLeft }}
      >
        {item.label}
      </span>
      {item.badge && !collapsed && (
        <span
          className={`flex items-center justify-center min-w-5 h-5 rounded-full text-white text-xs font-semibold ${item.badge.color}`}
          aria-label={`${item.badge.text} belum dibaca`}
        >
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
    <li className={`mb-1 ${isOpen ? 'menu-open' : ''}`}>
      {item.path && !hasChildren && !isDisabled ? (
        <Link 
          to={item.path} 
          className={`${linkClasses} ${activeBorderStyle}`}
          onClick={handleLinkClick}
        >
          {content}
        </Link>
      ) : (
        <a href="#" onClick={handleClick} className={`${linkClasses} ${activeBorderStyle}`}>
          {content}
        </a>
      )}

      {/* Submenu */}
      {hasChildren && (
        <ul 
          className={`overflow-hidden transition-all duration-300 ml-2 border-l-2 border-white/10 ${
            isOpen && !collapsed ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
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
  const { unreadBadgeText } = useBulletin();

  const itemsWithBadge = useMemo(() => {
    return menuItems.map((item) => {
      if (item.id === 'guide' && unreadBadgeText) {
        return { ...item, badge: { text: unreadBadgeText, color: 'bg-green-500' } };
      }
      return item;
    });
  }, [unreadBadgeText]);

  return (
    <nav className="mt-1">
      <ul className="space-y-1" role="navigation" aria-label="Main navigation">
        {itemsWithBadge.map((item, index) => (
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

