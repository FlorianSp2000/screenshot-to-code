# screenshot-to-code

A simple tool to convert screenshots, mockups and Figma designs into clean, functional code using AI. Now supporting Claude Sonnet 3.7!

Supported stacks:

- HTML + Tailwind
- HTML + CSS
- React + Tailwind
- Bootstrap

Supported AI models:

- Claude Sonnet 3.7 - Best model!
- GPT-4o - also recommended!
- DALL-E 3 or Flux Schnell (using Replicate) for image generation

See the [Examples](#-examples) section below for more demos.

We also just added experimental support for taking a video/screen recording of a website in action and turning that into a functional prototype.

![google in app quick 3](https://github.com/abi/screenshot-to-code/assets/23818/8758ffa4-9483-4b9b-bb66-abd6d1594c33)

[Learn more about video here](https://github.com/abi/screenshot-to-code/wiki/Screen-Recording-to-Code).

[Follow me on Twitter for updates](https://twitter.com/_abi_).

## 🛠 Getting Started

The app has a React/Vite frontend and a FastAPI backend.

Keys needed:

- [OpenAI API key with access to GPT-4](https://github.com/abi/screenshot-to-code/blob/main/Troubleshooting.md) or Anthropic key (optional)
- Both are recommended so you can compare results from both Claude and GPT4o

Run the backend (I use Poetry for package management - `pip install --upgrade poetry` if you don't have it):

```bash
cd backend
echo "OPENAI_API_KEY=sk-your-key" > .env
echo "ANTHROPIC_API_KEY=your-key" > .env
poetry install
poetry shell
poetry run uvicorn main:app --reload --port 7001
```

You can also set up the keys using the settings dialog on the front-end (click the gear icon after loading the frontend).

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 to use the app.

If you prefer to run the backend on a different port, update VITE_WS_BACKEND_URL in `frontend/.env.local`

For debugging purposes, if you don't want to waste GPT4-Vision credits, you can run the backend in mock mode (which streams a pre-recorded response):

```bash
MOCK=true poetry run uvicorn main:app --reload --port 7001
```

## Docker

If you have Docker installed on your system, in the root directory, run:

```bash
echo "OPENAI_API_KEY=sk-your-key" > .env
docker-compose up -d --build
```

The app will be up and running at http://localhost:5173. Note that you can't develop the application with this setup as the file changes won't trigger a rebuild.


## 📚 Examples

**NYTimes**

| Original                                                                                                                                                        | Replica                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img width="1238" alt="Screenshot 2023-11-20 at 12 54 03 PM" src="https://github.com/abi/screenshot-to-code/assets/23818/3b644dfa-9ca6-4148-84a7-3405b6671922"> | <img width="1414" alt="Screenshot 2023-11-20 at 12 59 56 PM" src="https://github.com/abi/screenshot-to-code/assets/23818/26201c9f-1a28-4f35-a3b1-1f04e2b8ce2a"> |

**Instagram page (with not Taylor Swift pics)**

https://github.com/abi/screenshot-to-code/assets/23818/503eb86a-356e-4dfc-926a-dabdb1ac7ba1

**Hacker News** but it gets the colors wrong at first so we nudge it

https://github.com/abi/screenshot-to-code/assets/23818/3fec0f77-44e8-4fb3-a769-ac7410315e5d
