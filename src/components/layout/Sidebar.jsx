import { useSidebar } from '../../context/SidebarContext';
import SidebarMenu from '../navigation/SidebarMenu';

export default function Sidebar() {
  const { isSidebarOpen, isSidebarCollapsed, isMobile, closeSidebar } = useSidebar();

  // Calculate sidebar classes based on state
  const getSidebarClasses = () => {
    let classes = 'bg-[var(--color-sidebar-bg)] shadow-lg z-1040 flex flex-col transition-all duration-300 ease-in-out';

    if (isMobile) {
      // Mobile: slide in/out from left (overlay)
      classes += ' fixed top-0 left-0 h-screen';
      classes += isSidebarOpen
        ? ' w-[var(--sidebar-width)] translate-x-0'
        : ' w-[var(--sidebar-width)] -translate-x-full';
    } else {
      // Desktop: in-flow sidebar (no extra left margin needed in layout)
      classes += ' sticky top-0 h-screen shrink-0';
      classes += isSidebarCollapsed
        ? ' w-[var(--sidebar-mini-width)]'
        : ' w-[var(--sidebar-width)]';
    }

    return classes;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-1035 lg:hidden animate-fade-in"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside 
        className={getSidebarClasses()}
        style={{ backgroundColor: 'var(--color-sidebar-bg)' }}
        data-theme="dark"
      >
        {/* Sidebar Brand */}
        <div className="flex items-center h-(--header-height) px-3 border-b border-[var(--color-sidebar-border)] shrink-0">
          <a href="/" className="flex items-center gap-2 text-white no-underline overflow-hidden">
            <div
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <i className="bi bi-shield-check text-white text-lg" />
            </div>
            <span 
              className={`font-light text-lg whitespace-nowrap transition-all duration-300 text-white ${
                !isMobile && isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'
              }`}
            >
              MinLT RMS
            </span>
          </a>
        </div>

        {/* Sidebar Wrapper - Scrollable (scrollbar hidden) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 no-scrollbar">
          <SidebarMenu collapsed={!isMobile && isSidebarCollapsed} />
        </div>
      </aside>
    </>
  );
}

