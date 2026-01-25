import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon, AngleLeftIcon, AngleRightIcon, ChevronUpIcon, ChevronDownIcon } from "../../icons";
import Combobox from "../ui/Combobox";

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: any;
  defaultDate?: any;
  label?: string;
  placeholder?: string;
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
}: PropsType) {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarHeader, setCalendarHeader] = useState<Element | null>(null);
  const fpInstance = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate,
      onChange,
      onReady: (_, __, instance) => {
        fpInstance.current = instance;
        const monthsContainer = instance.calendarContainer.querySelector('.flatpickr-months');
        if (monthsContainer) {
          // Force hide native elements
          const elementsToHide = instance.calendarContainer.querySelectorAll(
            '.flatpickr-prev-month, .flatpickr-next-month, .flatpickr-month, .flatpickr-current-month'
          );
          elementsToHide.forEach(el => (el as HTMLElement).style.setProperty('display', 'none', 'important'));

          let target = monthsContainer.querySelector('.custom-fp-header');
          if (!target) {
            target = document.createElement('div');
            target.className = 'custom-fp-header w-full p-2 mb-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-t-xl';
            monthsContainer.prepend(target);
          }
          setCalendarHeader(target);
        }
        setCurrentMonth(instance.currentMonth);
        setCurrentYear(instance.currentYear);
      },
      onOpen: (_, __, instance) => {
        const elementsToHide = instance.calendarContainer.querySelectorAll(
          '.flatpickr-prev-month, .flatpickr-next-month, .flatpickr-month, .flatpickr-current-month'
        );
        elementsToHide.forEach(el => (el as HTMLElement).style.setProperty('display', 'none', 'important'));
      },
      onMonthChange: (_, __, instance) => {
        setCurrentMonth(instance.currentMonth);
      },
      onYearChange: (_, __, instance) => {
        setCurrentYear(instance.currentYear);
      }
    });

    return () => {
      if (fpInstance.current) {
        fpInstance.current.destroy();
      }
    };
  }, [mode, onChange, id, defaultDate]);

  const adjustYear = (delta: number) => {
    const newYear = currentYear + delta;
    fpInstance.current?.changeYear(newYear);
    setCurrentYear(newYear);
  };

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <CalenderIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none pl-10 pr-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-200 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800 cursor-pointer"
        />
      </div>

      {/* Inject custom header via Portal */}
      {calendarHeader && createPortal(
        <div
          className="flex items-center justify-between gap-1.5 w-full"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Previous Month Button */}
          <button
            type="button"
            onClick={() => fpInstance.current?.changeMonth(-1, true)}
            className="shrink-0 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600 transition-all text-gray-500 hover:text-brand-500 active:scale-95"
          >
            <AngleLeftIcon className="w-4 h-4" />
          </button>

          <div className="flex flex-1 items-center gap-1 min-w-0">
            {/* Month Selector using Standard Combobox - 60% Width */}
            <div className="flex-[6] min-w-0">
              <Combobox
                options={MONTHS.map((m, i) => ({ value: i.toString(), label: m }))}
                value={currentMonth.toString()}
                onChange={(val) => {
                  const monthIdx = parseInt(val);
                  fpInstance.current?.changeMonth(monthIdx);
                  setCurrentMonth(monthIdx);
                }}
                placeholder="Bulan"
                className="combobox-sm"
                disablePortal={true}
              />
            </div>

            {/* Year Input - 40% Width - Styled to match Combobox */}
            <div className="flex-[4] min-w-0 relative group">
              <input
                type="number"
                value={currentYear}
                onChange={(e) => {
                  const year = parseInt(e.target.value);
                  if (!isNaN(year)) {
                    fpInstance.current?.changeYear(year);
                    setCurrentYear(year);
                  }
                }}
                className="w-full h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-3 pr-7 py-1.5 text-sm font-medium text-gray-900 dark:text-white hover:border-brand-400 dark:hover:border-brand-600 focus:ring-2 focus:ring-brand-500 outline-none transition-all no-spinner"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustYear(1)}
                  className="p-1 text-gray-400 hover:text-brand-500 transition-colors"
                >
                  <ChevronUpIcon className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustYear(-1)}
                  className="p-1 text-gray-400 hover:text-brand-500 transition-colors"
                >
                  <ChevronDownIcon className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Next Month Button */}
          <button
            type="button"
            onClick={() => fpInstance.current?.changeMonth(1, true)}
            className="shrink-0 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600 transition-all text-gray-500 hover:text-brand-500 active:scale-95"
          >
            <AngleRightIcon className="w-4 h-4" />
          </button>
        </div>,
        calendarHeader
      )}
    </div>
  );
}
