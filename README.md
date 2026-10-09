# ATLAS

**Understand your code. See how everything connects.**

ATLAS is a project I'm building to make exploring codebases easier.

Ever opened a project and had no idea where to start? Or changed one file and wondered what else might be affected?

That's the idea behind ATLAS.

### What I'm building

- Explore a project's structure and files.
- Visualize connections between different parts of the codebase.
- Trace dependencies and understand how modules interact.
- Investigate what could break when a file changes.
- Use AI to help make unfamiliar code easier to understand.

The feature I especially want to get right is simple:

**"If I change this file, what else could break?"**

### Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Gemini API
- npm

### Getting started

You'll need [Node.js](https://nodejs.org/) and npm installed.

**1. Clone the repository**

```bash
git clone https://github.com/RISHABH-EXE-4/ATLAS.git
cd ATLAS
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure your environment**

If the app requires the Gemini API, create a `.env.local` file and add the environment variable expected by the project:

```env
GEMINI_API_KEY=your_api_key_here
```

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).

Keep your API key private. Never commit it to GitHub.

**4. Run locally**

```bash
npm run dev
```

Open the local URL shown in your terminal.

### Status

ATLAS is a work in progress. I'm building it step by step, with the goal of making codebase exploration and change-impact analysis genuinely useful.

There's still plenty to build, and I'll update this README as things take shape.

### Feedback

Suggestions and bug reports are welcome. Feel free to open an issue.

---

*Made for developers who want to understand the whole project, not just one file.*
