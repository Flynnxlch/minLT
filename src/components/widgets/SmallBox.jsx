import { Link } from 'react-router-dom';

const colorClasses = {
  primary: 'bg-[#0d6efd] text-white',
  success: 'bg-[#198754] text-white',
  warning: 'bg-[#ffc107] text-gray-900',
  danger: 'bg-[#dc3545] text-white',
  info: 'bg-[#0dcaf0] text-gray-900',
  secondary: 'bg-[#6c757d] text-white',
  dark: 'bg-[#212529] text-white',
  light: 'bg-[#f8f9fa] text-gray-900',
};

const footerColorClasses = {
  primary: 'text-white/90 hover:text-white hover:bg-black/10',
  success: 'text-white/90 hover:text-white hover:bg-black/10',
  warning: 'text-gray-900/80 hover:text-gray-900 hover:bg-black/10',
  danger: 'text-white/90 hover:text-white hover:bg-black/10',
  info: 'text-gray-900/80 hover:text-gray-900 hover:bg-black/10',
  secondary: 'text-white/90 hover:text-white hover:bg-black/10',
  dark: 'text-white/90 hover:text-white hover:bg-black/10',
  light: 'text-gray-900/80 hover:text-gray-900 hover:bg-black/10',
};

export default function SmallBox({
  title,
  value,
  icon,
  color = 'primary',
  link = '#',
  linkText = 'More info',
  suffix = '',
}) {
  return (
    <div 
      className={`
        small-box relative block rounded-lg shadow-[var(--shadow-card)] mb-5 overflow-hidden
        ${colorClasses[color] || colorClasses.primary}
      `}
    >
      {/* Inner content */}
      <div className="p-3 relative z-10">
        <h3 className="text-[2.2rem] font-bold whitespace-nowrap m-0 mb-2">
          {value}
          {suffix && <sup className="text-base ml-0.5">{suffix}</sup>}
        </h3>
        <p className="text-base m-0">{title}</p>
      </div>

      {/* Icon */}
      {icon && (
        <div className="small-box-icon absolute top-4 right-4 z-0 text-black/15 transition-transform duration-300">
          {typeof icon === 'string' ? (
            <i className={`bi ${icon} text-[70px]`}></i>
          ) : (
            <svg 
              className="h-[70px] w-[70px]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {icon}
            </svg>
          )}
        </div>
      )}

      {/* Footer link */}
      <Link
        to={link}
        className={`
          relative z-10 block text-center py-1.5 bg-black/[.07] transition-colors
          ${footerColorClasses[color] || footerColorClasses.primary}
        `}
      >
        {linkText} <i className="bi bi-link-45deg"></i>
      </Link>
    </div>
  );
}

// Predefined SVG paths for common icons
export const SmallBoxIcons = {
  cart: (
    <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
  ),
  chart: (
    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
  ),
  userPlus: (
    <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
  ),
  pieChart: (
    <>
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
      />
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
      />
    </>
  ),
};

