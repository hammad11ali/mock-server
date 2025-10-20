import { Request, Response } from 'express';

class MockController {
    getMockData(req: Request, res: Response) {
        const mockData = {
            message: "This is a mock response",
            data: [
                { id: 1, name: "Item 1" },
                { id: 2, name: "Item 2" },
                { id: 3, name: "Item 3" }
            ]
        };
        res.json(mockData);
    }
}

export default MockController;