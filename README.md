# Express Mock Server

This project is a simple Express server built with TypeScript that provides mock JSON responses. It is designed to help developers test their applications without relying on a real backend.

## Project Structure

```
express-mock-server
├── src
│   ├── app.ts                  # Entry point of the application
│   ├── controllers             # Contains controllers for handling requests
│   │   └── mockController.ts    # Controller for mock responses
│   ├── routes                  # Contains route definitions
│   │   └── mockRoutes.ts        # Routes for mock responses
│   ├── middleware              # Contains middleware functions
│   │   └── index.ts            # Middleware exports
│   ├── data                    # Contains mock data
│   │   └── mockData.json        # JSON data for mock responses
│   └── types                   # Contains TypeScript types
│       └── index.ts            # Type definitions
├── package.json                # NPM configuration file
├── tsconfig.json               # TypeScript configuration file
└── README.md                   # Project documentation
```

## Getting Started

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd express-mock-server
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the server:**
   ```
   npm start
   ```

4. **Access the mock API:**
   The server will be running on `http://localhost:3000`. You can access the mock endpoints defined in the `mockRoutes.ts` file.

## API Endpoints

- **GET /mock-data**: Returns mock JSON data from `mockData.json`.

## Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements for the project.

## License

This project is licensed under the MIT License.