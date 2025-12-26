# 🧠 GPA - Goal Pursuit Accelerator

<div align="center">
  
A neuroscience-informed goal achievement platform that gamifies personal growth using behavioral psychology principles.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

</div>

---

## 🎯 What is GPA?

The **Goal Pursuit Accelerator** is a sophisticated web application that helps you achieve your goals by applying cutting-edge neuroscience research on motivation, dopamine, and habit formation. Unlike traditional to-do apps, GPA actively prevents you from setting goals that are too easy (boring) or too hard (anxiety-inducing).

### Core Neuroscience Protocols

1. **🎲 The Goldilocks Rule**
   - All goals must be rated difficulty 6-8/10
   - Too easy (1-5): Insufficient dopamine engagement
   - Too hard (9-10): Triggers amygdala-based avoidance
   - Just right (6-8): Optimal challenge for sustained motivation

2. **⚡ Reward Prediction Error (RPE)**
   - Variable rewards when completing milestones
   - 70% standard reward, 30% chance of JACKPOT or nothing
   - Unpredictability maximizes dopaminergic response

3. **🚦 Go/No-Go Actions**
   - Every milestone requires both actions to take AND actions to avoid
   - Clear behavioral guidance reduces decision fatigue
   - Explicit "avoid" actions prevent self-sabotage

4. **🔥 Foreshadowing Failure (Amygdala Activation)**
   - Periodic prompts to visualize failure scenarios
   - Triggers mild urgency without overwhelming anxiety
   - Maintains autonomic arousal to prevent complacency

5. **🌌 Space-Time Bridging**
   - Guided attention exercise (Internal → Body → Near → Far → Broad → Return)
   - Helps shift perspective from micro-details to macro-vision
   - Based on Huberman Lab neuroscience protocols

---

## ✨ Key Features

### 🤖 AI-Powered Goal Creation
- **Automatic Difficulty Assessment**: Gemini AI analyzes your goal and estimates difficulty
- **Smart Expansion/Reduction**: Too easy? AI suggests more ambitious versions. Too hard? AI breaks it into stepping stones
- **Goal Polish**: AI optimizes your title and description for maximum motivation
- **Starting Point Suggestions**: AI provides 3 concrete micro-actions to begin

### 📊 Intelligent Milestone System
- Break goals into actionable milestones with deadlines
- Visual urgency indicators (overdue, due today, approaching)
- Built-in logging system: track insights, blockers, wins, and general logs
- GO/NO-GO action requirements enforced

### 💬 Neural Assistant (Persistent Chat)
- Context-aware AI coach powered by Gemini Flash
- Slides in from the side, stays available while you work
- Provides guidance on goal design, milestone planning, and motivation strategies
- Uses neuroscience terminology and concepts

### 📅 Schedule Generator
- Auto-generates weekly schedules from your active goals
- Considers deadlines and priorities
- AI-powered time allocation

### 📈 Goal Audit & Balance
- Analyzes your goals across life domains
- Identifies gaps (e.g., no social/health goals)
- Suggests new categories to pursue

