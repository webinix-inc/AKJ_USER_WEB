/**
 * Quiz and Test Validation Utilities
 * Handles validation for quiz data, questions, and rendering
 */

/**
 * Validate quiz question data structure
 */
export const validateQuestionData = (question) => {
  const errors = [];
  const warnings = [];

  if (!question) {
    errors.push('Question object is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  if (!question._id && !question.id) {
    errors.push('Question missing required ID field');
  }

  if (!question.questionText && (!question.tables || question.tables.length === 0)) {
    errors.push('Question missing both questionText and tables content');
  }

  if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
    errors.push('Question missing or invalid options array');
  } else {
    // Validate options
    const hasCorrectOption = question.options.some(opt => opt.isCorrect);
    if (!hasCorrectOption) {
      warnings.push('No correct option marked for this question');
    }

    question.options.forEach((option, index) => {
      if (!option._id && !option.id) {
        errors.push(`Option ${index + 1} missing required ID field`);
      }
      if (!option.optionText) {
        errors.push(`Option ${index + 1} missing optionText`);
      }
    });
  }

  // Validate question content
  if (question.questionText) {
    if (typeof question.questionText !== 'string') {
      errors.push('questionText must be a string');
    }
  }

  if (question.tables) {
    if (!Array.isArray(question.tables)) {
      errors.push('tables must be an array');
    } else {
      question.tables.forEach((table, index) => {
        if (typeof table !== 'string') {
          warnings.push(`Table ${index + 1} is not a string - may cause rendering issues`);
        }
      });
    }
  }

  // Validate images
  if (question.questionImage) {
    if (!Array.isArray(question.questionImage)) {
      warnings.push('questionImage should be an array');
    } else {
      question.questionImage.forEach((img, index) => {
        if (typeof img !== 'string') {
          warnings.push(`Question image ${index + 1} is not a valid URL string`);
        } else if (!img.startsWith('http') && !img.startsWith('/')) {
          warnings.push(`Question image ${index + 1} may not be a valid URL: ${img}`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate quiz data structure
 */
export const validateQuizData = (quiz) => {
  const errors = [];
  const warnings = [];

  if (!quiz) {
    errors.push('Quiz object is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  if (!quiz._id && !quiz.id) {
    errors.push('Quiz missing required ID field');
  }

  if (!quiz.title) {
    errors.push('Quiz missing title');
  }

  if (!quiz.questions || !Array.isArray(quiz.questions)) {
    errors.push('Quiz missing or invalid questions array');
  } else if (quiz.questions.length === 0) {
    warnings.push('Quiz has no questions');
  }

  // Validate quiz settings
  if (quiz.timeLimit && (typeof quiz.timeLimit !== 'number' || quiz.timeLimit <= 0)) {
    warnings.push('Invalid timeLimit - should be a positive number');
  }

  if (quiz.maxAttempts && (typeof quiz.maxAttempts !== 'number' || quiz.maxAttempts <= 0)) {
    warnings.push('Invalid maxAttempts - should be a positive number');
  }

  // Validate each question
  if (quiz.questions && Array.isArray(quiz.questions)) {
    quiz.questions.forEach((question, index) => {
      const questionValidation = validateQuestionData(question);
      if (!questionValidation.isValid) {
        errors.push(`Question ${index + 1}: ${questionValidation.errors.join(', ')}`);
      }
      if (questionValidation.warnings.length > 0) {
        warnings.push(`Question ${index + 1}: ${questionValidation.warnings.join(', ')}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Sanitize and prepare question data for rendering
 */
export const sanitizeQuestionData = (question) => {
  if (!question) return null;

  const sanitized = {
    id: question._id || question.id,
    questionText: question.questionText || '',
    tables: Array.isArray(question.tables) ? question.tables : [],
    questionImage: Array.isArray(question.questionImage) ? question.questionImage : [],
    options: Array.isArray(question.options) ? question.options.map(opt => ({
      id: opt._id || opt.id,
      value: opt._id || opt.id,
      label: opt.optionText || '',
      optionText: opt.optionText || '',
      isCorrect: Boolean(opt.isCorrect)
    })) : [],
    hasImages: question.questionImage && Array.isArray(question.questionImage) && question.questionImage.length > 0,
    // Add support for new parts-based structure
    parts: question.parts || null
  };

  // If no questionText but has tables, use first table as questionText
  if (!sanitized.questionText && sanitized.tables.length > 0) {
    sanitized.questionText = sanitized.tables[0];
  }

  return sanitized;
};

/**
 * Validate API response structure
 */
export const validateApiResponse = (response, expectedStructure = 'quiz') => {
  const errors = [];
  const warnings = [];

  if (!response) {
    errors.push('API response is null or undefined');
    return { isValid: false, errors, warnings };
  }

  if (!response.data) {
    errors.push('API response missing data field');
    return { isValid: false, errors, warnings };
  }

  switch (expectedStructure) {
    case 'quiz':
      if (!response.data.quiz && !response.data.questions) {
        errors.push('API response missing quiz or questions data');
      }
      break;
    case 'questions':
      if (!response.data.questions || !Array.isArray(response.data.questions)) {
        errors.push('API response missing or invalid questions array');
      }
      break;
    case 'folder':
      if (!response.data.folder) {
        errors.push('API response missing folder data');
      }
      break;
    default:
      warnings.push(`Unknown expected structure: ${expectedStructure}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Enhanced error handler for quiz operations
 */
export const handleQuizError = (error, operation = 'quiz operation') => {
  console.error(`❌ Error in ${operation}:`, error);

  let userMessage = `Failed to ${operation}. Please try again.`;
  let technicalDetails = error.message || 'Unknown error';

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        userMessage = data?.message || 'Invalid request. Please check your data.';
        technicalDetails = `Bad Request: ${data?.error || data?.message || 'Invalid data'}`;
        break;
      case 401:
        userMessage = 'Authentication required. Please log in again.';
        technicalDetails = 'Unauthorized access';
        break;
      case 403:
        userMessage = 'Access denied. You may not have permission for this quiz.';
        technicalDetails = 'Forbidden access';
        break;
      case 404:
        userMessage = 'Quiz or question not found. It may have been deleted.';
        technicalDetails = 'Resource not found';
        break;
      case 422:
        userMessage = data?.message || 'Invalid data provided.';
        technicalDetails = `Validation Error: ${JSON.stringify(data?.errors || data?.message)}`;
        break;
      case 429:
        userMessage = 'Too many requests. Please wait a moment and try again.';
        technicalDetails = 'Rate limit exceeded';
        break;
      case 500:
        userMessage = 'Server error. Please try again later.';
        technicalDetails = `Internal Server Error: ${data?.message || 'Unknown server error'}`;
        break;
      default:
        userMessage = `Unexpected error (${status}). Please try again.`;
        technicalDetails = `HTTP ${status}: ${data?.message || error.message}`;
    }
  } else if (error.code === 'NETWORK_ERROR') {
    userMessage = 'Network connection issue. Please check your internet.';
    technicalDetails = 'Network error';
  } else if (error.code === 'TIMEOUT') {
    userMessage = 'Request timed out. Please try again.';
    technicalDetails = 'Request timeout';
  }

  return {
    userMessage,
    technicalDetails,
    status: error.response?.status || 0,
    originalError: error
  };
};

/**
 * Validate question content for mathematical expressions
 */
export const validateMathContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { hasMath: false, mathExpressions: [] };
  }

  const mathPatterns = [
    /\b\d*x²\b/g,
    /\b\d*x³\b/g,
    /√\d*\w*/g,
    /∫\w*/g,
    /∑\w*/g,
    /\d+\/\d+/g,
    /[=≤≥≠≈]/g,
    /[α-ωΑ-Ω]/g
  ];

  const mathExpressions = [];
  let hasMath = false;

  mathPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      hasMath = true;
      mathExpressions.push(...matches);
    }
  });

  return {
    hasMath,
    mathExpressions: [...new Set(mathExpressions)] // Remove duplicates
  };
};

export default {
  validateQuestionData,
  validateQuizData,
  sanitizeQuestionData,
  validateApiResponse,
  handleQuizError,
  validateMathContent
};
