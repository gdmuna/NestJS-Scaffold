declare global {
    namespace Express {
        interface Request {
            id?: string;
            version?: string;
            user?: {
                id: string;
                username: string;
            };
        }
    }
}

export {};
