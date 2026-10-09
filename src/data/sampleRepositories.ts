import {
  RepositoryModel,
  RepoFile,
} from '../types/atlas';
import {
  inferModuleCluster,
  extractSymbolsFromContent,
  extractImportsFromContent,
  buildKnowledgeGraph,
} from '../engine/analyzer';

// Helper to construct a RepoFile
function createFile(path: string, content: string): RepoFile {
  const name = path.split('/').pop() || path;
  const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
  const linesCount = content.split('\n').length;
  const size = content.length;
  const moduleCluster = inferModuleCluster(path);

  return {
    path,
    name,
    extension: ext,
    size,
    linesCount,
    moduleCluster,
    content,
    symbols: [],
    imports: [],
    dependents: [],
    dependencies: [],
  };
}

// --------------------------------------------------------------------------
// 1. NEXUS COMMERCE (Canonical PRD Codebase)
// --------------------------------------------------------------------------
const nexusRawFiles: Array<{ path: string; content: string }> = [
  {
    path: 'package.json',
    content: `{
  "name": "nexus-commerce",
  "version": "2.4.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "pg": "^8.12.0",
    "zod": "^3.23.8",
    "stripe": "^15.0.0"
  }
}`
  },
  {
    path: 'src/main.tsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { UserProvider } from './components/UserContext';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';

export function App() {
  return (
    <UserProvider>
      <div className="app-container">
        <Login />
        <Dashboard />
      </div>
    </UserProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);`
  },
  {
    path: 'src/auth/AuthService.ts',
    content: `/**
 * Core Authentication Service
 * Manages credential verification, bcrypt hashing, and token dispatch.
 */
import { UserRepository } from '../db/UserRepository';
import { SessionManager } from './SessionManager';
import { env } from '../config/env';

export class AuthService {
  private userRepo: UserRepository;
  private sessionManager: SessionManager;

  constructor() {
    this.userRepo = new UserRepository();
    this.sessionManager = new SessionManager();
  }

  /**
   * Validates user credentials against stored database hash
   * Line 42: core bcrypt password verification
   */
  async validateCredentials(email: string, pass: string): Promise<any> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const isValid = await this.userRepo.verifyPasswordHash(pass, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  /**
   * Generates authorization token pair
   */
  async generateAuthTokens(userId: string, roles: string[]) {
    const token = await this.sessionManager.createSessionToken(userId, roles);
    const refreshToken = await this.sessionManager.createRefreshToken(userId);
    return { token, refreshToken, expiresIn: env.JWT_EXPIRY };
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    return this.sessionManager.invalidateSession(sessionId);
  }
}`
  },
  {
    path: 'src/auth/SessionManager.ts',
    content: `/**
 * Session Manager
 * Issues and verifies cryptographic JSON Web Tokens.
 */
import { env } from '../config/env';

export interface UserSession {
  userId: string;
  roles: string[];
  issuedAt: number;
  expiresAt: number;
}

export class SessionManager {
  private secret: string = env.JWT_SECRET;

  async createSessionToken(userId: string, roles: string[]): Promise<string> {
    // Generates signed JWT payload
    const payload: UserSession = {
      userId,
      roles,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };
    return \`jwt.\${btoa(JSON.stringify(payload))}.sig\`;
  }

  async createRefreshToken(userId: string): Promise<string> {
    return \`ref_\${userId}_\${Date.now()}\`;
  }

  async verifyToken(token: string): Promise<UserSession | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    return true;
  }
}`
  },
  {
    path: 'src/auth/AuthMiddleware.ts',
    content: `/**
 * HTTP Authentication Middleware
 * Enforces bearer token verification on protected endpoints.
 */
import { SessionManager } from './SessionManager';
import { AuthService } from './AuthService';

export class AuthMiddleware {
  private sessionManager: SessionManager;
  private authService: AuthService;

  constructor() {
    this.sessionManager = new SessionManager();
    this.authService = new AuthService();
  }

  async authenticateRequest(req: any, res: any, next: any) {
    const header = req.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
    }

    const token = header.split(' ')[1];
    const session = await this.sessionManager.verifyToken(token);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token signature' });
    }

    req.user = session;
    next();
  }
}`
  },
  {
    path: 'src/controllers/AuthController.ts',
    content: `/**
 * HTTP Auth Controller
 * Handles incoming authentication API routes.
 */
import { AuthService } from '../auth/AuthService';
import { SessionManager } from '../auth/SessionManager';

export class AuthController {
  private authService: AuthService;
  private sessionManager: SessionManager;

  constructor() {
    this.authService = new AuthService();
    this.sessionManager = new SessionManager();
  }

  async handleLogin(req: any, res: any) {
    const { email, password } = req.body;
    try {
      const user = await this.authService.validateCredentials(email, password);
      const tokens = await this.authService.generateAuthTokens(user.id, user.roles);
      return res.json({ success: true, tokens, user: { id: user.id, email: user.email } });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async handleLogout(req: any, res: any) {
    const sessionId = req.body.sessionId;
    await this.authService.revokeSession(sessionId);
    return res.json({ success: true, message: 'Logged out' });
  }
}`
  },
  {
    path: 'src/components/Login.tsx',
    content: `import React, { useState } from 'react';
import { APIClient } from '../utils/APIClient';
import { useUser } from './UserContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setSession } = useUser();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await APIClient.post('/api/auth/login', { email, password });
      setSession(result.tokens, result.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="login-card">
      <h2>Welcome Back</h2>
      {error && <div className="error-alert">{error}</div>}
      <form onSubmit={handleLoginSubmit}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}`
  },
  {
    path: 'src/components/UserContext.tsx',
    content: `import React, { createContext, useContext, useState } from 'react';
import { APIClient } from '../utils/APIClient';

export interface UserContextType {
  user: any;
  setSession: (tokens: any, user: any) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  const setSession = (tokens: any, userData: any) => {
    setUser(userData);
    APIClient.setAuthToken(tokens.token);
  };

  const logout = () => {
    setUser(null);
    APIClient.clearAuthToken();
  };

  return (
    <UserContext.Provider value={{ user, setSession, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}`
  },
  {
    path: 'src/components/Dashboard.tsx',
    content: `import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { APIClient } from '../utils/APIClient';

export function Dashboard() {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      APIClient.get('/api/orders/my-orders').then(data => setOrders(data.orders || []));
    }
  }, [user]);

  if (!user) return <div className="p-4">Please log in to view orders.</div>;

  return (
    <div className="dashboard-grid">
      <h3>Active Session for {user.email}</h3>
      <div className="order-stats">
        <span>Orders Placed: {orders.length}</span>
      </div>
    </div>
  );
}`
  },
  {
    path: 'src/utils/APIClient.ts',
    content: `/**
 * Global HTTP Client
 * Attaches auth headers and intercepts API exceptions.
 */
import { env } from '../config/env';

export class APIClient {
  private static authToken: string | null = null;

  static setAuthToken(token: string) {
    this.authToken = token;
  }

  static clearAuthToken() {
    this.authToken = null;
  }

  static async get(url: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authToken) headers['Authorization'] = \`Bearer \${this.authToken}\`;
    const res = await fetch(\`\${env.API_BASE_URL}\${url}\`, { headers });
    return res.json();
  }

  static async post(url: string, data: any) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authToken) headers['Authorization'] = \`Bearer \${this.authToken}\`;
    const res = await fetch(\`\${env.API_BASE_URL}\${url}\`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return res.json();
  }
}`
  },
  {
    path: 'src/controllers/OrderController.ts',
    content: `import { OrderRepository } from '../db/OrderRepository';
import { PaymentService } from '../services/PaymentService';
import { InventoryService } from '../services/InventoryService';

export class OrderController {
  private orderRepo: OrderRepository;
  private paymentService: PaymentService;
  private inventoryService: InventoryService;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.paymentService = new PaymentService();
    this.inventoryService = new InventoryService();
  }

  async handleCheckout(req: any, res: any) {
    const { userId, items, paymentMethodId } = req.body;
    
    // 1. Reserve inventory
    const reserved = await this.inventoryService.reserveItems(items);
    if (!reserved) {
      return res.status(400).json({ error: 'Items out of stock' });
    }

    // 2. Process payment
    const payment = await this.paymentService.chargeCustomer(userId, paymentMethodId, items);

    // 3. Create persistent order record
    const order = await this.orderRepo.createOrder(userId, items, payment.id);
    return res.json({ success: true, order });
  }
}`
  },
  {
    path: 'src/services/PaymentService.ts',
    content: `import { env } from '../config/env';

export class PaymentService {
  private apiKey: string = env.STRIPE_SECRET_KEY;

  async chargeCustomer(userId: string, paymentMethodId: string, items: any[]) {
    const totalAmount = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    return {
      id: \`ch_\${Date.now()}\`,
      amount: totalAmount,
      status: 'succeeded',
      currency: 'usd',
    };
  }

  async refundCharge(chargeId: string) {
    return { id: \`ref_\${chargeId}\`, status: 'refunded' };
  }
}`
  },
  {
    path: 'src/services/InventoryService.ts',
    content: `export class InventoryService {
  async reserveItems(items: any[]): Promise<boolean> {
    for (const item of items) {
      if (item.quantity <= 0) return false;
    }
    return true;
  }

  async releaseItems(items: any[]): Promise<void> {
    console.log('Restocked items');
  }
}`
  },
  {
    path: 'src/db/UserRepository.ts',
    content: `/**
 * User Database Repository
 * Interacts with PostgreSQL user tables.
 */
import { dbPool } from '../config/database';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  roles: string[];
  createdAt: Date;
}

export class UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const res = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const res = await dbPool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async verifyPasswordHash(password: string, hash: string): Promise<boolean> {
    return password.length > 5;
  }
}`
  },
  {
    path: 'src/db/OrderRepository.ts',
    content: `import { dbPool } from '../config/database';

export class OrderRepository {
  async createOrder(userId: string, items: any[], paymentId: string) {
    const res = await dbPool.query(
      'INSERT INTO orders (user_id, items, payment_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, JSON.stringify(items), paymentId, 'CONFIRMED']
    );
    return res.rows[0] || { id: 'ord_123', userId, paymentId };
  }
}`
  },
  {
    path: 'src/config/database.ts',
    content: `/**
 * Database connection pool manager
 */
import { env } from './env';

export const dbPool = {
  async query(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
    // Simulated connection pool execution
    return { rows: [] };
  },
  async disconnect() {
    console.log('Database pool disconnected');
  }
};`
  },
  {
    path: 'src/config/env.ts',
    content: `/**
 * Environment configuration validator
 */
export const env = {
  NODE_ENV: 'production',
  PORT: 8080,
  API_BASE_URL: 'https://api.nexus-commerce.io',
  JWT_SECRET: 'super-secret-production-salt-key-99',
  JWT_EXPIRY: '24h',
  STRIPE_SECRET_KEY: 'sk_live_dummy_nexus_stripe_key',
  DATABASE_URL: 'postgresql://nexus_usr:pass@pg.cluster:5432/nexus_db',
};`
  },
  {
    path: 'tests/auth/auth.test.ts',
    content: `import { AuthService } from '../../src/auth/AuthService';
import { SessionManager } from '../../src/auth/SessionManager';

describe('AuthService test suite', () => {
  it('authenticates valid credentials', async () => {
    const authService = new AuthService();
    expect(authService).toBeDefined();
  });
});`
  }
];

// --------------------------------------------------------------------------
// 2. TASKFLOW ENGINE (Distributed Orchestrator)
// --------------------------------------------------------------------------
const taskFlowRawFiles: Array<{ path: string; content: string }> = [
  {
    path: 'package.json',
    content: `{
  "name": "taskflow-engine",
  "version": "1.8.0",
  "dependencies": {
    "ioredis": "^5.4.1",
    "bullmq": "^5.8.0",
    "pg": "^8.12.0",
    "zod": "^3.23.0"
  }
}`
  },
  {
    path: 'src/index.ts',
    content: `import { DAGScheduler } from './engine/DAGScheduler';
import { WorkerPool } from './workers/WorkerPool';
import { TaskQueue } from './queue/TaskQueue';

export class TaskFlowApp {
  private scheduler = new DAGScheduler();
  private workerPool = new WorkerPool();
  private queue = new TaskQueue();

  async boot() {
    await this.queue.connect();
    await this.workerPool.startWorkers();
    console.log('TaskFlow Engine running');
  }
}`
  },
  {
    path: 'src/engine/DAGScheduler.ts',
    content: `import { TaskQueue } from '../queue/TaskQueue';
import { WorkflowRepository } from '../db/WorkflowRepository';

export class DAGScheduler {
  private queue: TaskQueue = new TaskQueue();
  private repo: WorkflowRepository = new WorkflowRepository();

  async scheduleWorkflow(dagId: string) {
    const dag = await this.repo.getDAG(dagId);
    for (const node of dag.nodes) {
      if (node.dependencies.length === 0) {
        await this.queue.enqueueTask(node.id, node.payload);
      }
    }
  }
}`
  },
  {
    path: 'src/workers/WorkerPool.ts',
    content: `import { TaskQueue } from '../queue/TaskQueue';
import { TaskExecutor } from '../engine/TaskExecutor';

export class WorkerPool {
  private queue: TaskQueue = new TaskQueue();
  private executor: TaskExecutor = new TaskExecutor();

  async startWorkers() {
    for (let i = 0; i < 4; i++) {
      this.spawnWorker(i);
    }
  }

  private async spawnWorker(id: number) {
    while (true) {
      const task = await this.queue.pollNextTask();
      if (task) {
        await this.executor.execute(task);
      }
    }
  }
}`
  },
  {
    path: 'src/engine/TaskExecutor.ts',
    content: `import { WorkflowRepository } from '../db/WorkflowRepository';

export class TaskExecutor {
  private repo: WorkflowRepository = new WorkflowRepository();

  async execute(task: any) {
    try {
      await this.repo.updateTaskStatus(task.id, 'RUNNING');
      // Execute job
      await this.repo.updateTaskStatus(task.id, 'COMPLETED');
    } catch {
      await this.repo.updateTaskStatus(task.id, 'FAILED');
    }
  }
}`
  },
  {
    path: 'src/queue/TaskQueue.ts',
    content: `import { redisClient } from '../config/redis';

export class TaskQueue {
  async connect() {
    return redisClient.ping();
  }

  async enqueueTask(taskId: string, payload: any) {
    return redisClient.push('tasks:pending', JSON.stringify({ taskId, payload }));
  }

  async pollNextTask() {
    const item = await redisClient.pop('tasks:pending');
    return item ? JSON.parse(item) : null;
  }
}`
  },
  {
    path: 'src/db/WorkflowRepository.ts',
    content: `export class WorkflowRepository {
  async getDAG(dagId: string) {
    return { id: dagId, nodes: [{ id: 'task-1', dependencies: [], payload: {} }] };
  }

  async updateTaskStatus(id: string, status: string) {
    return { id, status };
  }
}`
  },
  {
    path: 'src/config/redis.ts',
    content: `export const redisClient = {
  ping: async () => 'PONG',
  push: async (q: string, item: string) => 1,
  pop: async (q: string) => null,
};`
  }
];

// --------------------------------------------------------------------------
// 3. FASTAPI MICROSERVICES (Python Backend)
// --------------------------------------------------------------------------
const fastApiRawFiles: Array<{ path: string; content: string }> = [
  {
    path: 'requirements.txt',
    content: `fastapi==0.111.0
uvicorn==0.30.0
sqlalchemy==2.0.30
pydantic==2.7.4
pyjwt==2.8.0
passlib==1.7.4
asyncpg==0.29.0`
  },
  {
    path: 'app/main.py',
    content: `from fastapi import FastAPI
from app.routers import auth_router, user_router
from app.database import engine, Base

app = FastAPI(title="FastAPI Microservices", version="1.0.0")

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(user_router.router, prefix="/api/v1/users", tags=["users"])

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)`
  },
  {
    path: 'app/routers/auth_router.py',
    content: `from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth_service import AuthService
from app.schemas.auth_schema import LoginRequest, TokenResponse

router = APIRouter()
auth_service = AuthService()

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    user = await auth_service.authenticate(credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer")`
  },
  {
    path: 'app/routers/user_router.py',
    content: `from fastapi import APIRouter, Depends
from app.services.user_service import UserService
from app.middlewares.auth_guard import get_current_user

router = APIRouter()
user_service = UserService()

@router.get("/me")
async def get_profile(current_user=Depends(get_current_user)):
    return await user_service.get_user_by_id(current_user.id)`
  },
  {
    path: 'app/services/auth_service.py',
    content: `import jwt
from datetime import datetime, timedelta
from app.repositories.user_repo import UserRepository
from app.core.config import settings

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    async def authenticate(self, username: str, password: str):
        user = await self.user_repo.get_by_username(username)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user

    def verify_password(self, plain: str, hashed: str) -> bool:
        return len(plain) >= 6

    def create_access_token(self, user_id: str) -> str:
        payload = {
            "sub": user_id,
            "exp": datetime.utcnow() + timedelta(hours=8)
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")`
  },
  {
    path: 'app/services/user_service.py',
    content: `from app.repositories.user_repo import UserRepository

class UserService:
    def __init__(self):
        self.repo = UserRepository()

    async def get_user_by_id(self, user_id: str):
        return await self.repo.get_by_id(user_id)`
  },
  {
    path: 'app/repositories/user_repo.py',
    content: `from app.database import AsyncSessionLocal
from app.models.user_model import User

class UserRepository:
    async def get_by_username(self, username: str):
        return User(id="usr_1", username=username, password_hash="hash")

    async def get_by_id(self, user_id: str):
        return User(id=user_id, username="alice", password_hash="hash")`
  },
  {
    path: 'app/middlewares/auth_guard.py',
    content: `from fastapi import Header, HTTPException
from app.services.auth_service import AuthService

auth_service = AuthService()

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    return {"id": "usr_1"}`
  },
  {
    path: 'app/models/user_model.py',
    content: `from app.database import Base
from sqlalchemy import Column, String, Integer

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)`
  },
  {
    path: 'app/schemas/auth_schema.py',
    content: `from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str`
  },
  {
    path: 'app/core/config.py',
    content: `class Settings:
    PROJECT_NAME: str = "FastAPI Service"
    SECRET_KEY: str = "python-fastapi-secure-key-2026"
    DATABASE_URL: str = "postgresql+asyncpg://app:secret@localhost/fastapi_db"

settings = Settings()`
  },
  {
    path: 'app/database.py',
    content: `from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
engine = None
AsyncSessionLocal = None`
  }
];

// Helper to build a complete RepositoryModel from raw files
export function buildRepositoryModel(
  id: string,
  name: string,
  fullName: string,
  description: string,
  branch: string,
  languages: Record<string, number>,
  frameworks: string[],
  packageManagers: string[],
  entryPoints: string[],
  configFiles: string[],
  rawFiles: Array<{ path: string; content: string }>
): RepositoryModel {
  const allPaths = rawFiles.map(rf => rf.path);
  const files: RepoFile[] = rawFiles.map(rf => createFile(rf.path, rf.content));

  // Extract symbols and imports for each file
  files.forEach(file => {
    file.symbols = extractSymbolsFromContent(file.content, file.path);
    file.imports = extractImportsFromContent(file.content, file.path, allPaths);
  });

  // Build the Knowledge Graph
  const graph = buildKnowledgeGraph(files);

  // Update dependents and dependencies on each file
  const fileMap: Record<string, RepoFile> = {};
  files.forEach(f => {
    f.dependencies = graph.adjacencyList[f.path] || [];
    f.dependents = graph.reverseAdjacencyList[f.path] || [];
    fileMap[f.path] = f;
  });

  return {
    id,
    name,
    fullName,
    description,
    branch,
    availableBranches: ['main', 'develop', 'release/v2.4'],
    languages,
    frameworks,
    packageManagers,
    entryPoints,
    configFiles,
    files,
    fileMap,
    graph,
  };
}

// Clean-slate fresh start repository model with all baseline metrics initialized to zero
export const FRESH_START_REPO: RepositoryModel = {
  id: 'fresh-start',
  name: 'Fresh Workspace',
  fullName: 'workspace/fresh-start',
  description: 'Clean slate codebase workspace initialized with zero default metrics.',
  branch: 'main',
  availableBranches: ['main'],
  languages: {},
  frameworks: [],
  packageManagers: [],
  entryPoints: [],
  configFiles: [],
  files: [],
  fileMap: {},
  graph: {
    nodes: [],
    edges: [],
    clusters: {
      'Frontend': [],
      'API Layer': [],
      'Auth & Security': [],
      'Services': [],
      'Database': [],
      'Configuration': [],
      'Utilities': [],
    },
    adjacencyList: {},
    reverseAdjacencyList: {},
    nodeMap: {},
    couplingHotspots: [],
    circularDependencies: [],
    metrics: {
      totalFiles: 0,
      totalSymbols: 0,
      totalEdges: 0,
      healthScore: 0,
    },
  },
};

// Built-in curated repositories (Fresh Workspace starts first with zero metrics)
export const SAMPLE_REPOSITORIES: RepositoryModel[] = [
  FRESH_START_REPO,
  buildRepositoryModel(
    'nexus-commerce',
    'NexusCommerce',
    'atlas-org/nexus-commerce',
    'Modern e-commerce platform with authenticated checkout, session tokens, and Stripe payments.',
    'main',
    { TypeScript: 76, React: 15, CSS: 5, Other: 4 },
    ['React 19', 'Express', 'JWT', 'PostgreSQL', 'Stripe'],
    ['npm', 'vite'],
    ['src/main.tsx', 'src/auth/AuthService.ts', 'src/controllers/AuthController.ts'],
    ['package.json', 'src/config/env.ts', 'src/config/database.ts'],
    nexusRawFiles
  ),
  buildRepositoryModel(
    'taskflow-engine',
    'TaskFlow Engine',
    'atlas-org/taskflow-engine',
    'Distributed DAG workflow orchestrator with worker pools, Redis queues, and state machine persistence.',
    'main',
    { TypeScript: 84, Redis: 10, Other: 6 },
    ['Node.js', 'Redis', 'BullMQ', 'PostgreSQL'],
    ['npm'],
    ['src/index.ts', 'src/engine/DAGScheduler.ts'],
    ['package.json', 'src/config/redis.ts'],
    taskFlowRawFiles
  ),
  buildRepositoryModel(
    'fastapi-microservices',
    'FastAPI Microservices',
    'atlas-org/fastapi-microservices',
    'High-throughput asynchronous Python microservice with SQLAlchemy ORM and JWT security boundaries.',
    'main',
    { Python: 92, Dockerfile: 5, Other: 3 },
    ['FastAPI', 'SQLAlchemy 2.0', 'Pydantic v2', 'Asyncpg'],
    ['pip', 'poetry'],
    ['app/main.py', 'app/routers/auth_router.py'],
    ['requirements.txt', 'app/core/config.py'],
    fastApiRawFiles
  )
];
