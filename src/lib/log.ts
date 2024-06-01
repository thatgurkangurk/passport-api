export function customLogger(message: string, ...rest: string[]): void {
    console.log(message, ...rest);
}