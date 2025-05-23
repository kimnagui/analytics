import { AnalyticsController } from "../controllers/Analytics.controller";
import { Events } from "../constants";

export class WebViewObserver {
    private analyticsController: AnalyticsController;

    private webView = typeof window !== 'undefined' && window?.Telegram?.WebView
        ? window.Telegram.WebView
        : null;

    private readonly invoiceStatusMap = {
        paid: Events.PURCHASE_SUCCESS,
        cancelled: Events.PURCHASE_FAILED,
        failed: Events.PURCHASE_FAILED,
    }

    constructor(analyticsController: AnalyticsController) {
        this.analyticsController = analyticsController;
    }

    public init() {
        if (this.webView) {
            this.webView?.receiveEvent('visibility_changed', (event: string, data?: {
                is_visible: boolean;
            }) => {
                if (data.is_visible) {
                    this.analyticsController.collectEvent(Events.HIDE, undefined);
                }
            });

            this.webView?.receiveEvent('web_app_open_invoice', (event: string, data?: {
                slug: string;
            }) => {
                this.analyticsController.collectEvent(Events.PURCHASE_INIT, {
                    slug: data.slug || ''
                });
            });
            
            this.webView?.receiveEvent('invoice_closed', (event: string, data?: {
                slug: string;
                status: 'paid' | 'cancelled' | 'failed' | 'pending'
            }) => {
                if (this.invoiceStatusMap[data.status]) {
                    this.analyticsController.collectEvent(this.invoiceStatusMap[data.status], {
                        slug: data.slug,
                    });
                }
            });
        }
    }

}