### 🎨 Powerful UI/UX
- **Dark, Clinical Aesthetic**: Slate/indigo theme with neuroscience terminology
- **Grid/List View Toggle**: Compact overview or detailed list
- **Zoom Controls**: 80-150% interface scaling
- **Collapse/Expand All**: Quick navigation through many goals
- **Export/Import**: JSON backup and restore for data portability
- **Real-time Progress**: Visual feedback and animated rewards

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adantra/GPA-Goal-Achievement-System.git
   cd GPA-Goal-Achievement-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:5173` (or the URL shown in terminal)

### Production Build

```bash
npm run build
npm run preview
```

The build outputs to the `/dist` directory and can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

---

## 📖 How to Use

### 1. **Sign Up or Try Demo Mode**
- Create an account or click "Try Demo Mode" to explore pre-populated goals
- Demo includes 5 goals across fitness, meditation, career, sleep, and learning

### 2. **Create Your First Goal**
- Click "Define New Protocol" in the left sidebar
- Enter title and description
- Use **AI Assess Difficulty** to get an intelligent estimate
- If difficulty is outside 6-8 range, click **Expand Horizon** or **Reduce Scope**
- Submit when in the Goldilocks Zone (green indicator)

### 3. **Add Milestones**
- Click "+ Add Milestone" under any goal
- Define actionable steps with optional deadlines
- **Must include at least 1 GO and 1 NO-GO action**
- Use AI to generate action suggestions

### 4. **Track Progress**
- Complete milestones to trigger Reward Prediction Error
- Add logs, insights, blockers, or wins to each milestone
- Watch overall goal status update automatically

### 5. **Use Neuro-Tools**
- **Space-Time Bridge**: 30-second guided focus exercise
- **Amygdala Protocol**: Review your failure scenario (if blocked)
- **Neuro-Chronology**: Generate AI schedule from goals
- **Neuro-Balance Audit**: Check goal distribution across life domains

### 6. **Work with Neural Assistant**
- Click "Neural Assistant" to open the chat sidebar
- Ask questions about goal design, difficulty ratings, or motivation strategies
- Assistant has context of your current goal when editing/creating

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with latest features |
| **TypeScript** | Type safety and developer experience |
| **Vite** | Lightning-fast build tool and dev server |
| **Tailwind CSS** | Utility-first styling (via CDN) |
| **Framer Motion** | Smooth animations and transitions |
| **Lucide React** | Beautiful, consistent icons |
| **Google Gemini API** | AI-powered coaching, assessment, and TTS |
| **LocalStorage** | Client-side data persistence |

---

## 🗂️ Project Structure

```
GPA-Goal-Achievement-System/
├── components/
│   ├── CreateGoalForm.tsx        # AI-powered goal creation
│   ├── Dashboard.tsx              # Main app interface
│   ├── ForeshadowingFailureModal.tsx  # Amygdala activation
│   ├── GoalAuditModal.tsx         # Life balance analysis
│   ├── LoginForm.tsx              # Authentication UI
│   ├── MilestoneInput.tsx         # Add new milestones
│   ├── MilestoneItem.tsx          # Milestone display/edit
│   ├── NeuralAssistant.tsx        # AI chat sidebar
│   ├── ScheduleGenerator.tsx      # Weekly schedule AI
│   └── SpaceTimePlayer.tsx        # Guided meditation tool
├── services/
│   ├── auth.ts                    # User management + demo data
│   ├── dataManagement.ts          # Export/import logic
│   ├── goalController.ts          # Goal CRUD + Goldilocks validation
│   └── milestoneController.ts     # Milestone CRUD + RPE rewards
├── App.tsx                        # Root component
├── index.tsx                      # React entry point
├── types.ts                       # TypeScript interfaces
├── index.html                     # HTML entry
├── vite.config.ts                 # Vite configuration
└── package.json                   # Dependencies
```

---

## 🧪 Key Concepts Explained

### The Goldilocks Rule (Flow State)
Research shows that tasks with difficulty ~4% above current ability trigger "flow state" - optimal engagement. GPA enforces this at the goal level by rejecting goals outside the 6-8/10 range.

### Reward Prediction Error
When rewards are unpredictable, dopamine spikes are higher than for guaranteed rewards. GPA uses a 70/30/0 split for milestone completion rewards to leverage this neuroscience principle.

### Amygdala Activation
Mild fear/urgency can prevent complacency. The "Foreshadowing Failure" modal occasionally blocks access until you write a vivid failure scenario, triggering autonomic arousal without overwhelming anxiety.

### Space-Time Bridging
By systematically shifting attention from internal sensations to cosmic perspective and back, this exercise trains cognitive flexibility and reduces myopic stress.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub Issues
- Suggest features or neuroscience protocols
- Submit pull requests with improvements

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- **Neuroscience Research**: Concepts inspired by work from Andrew Huberman, James Clear, and dopamine research
- **AI Integration**: Powered by Google Gemini API
- **Design Inspiration**: Clinical, futuristic UI aesthetic

---

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **GitHub Repository**: [https://github.com/adantra/GPA-Goal-Achievement-System](https://github.com/adantra/GPA-Goal-Achievement-System)
- **AI Studio**: [https://ai.studio/apps/drive/1C7h8X4I4HHl4H5_ss3KnY2joyMwLNoFD](https://ai.studio/apps/drive/1C7h8X4I4HHl4H5_ss3KnY2joyMwLNoFD)

---

<div align="center">

**Built with 🧠 by leveraging neuroscience for human optimization**

*Remember: The goal is not perfection, but progress in the Goldilocks Zone.*

</div>
