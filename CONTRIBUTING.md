# Contributing to k3mate

Thank you for your interest in contributing to `k3mate`! This project aims to provide a lightweight and secure web interface for managing k3s clusters.

## Code of Conduct

Help us keep the project welcoming and inclusive. Please follow common-sense professional guidelines when interacting with other contributors.

## How Can I Contribute?

### Reporting Bugs
If you find a bug, please open an issue on GitHub. Include:
- A clear description of the bug.
- Steps to reproduce the issue.
- Expected vs actual behavior.
- Relevant logs or screenshots.

### Suggesting Enhancements
We welcome ideas for new features! Please open an issue to discuss your proposal before starting development.

### Pull Requests
1. Fork the repository.
2. Create a new branch for your feature or bugfix: `git checkout -b feature/my-new-feature`
3. Implement your changes. Ensure you add or update tests where appropriate.
4. Document any new functions or components with JSDoc.
5. Run linting and tests: `npm run lint` and `npm test`.
6. Push your branch and open a Pull Request.

## Development Setup

1. Clone the repository: `git clone https://github.com/flippinhutt/k3mate.git`
2. Install dependencies: `npm install`
3. Configure environment: Copy `.env.example` to `.env` and fill in required fields.
4. Start development server: `npm run dev`

## Coding Standards

- Use TypeScript for all source code.
- Follow the existing project structure (App Router architecture).
- Use JSDoc for all public functions and components.
- Use TailwindCSS for styling where possible.
- Ensure all tests pass before submitting a PR.
