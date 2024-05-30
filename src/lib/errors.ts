export function getErrors(fieldErrors: string[] | undefined): string[] {
    const errors: string[] = [];
    if (fieldErrors) {
        for (const error of fieldErrors) {
            errors.push(error);
        }
    }

    return errors;
}