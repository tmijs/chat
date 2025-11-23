export type TokenValue = string | (() => string | Promise<string>);
export default class Identity {
    name?: string;
    id?: string;
    private token?;
    static normalizeToken(value: string): string;
    isAnonymous(): boolean;
    setToken(value: TokenValue): void;
    getToken(): Promise<string>;
}
