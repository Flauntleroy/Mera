import React, { useRef, useState, useEffect } from 'react';

interface ScrollAreaProps {
    children: React.ReactNode;
    className?: string; // Class for the scrollable element
    containerClassName?: string; // Class for the outer relative container
}

/**
 * A reusable scroll container that adds intelligent top and bottom 
 * shadow indicators when there is more content to scroll.
 */
const ScrollArea: React.FC<ScrollAreaProps> = ({
    children,
    className = '',
    containerClassName = ''
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;

        const { scrollTop, scrollHeight, clientHeight } = el;

        // Show top shadow if scrolled down more than 5px
        setShowTopShadow(scrollTop > 5);

        // Show bottom shadow if there's more than 5px to scroll down
        setShowBottomShadow(scrollHeight - scrollTop - clientHeight > 5);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        // Initial check
        checkScroll();

        // Listen to scroll events
        el.addEventListener('scroll', checkScroll, { passive: true });

        // Resize observer to handle content changes or window resizing
        const resizeObserver = new ResizeObserver(checkScroll);
        resizeObserver.observe(el);

        // Mutation observer to handle dynamically added content
        const mutationObserver = new MutationObserver(checkScroll);
        mutationObserver.observe(el, { childList: true, subtree: true });

        return () => {
            el.removeEventListener('scroll', checkScroll);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, []);

    return (
        <div className={`relative flex flex-col overflow-hidden group/scroll-area ${containerClassName}`}>
            {/* Top Shadow Gradient */}
            <div
                className={`absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white dark:from-gray-900 to-transparent pointer-events-none z-20 transition-opacity duration-500 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Scrollable Element */}
            <div
                ref={scrollRef}
                className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${className}`}
            >
                {children}
            </div>

            {/* Bottom Shadow Gradient */}
            <div
                className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none z-20 transition-opacity duration-500 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

export default ScrollArea;
