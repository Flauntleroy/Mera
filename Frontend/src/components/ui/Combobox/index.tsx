import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ScrollArea from '../ScrollArea';

export interface ComboboxOption {
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    loading?: boolean;
    disabled?: boolean;
    disablePortal?: boolean;
    className?: string;
}

const Combobox: React.FC<ComboboxProps> = ({
    options,
    value,
    onChange,
    placeholder = "Pilih opsi...",
    searchPlaceholder = "Cari...",
    loading = false,
    disabled = false,
    disablePortal = false,
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [containerRect, setContainerRect] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
    const selectedOption = options.find(opt => opt.value === value);

    // Update position before opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            setContainerRect(containerRef.current.getBoundingClientRect());
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const DropdownContent = (
        <div
            ref={dropdownRef}
            className={`fixed z-[999999] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ${disablePortal ? '!absolute !z-50' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
                width: Math.max(containerRect.width, 240),
                top: disablePortal ? '100%' : containerRect.bottom + 8,
                left: disablePortal ? 0 : containerRect.left,
                marginTop: disablePortal ? '8px' : 0,
            }}
        >
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <ScrollArea containerClassName="max-h-60" className="p-1">
                {filteredOptions.length > 0 ? (
                    <div className="space-y-0.5">
                        {filteredOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(opt.value);
                                    setIsOpen(false);
                                    setSearchQuery('');
                                }}
                                className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all flex items-center gap-3
                                    ${value === opt.value
                                        ? "bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/20"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"}`}
                            >
                                {opt.icon && (
                                    <div className={`p-1.5 rounded-lg shrink-0 ${value === opt.value ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                                        {opt.icon}
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate">{opt.label}</span>
                                    {opt.description && (
                                        <span className={`text-[10px] truncate ${value === opt.value ? "text-white/70" : "text-gray-500 dark:text-gray-500"}`}>
                                            {opt.description}
                                        </span>
                                    )}
                                </div>
                                {value === opt.value && (
                                    <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <div className="text-2xl mb-2 opacity-20 text-gray-500">📂</div>
                        <p className="text-xs text-gray-500 font-medium">Data tidak ditemukan</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
                disabled={disabled || loading}
                className={`w-full flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white hover:border-brand-400 dark:hover:border-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed ${isOpen ? 'ring-2 ring-brand-500 border-transparent' : ''}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedOption?.icon && (
                        <div className="text-gray-400 shrink-0">{selectedOption.icon}</div>
                    )}
                    <span className={`text-sm truncate ${selectedOption ? "font-medium" : "text-gray-400"}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {loading ? (
                        <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            </button>

            {isOpen && (disablePortal ? DropdownContent : createPortal(DropdownContent, document.body))}
        </div>
    );
};

export default Combobox;
