---
description: how to implement premium scroll surfaces using ScrollArea
---

Follow these steps when an area in the UI needs vertical scrolling:

1.  **Do NOT use native scrollbars**. The project uses a standardized thin scrollbar defined in `index.css`. Avoid using `no-scrollbar` class unless explicitly required for horizontal-only areas.

2.  **Use the `ScrollArea` component**. This component provides premium "Scroll Shadows" (top and bottom indicators) that show dynamically when content overflows.

3.  **Import the component**:
    ```tsx
    import ScrollArea from '../components/ui/ScrollArea';
    ```

4.  **Wrap your content**:
    ```tsx
    <ScrollArea className="p-6 space-y-4" containerClassName="max-h-[70vh]">
        {/* Your scrollable content here */}
    </ScrollArea>
    ```

5.  **Configuration**:
    - `className`: Applies to the scrollable container.
    - `containerClassName`: Use this to set constraints like `max-h` or `height`.
    - `hideShadows`: (Optional) Set to `true` if you only want the custom scrollbar without the shadow indicators.

6.  **Contexts**:
    - **Modals**: Every modal content area MUST be wrapped in a `ScrollArea`.
    - **Sidebar**: The main navigation menu uses `ScrollArea`.
    - **Page Content**: Main pages should be wrapped in `ScrollArea` within `AppLayout.tsx`.
