# Frontend Tests Documentation

## Structure
```
tests/
  ├── unit/           # Unit tests
  │   ├── components/ # Component tests
  │   ├── store/      # Store tests
  │   └── services/   # Service tests
  ├── e2e/           # End-to-end tests
  └── utils/         # Test utilities
```

## Running Tests
```bash
npm run test:unit     # Run unit tests
npm run test:e2e      # Run e2e tests
npm run test:coverage # Generate coverage report
```

## Test Categories

### Component Tests
- Verify component rendering
- Test component logic
- Validate props/emits
- Check user interactions

### Store Tests
- Validate state management
- Test mutations/actions
- Verify getters
- Check store modules

### Service Tests
- Test API integration
- Validate data transformation
- Check error handling

## Best Practices
1. Test component behavior, not implementation
2. Mock external dependencies
3. Use data-testid for element selection
4. Test accessibility
5. Keep tests focused and simple
6. Use meaningful test data
