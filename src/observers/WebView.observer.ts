import { AnalyticsController } from "../controllers/Analytics.controller";
import { Events } from "../constants";

export class WebViewObserver {
    private analyticsController: AnalyticsController;

    private readonly eventStatusMap = {
        paid: Events.PURCHASE_SUCCESS,
        cancelled: Events.PURCHASE_CANCELLED,
        failed: Events.PURCHASE_FAILED,
    }

    constructor(analyticsController: AnalyticsController) {
        this.analyticsController = analyticsController;
    }

    public init() {
        window.addEventListener('message', ({ data }) => {
            try {
                const { eventType, eventData } = JSON.parse(data);
                this.handleEvents(eventType, eventData);
            } catch(e) {}
          });
        this.handlePlatformListener(window.TelegramGameProxy);
        this.handlePlatformListener(window.Telegram.WebView);
        this.handlePlatformListener(window.TelegramGameProxy_receiveEvent);
    }

    private handlePlatformListener(listener: any) {
        if (!listener) {
            return;
        }

        let originalReceiveEvent: (eventType: string, eventData: unknown) => void;

        if (listener?.receiveEvent) {     
            originalReceiveEvent = listener.receiveEvent;
        } else {
            originalReceiveEvent = listener;
            listener = window;
        }

        const observer = this;

        listener.receiveEvent = (eventType: string, eventData: unknown) => {
            observer.handleEvents(eventType, eventData);

            return originalReceiveEvent.call(listener, eventType, eventData);
        }

    }

    private handleEvents(eventType: string, eventData: Record<string, any>) {
        if (eventType === 'invoice_closed') {
            if (this.eventStatusMap[eventData.status]) {
                this.analyticsController.collectEvent(this.eventStatusMap[eventData.status], {
                    slug: eventData.slug,
                });
            }
        }
    }    
}