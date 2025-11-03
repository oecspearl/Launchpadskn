# AI Lesson Planner Setup Guide

## Overview

The AI Lesson Planner is a feature that helps teachers automatically generate comprehensive lesson plans using artificial intelligence. It's integrated into the "Create Lesson" modal in the Lesson Planning component.

## Features

- **Automatic Lesson Plan Generation**: Generate lesson titles, learning objectives, detailed lesson plans, and homework assignments
- **Context-Aware**: Uses subject name, grade level, and topic to create relevant plans
- **Customizable**: Allows teachers to specify duration, learning style, and previous topics
- **Easy Integration**: Seamlessly populates the lesson form with generated content

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the API key (you won't be able to see it again)

### 2. Configure Environment Variables

Create a `.env` file in the `frontend` directory (if it doesn't exist) and add:

```env
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: 
- Replace `your_openai_api_key_here` with your actual OpenAI API key
- The `.env` file is already in `.gitignore`, so your API key won't be committed to version control
- Restart your development server after adding the environment variable

### 3. Usage

1. Navigate to the Lesson Planning page
2. Click "Create Lesson" button
3. In the modal, expand the "Use AI to Generate Lesson Plan" accordion
4. Fill in the required fields:
   - **Topic** (required): The lesson topic
   - **Grade Level / Form** (required): The grade or form level
   - **Duration**: Select lesson duration (30, 45, 60, or 90 minutes)
   - **Learning Style** (optional): Choose preferred learning style
   - **Previous Topics** (optional): List related previous topics
5. Click "Generate Lesson Plan"
6. The AI will populate the lesson form fields automatically
7. Review and edit the generated content as needed
8. Complete the remaining fields (date, time, location) and save

## How It Works

The AI Lesson Planner uses OpenAI's GPT-3.5-turbo model to generate lesson plans. It:

1. Takes your input (topic, grade level, duration, etc.)
2. Sends a structured prompt to OpenAI's API
3. Receives a JSON response with:
   - Lesson title
   - Learning objectives
   - Detailed lesson plan (with activities and structure)
   - Homework description
4. Automatically fills in the lesson form fields

## API Costs

- The feature uses OpenAI's GPT-3.5-turbo model
- Each lesson plan generation costs approximately $0.001-0.003 (depending on response length)
- You'll need to add credits to your OpenAI account if using a free tier
- Monitor your usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## Troubleshooting

### "OpenAI API key is not configured" Error

- Make sure you've created a `.env` file in the `frontend` directory
- Verify the variable name is exactly `REACT_APP_OPENAI_API_KEY`
- Restart your development server after adding the environment variable

### "API request failed" Error

- Check that your OpenAI API key is valid and has credits
- Verify your internet connection
- Check the browser console for detailed error messages

### Generated Content Not Appearing

- Check the browser console for errors
- Verify the API response was successful
- Try generating again with different inputs

## Security Notes

- Never commit your `.env` file to version control
- The API key is only used client-side for API calls
- Consider implementing a backend proxy for production to protect your API key
- For production, use environment-specific configuration

## Future Enhancements

Potential improvements:
- Backend API proxy to protect API keys
- Support for multiple AI providers (Claude, Gemini, etc.)
- Save and reuse generated templates
- Batch generation for multiple lessons
- Custom prompt templates

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify your OpenAI API key is valid and has credits
3. Ensure all required fields are filled in
4. Review this setup guide

