// Mock Test Data for Dynamic URL Testing

export interface MockTest {
  id: string;
  title: string;
  description: string;
  dynamicUrl: string;
  questions: MockQuestion[];
}

export interface MockQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'boolean';
  options?: string[];
}

export const mockTestData: MockTest = {
  id: 'test_dynamic_001',
  title: 'Sample Dynamic URL Test',
  description: 'A mock test for demonstrating dynamic URL functionality',
  dynamicUrl: '/api/tests/dynamic_001',
  questions: [
    {
      id: 'q1',
      text: 'What is the capital of France?',
      type: 'multiple-choice',
      options: ['Paris', 'London', 'Berlin', 'Madrid']
    },
    {
      id: 'q2',
      text: 'Is the sky blue?',
      type: 'boolean'
    },
    {
      id: 'q3',
      text: 'Describe your favorite hobby',
      type: 'text'
    }
  ]
};

// Function to generate a dynamic test URL
export const generateTestUrl = (testId: string) => {
  return `/api/tests/${testId}`;
};
