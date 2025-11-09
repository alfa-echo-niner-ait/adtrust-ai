# AdTrust - AI-Powered Ad Generation & Critique Platform

> **Intelligent advertising creation and validation platform powered by Google AI**

AdTrust is a comprehensive SaaS platform that combines AI-powered ad generation with multi-dimensional critique capabilities. Built for modern marketing teams, it streamlines the creative process through automated generation, brand validation, and human-in-the-loop approval workflows.

[![Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)

## 🌟 Features

### Core Capabilities
- 🎨 **AI Poster Generation** - Create professional ad posters with brand consistency
- 🎬 **AI Video Generation** - Generate engaging video ads with custom specifications
- 🔍 **Multi-Dimensional Critique** - Comprehensive AI analysis across 5 key dimensions:
  - Brand Alignment (with color validation)
  - Visual Quality
  - Message Clarity
  - Tone of Voice
  - Safety & Ethics
- 🎨 **Intelligent Color Extraction** - Automatic brand color suggestions from logos and images
- 🔄 **Multi-Agent Workflow** - Automated generation → critique → refinement loop
- ✅ **Human-in-the-Loop Approval** - Review queue with approve/reject functionality
- 📊 **Brand Validation** - Verify logo presence and brand color consistency
- 🛡️ **Safety Scoring** - Granular safety analysis (harmful content, stereotypes, misleading claims)

### User Experience
- 🎯 Aspect ratio selection (1:1, 3:4, 4:3, 9:16, 16:9)
- 📤 File upload support for brand logos and product images
- 🎨 Interactive color picker with HEX input
- 📱 Responsive design with dark/light mode
- 🔗 One-click critique of generated content
- 📥 Download generated assets
- 🔄 Real-time workflow progress tracking

## 🏗️ Architecture

```
AdTrust/
├── src/                          # Frontend React application
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── ColorPicker.tsx     # Color selection with extraction
│   │   ├── DetailedScoreBreakdown.tsx
│   │   ├── WorkflowProgress.tsx
│   │   └── ...
│   ├── pages/                   # Application pages
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── GeneratePoster.tsx  # Poster generation
│   │   ├── GenerateVideo.tsx   # Video generation
│   │   ├── CritiqueAnalysis.tsx
│   │   ├── AutoWorkflow.tsx    # Multi-agent workflow
│   │   ├── ReviewQueue.tsx     # Approval dashboard
│   │   └── ...
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   │   ├── colorExtraction.ts  # Color extraction logic
│   │   └── utils.ts
│   └── integrations/
│       └── supabase/           # Supabase client & types
│
├── supabase/                    # Backend (Lovable Cloud)
│   ├── functions/              # Edge Functions
│   │   ├── auto-workflow/      # Workflow orchestration
│   │   ├── critique-with-google/
│   │   ├── generate-poster-google/
│   │   └── generate-video-google/
│   └── migrations/             # Database migrations
│
└── python-backend/             # Alternative Python backend
    ├── api/                    # Flask blueprints
    ├── models/                 # SQLAlchemy models
    ├── services/               # Business logic
    ├── utils/                  # Utilities
    └── tests/                  # Test suite
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm (for frontend)
- **Python** 3.9+ (for Python backend, optional)
- **Google AI Studio API Key** (for AI capabilities)
- **Lovable API Key** (for poster generation)

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd adtrust
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   The `.env` file is auto-configured via Lovable Cloud and includes:
   ```env
   VITE_SUPABASE_URL=<auto-configured>
   VITE_SUPABASE_PUBLISHABLE_KEY=<auto-configured>
   VITE_SUPABASE_PROJECT_ID=<auto-configured>
   ```

4. **Configure Secrets** (via Lovable Cloud UI)
   
   Navigate to Project → Settings → Secrets and add:
   - `GOOGLE_API_KEY` - Your Google AI Studio API key
   - `LOVABLE_API_KEY` - Your Lovable AI API key

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Python Backend Setup (Optional)

The Python backend is a standalone Flask application for local development and custom deployments.

1. **Navigate to backend folder**
   ```bash
   cd python-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   ```bash
   python -c "from app import create_app; from extensions import db; app = create_app(); app.app_context().push(); db.create_all()"
   ```

6. **Run the application**
   ```bash
   # Development
   python app.py

   # Production
   gunicorn -w 4 -b 0.0.0.0:5000 'app:create_app()'
   ```

   API will be available at `http://localhost:5000`

7. **Run tests**
   ```bash
   pytest
   
   # With coverage
   pytest --cov=. --cov-report=html
   ```

## 📚 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode

### Backend (Lovable Cloud - Supabase)
- **Database**: PostgreSQL with RLS policies
- **Edge Functions**: Deno runtime (TypeScript)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (optional)
- **Real-time**: Supabase Realtime (for workflow updates)

### Backend (Python Alternative)
- **Framework**: Flask with Blueprint architecture
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **Testing**: pytest with coverage
- **WSGI Server**: Gunicorn
- **Containerization**: Docker & Docker Compose

### AI Services
- **Image Generation**: Google Gemini 2.5 Flash (via Lovable AI Gateway)
- **Video Generation**: Google Imagen 3 / Veo
- **Critique**: Google Gemini 2.0 Flash
- **Color Extraction**: Browser Canvas API (no external dependencies)

## 🎯 Usage Guide

### Generating Posters

1. Navigate to **Generate Poster** page
2. Enter your ad prompt
3. Select aspect ratio (1:1, 3:4, 4:3, 9:16, 16:9)
4. Upload brand logo (optional)
5. Upload product image (optional)
6. Select/add brand colors:
   - Use color picker
   - Enter HEX codes manually
   - Extract colors from uploaded images
7. Click **Generate Poster**

### Generating Videos

1. Navigate to **Generate Video** page
2. Follow similar steps as poster generation
3. Select video aspect ratio (9:16, 16:9)
4. System generates 15-30 second video ads

### Critiquing Content

1. Navigate to **Critique Ad** page
2. Upload image or video file
3. Add brand colors (with extraction support)
4. Enter caption/message
5. View comprehensive critique across 5 dimensions:
   - **Brand Alignment**: Color match, logo presence
   - **Visual Quality**: Composition, clarity
   - **Message Clarity**: Product/service visibility
   - **Tone of Voice**: Communication style
   - **Safety & Ethics**: Harmful content detection

### Auto Workflow (Multi-Agent)

1. Navigate to **Auto Workflow** page
2. Configure initial generation parameters
3. Set iteration limits (default: 3)
4. Set score threshold (default: 0.8)
5. System automatically:
   - Generates content
   - Critiques output
   - Refines based on feedback
   - Repeats until threshold or limit reached

### Review Queue (Human Approval)

1. Navigate to **Review Queue**
2. View pending content awaiting approval
3. Review critique scores and details
4. Approve or reject with comments
5. Track approval history

## 🔌 API Reference

### Edge Functions (Lovable Cloud)

#### POST `/auto-workflow`
Start multi-agent workflow
```typescript
{
  prompt: string,
  contentType: 'image' | 'video',
  brandColors?: string[],
  brandLogo?: string,
  productImage?: string,
  aspectRatio?: string,
  maxIterations?: number,
  scoreThreshold?: number
}
```

#### POST `/critique-with-google`
Analyze content
```typescript
{
  mediaUrl: string,
  mediaType: 'image' | 'video',
  brandColors: string[],
  caption: string
}
```

#### POST `/generate-poster-google`
Generate poster
```typescript
{
  prompt: string,
  brandColors?: string[],
  brandLogo?: string,
  productImage?: string,
  aspectRatio?: string
}
```

#### POST `/generate-video-google`
Generate video
```typescript
{
  prompt: string,
  brandColors?: string[],
  brandLogo?: string,
  productImage?: string,
  aspectRatio?: string
}
```

### Python Backend API

See `python-backend/README.md` for detailed API documentation.

## 🗄️ Database Schema

### Tables

- **generated_posters** - Stores poster generation records
- **generated_videos** - Stores video generation records
- **critiques** - Stores critique analysis results
- **workflow_runs** - Tracks multi-agent workflow executions
- **approval_history** - Logs approval/rejection actions

### Key Fields

#### Critiques Table
```sql
- brand_fit_score: numeric
- visual_quality_score: numeric
- message_clarity_score: numeric
- tone_of_voice_score: numeric
- safety_score: numeric
- brand_validation: jsonb
  {
    color_match_percentage: number,
    logo_present: boolean,
    logo_correct: boolean,
    overall_consistency: number
  }
- safety_breakdown: jsonb
  {
    harmful_content: number,
    stereotypes: number,
    misleading_claims: number
  }
```

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **API key management** via secure secrets
- **Input validation** on all endpoints
- **CORS configuration** for production
- **SQL injection prevention** via ORM/parameterized queries
- **Safe file upload handling** with type validation

## 🚀 Deployment

### Frontend (Lovable Cloud)

1. Click **Publish** button in Lovable editor
2. Configure custom domain (optional, requires paid plan)
3. Frontend changes require clicking "Update" to deploy
4. Backend changes (edge functions, migrations) deploy automatically

### Python Backend (Production)

**Using Docker:**
```bash
cd python-backend
docker-compose up -d
```

**Using Gunicorn:**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 'app:create_app()'
```

**Production Checklist:**
- Set `FLASK_ENV=production`
- Use production WSGI server (Gunicorn)
- Configure reverse proxy (nginx)
- Enable SSL/TLS certificates
- Set up monitoring and logging
- Configure database connection pooling
- Use secure environment-specific secrets
- Enable rate limiting

## 🧪 Testing

### Frontend
```bash
# Run all tests (when implemented)
npm test
```

### Python Backend
```bash
cd python-backend

# Run all tests
pytest

# With coverage report
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_api.py
```

## 📝 Environment Variables

### Frontend (.env - auto-configured)
```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

### Backend Secrets (via Lovable Cloud UI)
- `GOOGLE_API_KEY` - Google AI Studio API key
- `LOVABLE_API_KEY` - Lovable AI API key

### Python Backend (.env)
```env
FLASK_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/adtrust
GOOGLE_API_KEY=your_google_api_key
LOVABLE_API_KEY=your_lovable_api_key
SECRET_KEY=your_secret_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Proprietary - AdTrust Platform

## 🔗 Links

- **Project URL**: https://lovable.dev/projects/6f3b64f8-928a-470d-a608-141161bac4db
- **Documentation**: https://docs.lovable.dev/
- **Support**: https://discord.com/channels/1119885301872070706

## 💡 Tips & Best Practices

### Color Extraction
- Upload logo first to extract brand colors automatically
- Review suggested colors before adding to palette
- System excludes very light/dark shades for better results

### Critique Analysis
- Provide accurate brand colors for better validation
- Include caption/message for tone analysis
- Safety scores check for harmful content, stereotypes, and misleading claims

### Multi-Agent Workflow
- Start with clear, detailed prompts
- Set realistic score thresholds (0.7-0.9)
- Monitor iteration count to avoid excessive runs
- Use human approval for final quality check

### Performance
- Edge functions auto-scale with traffic
- Database connection pooling enabled
- Image/video generation runs asynchronously
- Real-time updates for workflow progress

## 🐛 Troubleshooting

**Issue**: Color extraction not working
- **Solution**: Ensure uploaded image is valid format (PNG, JPG, JPEG)

**Issue**: Generation timing out
- **Solution**: Check API key configuration in secrets

**Issue**: Critique scores seem incorrect
- **Solution**: Verify brand colors are accurate and caption matches content

**Issue**: Workflow stuck in processing
- **Solution**: Check edge function logs in Lovable Cloud dashboard

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Join Lovable Discord community
- Check documentation at docs.lovable.dev

---

**Built with ❤️ using Lovable**
