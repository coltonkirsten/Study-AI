# StudyBuddy

StudyBuddy is an AI-powered study application that helps you create and manage study sets with various question formats. The application uses OpenAI's GPT models to generate study questions from your text content, PDFs, or notes.

## Features

- **AI-powered question generation:** Upload PDFs, text files, or paste text content to automatically generate study questions
- **Multiple question formats:** Supports both free response and multiple choice questions
- **Progress tracking:** Track your learning progress for each study set
- **Interactive study sessions:** Study questions one by one with immediate feedback
- **Library management:** Browse, organize, and manage your study sets

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Add your OpenAI API key to the `.env` file:

   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```

   You can get an API key from the [OpenAI platform](https://platform.openai.com/api-keys).

4. Start the development server:
   ```
   npm start
   ```

## Using the AI-Powered Study Set Creation

1. Click "Create Study Set" in the library view
2. Enter a title for your study set
3. Either upload a PDF/text file or paste text content directly
4. Click "Generate Study Set"
5. The AI will analyze your content and create appropriate study questions
6. The new study set will be added to your library

## Manual JSON Upload

You can also create and upload your own study sets in JSON format. The format should be:

```json
{
  "name": "Your Study Set Name",
  "description": "A description of your study set",
  "questions": [
    {
      "id": "1",
      "type": "freeResponse",
      "question": "Your free response question here?",
      "answer": "The answer to your question"
    },
    {
      "id": "2",
      "type": "multipleChoice",
      "question": "Your multiple choice question here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 2"
    }
  ]
}
```

## Technologies Used

- React
- OpenAI API
- Zod for validation
- PDF Parse for PDF processing

## Note on API Usage

This application uses the OpenAI API which has associated costs. The app is configured to use the GPT-4o model, which offers a good balance of quality and cost. Monitor your API usage to avoid unexpected charges.

## Privacy Considerations

Your study materials and generated questions are stored only in your browser's local storage and are not shared with any server (except when generating questions through the OpenAI API). To ensure privacy, consider the sensitive nature of any materials you upload for question generation.
