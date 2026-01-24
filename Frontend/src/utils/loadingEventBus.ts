// Loading Event Bus - Global event system for loading state
// This allows apiRequest to trigger loading without React context

type LoadingEventListener = (isLoading: boolean) => void;

class LoadingEventBus {
    private listeners: Set<LoadingEventListener> = new Set();
    private requestCount = 0;

    subscribe(listener: LoadingEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    startRequest(): void {
        this.requestCount++;
        if (this.requestCount === 1) {
            this.notify(true);
        }
    }

    endRequest(): void {
        this.requestCount = Math.max(0, this.requestCount - 1);
        if (this.requestCount === 0) {
            this.notify(false);
        }
    }

    private notify(isLoading: boolean): void {
        this.listeners.forEach((listener) => listener(isLoading));
    }

    get isLoading(): boolean {
        return this.requestCount > 0;
    }
}

// Singleton instance
export const loadingEventBus = new LoadingEventBus();
