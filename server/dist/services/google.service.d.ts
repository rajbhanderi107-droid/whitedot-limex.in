export declare function googleCredsAvailable(): boolean;
export interface AdsResult {
    metrics: Array<{
        label: string;
        value: string | number;
        hint?: string;
    }>;
    rows: Array<Record<string, string | number>>;
}
export declare function adsCredsAvailable(): boolean;
export declare function fetchGoogleAds(): Promise<AdsResult>;
export interface Ga4Result {
    metrics: Array<{
        label: string;
        value: string | number;
        hint?: string;
    }>;
    rows: Array<Record<string, string | number>>;
}
export declare function fetchGA4(propertyId: string): Promise<Ga4Result>;
export interface GscResult {
    metrics: Array<{
        label: string;
        value: string | number;
        hint?: string;
    }>;
    rows: Array<Record<string, string | number>>;
}
export declare function fetchSearchConsole(siteUrl: string): Promise<GscResult>;
//# sourceMappingURL=google.service.d.ts.map