export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 px-6 bg-white dark:bg-(--color-card-bg-dark) border-t border-gray-200 dark:border-(--color-card-border-dark) text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            Sistem Manajemen Risiko
          </span>
          <span className="text-gray-400 dark:text-gray-500">—</span>
          <span>Risk Management System</span>
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          © {currentYear} PT. Gapura Angkasa
        </div>
      </div>
    </footer>
  );
}

