import { useEffect, useRef, useState } from 'react';

const CABANG_OPTIONS = [
  { code: 'KPS', label: 'KPS' },
  { code: 'CGK', label: 'CGK' },
  { code: 'HLP', label: 'HLP' },
  { code: 'YIA', label: 'YIA' },
  { code: 'DPS', label: 'DPS' },
  { code: 'SUB', label: 'SUB' },
  { code: 'KNO', label: 'KNO' },
  { code: 'UPG', label: 'UPG' },
  { code: 'AAP', label: 'AAP' },
  { code: 'AMQ', label: 'AMQ' },
  { code: 'BDJ', label: 'BDJ' },
  { code: 'BDO', label: 'BDO' },
  { code: 'BIK', label: 'BIK' },
  { code: 'BKS', label: 'BKS' },
  { code: 'BPN', label: 'BPN' },
  { code: 'BTH', label: 'BTH' },
  { code: 'BTJ', label: 'BTJ' },
  { code: 'BWX', label: 'BWX' },
  { code: 'DJB', label: 'DJB' },
  { code: 'DJJ', label: 'DJJ' },
  { code: 'DTB', label: 'DTB' },
  { code: 'JOG', label: 'JOG' },
  { code: 'KJT', label: 'KJT' },
  { code: 'KOE', label: 'KOE' },
  { code: 'LBJ', label: 'LBJ' },
  { code: 'LOP', label: 'LOP' },
  { code: 'MDC', label: 'MDC' },
  { code: 'MKQ', label: 'MKQ' },
  { code: 'MKW', label: 'MKW' },
  { code: 'PDG', label: 'PDG' },
  { code: 'PGK', label: 'PGK' },
  { code: 'PLU', label: 'PLU' },
  { code: 'PNM', label: 'PNM' },
  { code: 'PNK', label: 'PNK' },
  { code: 'SOC', label: 'SOC' },
  { code: 'SRG', label: 'SRG' },
  { code: 'TJQ', label: 'TJQ' },
  { code: 'TKG', label: 'TKG' },
  { code: 'TNJ', label: 'TNJ' },
];

export default function CabangDropdown({ value, onChange, error = false, openUpward = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = CABANG_OPTIONS.find(opt => opt.code === value) || CABANG_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.code);
    setIsOpen(false);
  };

  const inputBase = 'w-full pl-4 pr-10 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0c9361] dark:focus:ring-[#0c9361] focus:border-[#0c9361] dark:focus:border-[#0c9361] transition-colors box-border';
  const borderClass = error ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-600';

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${inputBase} ${borderClass} text-left cursor-pointer pr-10`}
        >
          <span className="block truncate">{selectedOption.label}</span>
        </button>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <i className={`bi bi-chevron-down text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-50 w-full ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}>
            <div
              ref={listRef}
              className="max-h-[192px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {CABANG_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    value === option.code
                      ? 'bg-[#0c9361]/10 dark:bg-[#0c9361]/20 text-[#0c9361] dark:text-[#0c9361] font-medium'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
