import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAppearance } from "../context/AppearanceContext";
import { useAuth } from "../context/AuthContext";
import SidebarWidget from "./SidebarWidget";
import { getAllNavItems, NavItem } from "../config/menuUtils";
import ScrollArea from "../components/ui/ScrollArea";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { appearance } = useAppearance();
  const { navLayout, density } = appearance;
  const { can } = useAuth();
  const location = useLocation();

  // Minimal mode: always collapsed unless hovered
  const isMinimal = navLayout === 'minimal';

  // Determine if content should be shown (text labels, chevrons)
  const showContent = isMinimal
    ? (isHovered || isMobileOpen)
    : (isExpanded || isHovered || isMobileOpen);

  // Get all menu sections filtered by permissions
  const menuData = useMemo(() => getAllNavItems(can), [can]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    sectionId: string;
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Auto-open submenu for active path
  useEffect(() => {
    let submenuMatched = false;

    menuData.forEach(({ section, navItems }) => {
      navItems.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                sectionId: section.id,
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, menuData]);

  // Update submenu height when opened
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.sectionId}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (sectionId: string, index: number) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.sectionId === sectionId && prev.index === index) {
        return null;
      }
      return { sectionId, index };
    });
  };

  // Density-based styling
  const menuGap = density === 'compact' ? 'gap-2' : 'gap-4';
  const itemPadding = density === 'compact' ? 'px-2 py-1.5' : 'px-3 py-2';

  const renderMenuItems = (items: NavItem[], sectionId: string) => (
    <ul className={`flex flex-col ${menuGap}`}>
      {items.map((nav, index) => {
        const isSubmenuOpen = openSubmenu?.sectionId === sectionId && openSubmenu?.index === index;
        const submenuKey = `${sectionId}-${index}`;

        return (
          <li key={nav.id}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(sectionId, index)}
                className={`menu-item group ${itemPadding} ${isSubmenuOpen
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  } cursor-pointer ${!showContent
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isSubmenuOpen
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {showContent && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {showContent && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${isSubmenuOpen ? "rotate-180 text-brand-500" : ""
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${itemPadding} ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    } ${!showContent ? "lg:justify-center" : ""}`}
                >
                  <span
                    className={`menu-item-icon-size ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {showContent && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && showContent && (
              <div
                ref={(el) => {
                  subMenuRefs.current[submenuKey] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: isSubmenuOpen
                    ? `${subMenuHeight[submenuKey]}px`
                    : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.id}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  // Calculate sidebar width based on layout and state
  const getSidebarWidth = () => {
    if (isMinimal) {
      return isHovered ? 'w-[290px]' : 'w-[70px]';
    }
    if (isExpanded || isMobileOpen) {
      return 'w-[290px]';
    }
    return isHovered ? 'w-[290px]' : 'w-[90px]';
  };

  // Density-based padding for sidebar
  const sidebarPadding = density === 'compact' ? 'px-3' : 'px-5';

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 ${sidebarPadding} left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${getSidebarWidth()}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => (isMinimal || !isExpanded) && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="py-8 flex justify-center w-full">
        <Link to="/">
          {showContent ? (
            <img
              className="max-h-14 w-auto"
              src="/images/logo/logo-mera.svg"
              alt="Logo"
            />
          ) : (
            <img
              className="w-10 h-10 object-contain"
              src="/images/logo/logo-mera.svg"
              alt="Logo"
            />
          )}
        </Link>
      </div>
      <ScrollArea className="duration-300 ease-linear" containerClassName="flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {menuData.map(({ section, navItems }) => (
              <div key={section.id}>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!showContent
                    ? "lg:justify-center"
                    : "justify-start"
                    }`}
                >
                  {showContent ? (
                    section.title
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(navItems, section.id)}
              </div>
            ))}
          </div>
        </nav>
        {showContent ? <SidebarWidget /> : null}
      </ScrollArea>
    </aside>
  );
};

export default AppSidebar;
