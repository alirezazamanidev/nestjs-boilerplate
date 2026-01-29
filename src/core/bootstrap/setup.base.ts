export abstract class Setup {
    abstract name: string;
    order = 100;
    isEnabled(): boolean | Promise<boolean> {
        return true;
    }
    abstract setup(app: any): void | Promise<void>;
}
