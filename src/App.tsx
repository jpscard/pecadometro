import { useState, useEffect } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut, doc, setDoc, getDoc, collection, query, where, orderBy, limit, onSnapshot, getDocs, deleteDoc } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { SINS } from './constants';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Checkbox } from './components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/dialog';
import { Separator } from './components/ui/separator';
import { ThemeToggle } from './components/theme-toggle';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { 
  Flame, Trophy, History, LogOut, CheckCircle2, AlertTriangle, 
  TrendingUp, BarChart3, Activity, Calendar, Award, Brain, Zap, Target,
  Share2, Copy, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Error Handling Types
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Types
interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  totalScore: number;
}

interface DailyLog {
  userId: string;
  date: string;
  sins: string[];
  score: number;
  synthesis?: string;
}

const generateSynthesis = (sins: string[]) => {
  if (sins.length === 0) return "Alerta de Santidade! O céu hoje está em festa. ✨";
  if (sins.includes('Glutonaria')) return "O estômago venceu a consciência (de novo). 🥞";
  if (sins.includes('Preguiça')) return "Procrastinou até a santidade hoje. 😴";
  if (sins.includes('Orgulho/Soberba')) return "Ego inflado: a gravidade não funcionou hoje. 🎈";
  if (sins.includes('Palavrões')) return "Vocabulário de marinheiro em dia de fúria. 🏴‍☠️";
  if (sins.includes('Mentira')) return "Uma mentirinha branca... já cinza de tanto uso. 🤥";
  if (sins.includes('Inveja')) return "De olho na grama do vizinho (que é sintética). 🦒";
  if (sins.length > 8) return "Um rodízio completo de infrações morais. 🎰";
  if (sins.length > 5) return "A coisa ficou preta por aqui hoje! 🛑";
  return "Mais um dia de batalhas perdidas com estilo. 🚩";
};

const getLiveStatus = (score: number) => {
  if (score === 0) return { label: "Auréola Brilhando ✨", sub: "Totalmente purificado.", color: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/40", glow: "shadow-[0_0_20px_rgba(34,211,238,0.2)]" };
  if (score <= 2) return { label: "Deslize Leve 👍", sub: "Ainda dá pra recuperar.", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30", glow: "" };
  if (score <= 5) return { label: "Clima Tropical ☀️", sub: "A temperatura começou a subir.", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", glow: "" };
  if (score <= 8) return { label: "Calor Intenso 🔥", sub: "O anjo da guarda está tenso.", color: "text-orange-500", bg: "bg-orange-500/20", border: "border-orange-500/40", glow: "shadow-[0_0_20px_rgba(249,115,22,0.2)]" };
  return { label: "Vaga no Térreo 🔱", sub: "Já pode escolher o tridente.", color: "text-red-500", bg: "bg-red-600/20", border: "border-red-600/50", glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]" };
};

export default function App() {
  const today = new Date().toISOString().split('T')[0];
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSins, setSelectedSins] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(today);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedSins, setLastSavedSins] = useState<string[]>([]);

  // ==========================================
  // DASHBOARD 2.0: Lógica de Filtragem e Heatmap
  // ==========================================
  const getFilteredHistory = () => {
    if (timeRange === '7d') {
      const limit = new Date();
      limit.setDate(limit.getDate() - 7);
      return history.filter(log => new Date(log.date) >= limit);
    }
    if (timeRange === '30d') {
      const limit = new Date();
      limit.setDate(limit.getDate() - 30);
      return history.filter(log => new Date(log.date) >= limit);
    }
    if (timeRange === 'custom') {
      return history.filter(log => log.date >= customStartDate && log.date <= customEndDate);
    }
    return history;
  };

  const filteredHistory = getFilteredHistory();

  const InfamyHeatmap = () => {
    const days = 365;
    const historyMap = new Map(history.map(log => [log.date, log.score]));
    const calendarDays = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      const score = historyMap.get(dateStr) || 0;
      return { date: dateStr, score };
    });

    const getColor = (score: number) => {
      if (score === 0) return 'bg-zinc-800/40';
      if (score === 1) return 'bg-orange-950/40 border border-orange-500/10';
      if (score <= 3) return 'bg-orange-800/60 border border-orange-500/20';
      if (score <= 5) return 'bg-orange-600/80 border border-orange-500/30';
      return 'bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)] border border-orange-400/50';
    };

    return (
      <div className="bg-card/30 backdrop-blur-3xl p-4 md:p-6 rounded-[2rem] border border-border/50 mb-10 overflow-hidden relative group">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              Mapa de Calor da Infâmia
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Registro espiritual dos últimos 365 dias</p>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
            <span>Puro</span>
            <div className="flex gap-1 mx-1">
              {[0, 1, 3, 5, 8].map(s => (
                <div key={s} className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm ${getColor(s)}`} />
              ))}
            </div>
            <span>Pecador</span>
          </div>
        </div>
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex flex-wrap gap-1 md:gap-1.5 min-w-[750px] content-start">
            {calendarDays.map((day, i) => (
              <div key={i} className="group relative">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.0005 }}
                  className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-[2px] md:rounded-[3px] transition-all hover:scale-150 hover:z-20 cursor-help ${getColor(day.score)}`}
                />
                
                {/* Tooltip Customizado (CSS Puro) */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-28 p-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 origin-bottom scale-90 group-hover:scale-100">
                  <div className="text-center">
                    <p className="font-black text-[8px] uppercase tracking-tighter text-zinc-400">
                      {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-lg font-black text-orange-500 leading-none my-0.5">{day.score}</p>
                    <p className="text-[7px] uppercase font-bold opacity-50 tracking-widest text-white">Pecados</p>
                  </div>
                  {/* Seta do Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-zinc-900 border-r border-b border-white/10 rotate-45 -mt-[4px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getStatsForRange = (filteredByRange: DailyLog[]) => {
    if (filteredByRange.length === 0) return null;
    const now = new Date();
    const parseDate = (d: string) => new Date(d);

    // Evolução por data (ordenado)
    const sortedHistory = [...filteredByRange].sort((a, b) => a.date.localeCompare(b.date));
    
    // Adicionar Média Móvel (MA7)
    const historyWithMA = sortedHistory.map((log, idx, arr) => {
      const window = arr.slice(Math.max(0, idx - 6), idx + 1);
      const ma = window.reduce((acc, curr) => acc + curr.score, 0) / window.length;
      return { ...log, ma: parseFloat(ma.toFixed(2)) };
    });

    // Análise de Tendência
    const getPeriodAverage = (data: DailyLog[]) => 
      data.length ? data.reduce((acc, curr) => acc + curr.score, 0) / data.length : 0;

    const currentAvg = getPeriodAverage(filteredByRange);
    
    const prevPeriodData = history.filter(log => {
      if (timeRange === 'all') return false;
      const daysDiff = (now.getTime() - parseDate(log.date).getTime()) / (1000 * 3600 * 24);
      const range = timeRange === '7d' ? 7 : 30;
      return daysDiff > range && daysDiff <= range * 2;
    });

    const prevAvg = getPeriodAverage(prevPeriodData);
    const trend = prevAvg > 0 ? ((currentAvg - prevAvg) / prevAvg) * 100 : 0;

    const sinCounts: Record<string, number> = {};
    filteredByRange.forEach(log => {
      log.sins.forEach(sin => {
        sinCounts[sin] = (sinCounts[sin] || 0) + 1;
      });
    });

    const topSins = Object.entries(sinCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- ML Inference Layer ---
    const n = sortedHistory.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    sortedHistory.forEach((log, i) => {
      sumX += i;
      sumY += log.score;
      sumXY += i * log.score;
      sumX2 += i * i;
    });
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
    const intercept = n > 1 ? (sumY - slope * sumX) / n : currentAvg;
    const predictionTomorrow = Math.max(0, slope * n + intercept);

    const evolutionWithTrend = historyWithMA.map((log, i) => ({
      ...log,
      trendline: parseFloat((slope * i + intercept).toFixed(2))
    }));

    const variance = filteredByRange.reduce((acc, curr) => acc + Math.pow(curr.score - currentAvg, 2), 0) / filteredByRange.length;
    const stdDev = Math.sqrt(variance);
    const todayLog = filteredByRange.find(l => l.date === today);
    const zScore = todayLog ? (todayLog.score - currentAvg) / (stdDev || 1) : 0;

    const categories = {
      'Hedonista': ['Glutonaria', 'Pornografia', 'Preguiça', 'Vício do Álcool'],
      'Impulsivo': ['Briguento', 'Inveja', 'Ódio'],
      'Egoico': ['Orgulho/Soberba', 'Avarento', 'Egoísmo', 'Ganância'],
    };

    let dominantCluster = 'Equilibrado';
    let maxCatCount = 0;
    Object.entries(categories).forEach(([cat, items]) => {
      const count = items.reduce((acc, sin) => acc + (sinCounts[sin] || 0), 0);
      if (count > maxCatCount) {
        maxCatCount = count;
        dominantCluster = cat;
      }
    });

    return {
      evolution: evolutionWithTrend,
      topSins,
      averageSins: currentAvg.toFixed(1),
      trend: trend.toFixed(1),
      totalLogs: filteredByRange.length,
      mostCommonSin: topSins[0]?.name || 'Nenhum',
      prediction: predictionTomorrow.toFixed(1),
      zScore: zScore.toFixed(2),
      cluster: dominantCluster
    };
  };

  const stats = getStatsForRange(filteredHistory);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!isDemo) {
        setUser(u);
        setLoading(false);
        if (u) {
          syncUser(u);
          loadTodayLog(u.uid);
          loadHistory(u.uid);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      setLeaderboard(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, []);

  const syncUser = async (u: FirebaseUser) => {
    if (isDemo) return;
    const userRef = doc(db, 'users', u.uid);
    try {
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: u.uid,
          displayName: u.displayName || 'Anônimo',
          photoURL: u.photoURL || '',
          totalScore: 0,
          lastUpdate: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${u.uid}`);
    }
  };

  const loadTodayLog = async (uid: string) => {
    if (isDemo) return;
    const logId = `${uid}_${today}`;
    const logRef = doc(db, 'logs', logId);
    try {
      const logDoc = await getDoc(logRef);
      if (logDoc.exists()) {
        setSelectedSins(logDoc.data().sins || []);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `logs/${logId}`);
    }
  };

  const loadHistory = (uid: string) => {
    if (isDemo) return;
    // Busca logs apenas do usuário logado diretamente no Firestore
    const q = query(
      collection(db, 'logs'), 
      where('userId', '==', uid),
      limit(30)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data() as DailyLog);
      setHistory(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'logs');
    });
    return () => unsubscribe();
  };

  const handleToggleSin = (sin: string) => {
    setSelectedSins(prev => 
      prev.includes(sin) ? prev.filter(s => s !== sin) : [...prev, sin]
    );
  };

  const saveToday = async () => {
    if (!user) return;
    setIsSaving(true);
    let step = "Iniciando...";
    try {
      const logId = `${user.uid}_${today}`;
      const score = selectedSins.length;
      const synthesis = generateSynthesis(selectedSins);

      const log: DailyLog = {
        userId: user.uid,
        date: today,
        sins: selectedSins as string[],
        score: score,
        synthesis: synthesis
      };

      if (!isDemo) {
        step = "Consultando registro anterior...";
        const logRef = doc(db, 'logs', logId);
        const logDoc = await getDoc(logRef);
        const oldScore = logDoc.exists() ? logDoc.data().score : 0;

        step = "Gravando pecados no bando (logs)...";
        await setDoc(logRef, log);

        step = "Atualizando seu placar (users)...";
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentData = userDoc.data();
          const scoreDiff = score - oldScore;
          await setDoc(userRef, {
            ...currentData,
            totalScore: (currentData.totalScore || 0) + scoreDiff,
            lastUpdate: new Date().toISOString()
          }, { merge: true });
        } else {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || 'Anônimo',
            photoURL: user.photoURL || '',
            totalScore: score,
            lastUpdate: new Date().toISOString()
          });
        }
      } else {
        setHistory(prev => [log, ...prev.filter(l => l.date !== today)]);
      }

      toast.success("Pecados registrados com sucesso!");
      setLastSavedSins([...selectedSins]);
      setShowSuccessModal(true);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ea580c', '#f97316', '#fb923c', '#ffffff']
      });

      setSelectedSins([]);
      setTimeout(() => {
        setActiveTab('history');
      }, 1000);

    } catch (error: any) {
      console.error(`Erro no step [${step}]:`, error);
      toast.error(`Falha em [${step}]: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!user) return;
    if (isDemo) {
      setHistory([]);
      toast.success("Alma lavada (em modo demonstração)! ✨");
      setShowResetDialog(false);
      return;
    }
    setIsResetting(true);
    try {
      const q = query(
        collection(db, 'logs'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      setHistory([]);
      toast.success("Sua alma foi lavada! Histórico zerado com sucesso. ✨");
      setShowResetDialog(false);
    } catch (error) {
      toast.error("Erro ao resetar dados. Tente novamente.");
      handleFirestoreError(error, OperationType.DELETE, 'daily_logs');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogin = () => {
    setIsDemo(false);
    signInWithPopup(auth, googleProvider);
  };
  
  const handleLogout = () => {
    setIsDemo(false);
    setUser(null);
    signOut(auth);
  };

  const handleDemoLogin = () => {
    const mockUser = {
      uid: 'demo-user-' + Math.random().toString(36).substr(2, 9),
      displayName: 'Engenheiro do Wlad (Guest)',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wlad'
    } as FirebaseUser;
    
    const mockHistory: DailyLog[] = [];
    const syntheses = [
      "Quase um monge, mas a preguiça falou mais alto.",
      "O dia estava indo bem até o chocolate aparecer.",
      "Orgulho em dia, alma em perigo. Cuidado.",
      "A língua foi mais rápida que o cérebro hoje.",
      "Santidade? Passou longe, mas a intenção foi boa.",
      "Engenharia do Wlad em ação: lógica morreu, mas o código rodou.",
      "Um dia de pura paz interior (ou apenas falta de café).",
      "Pecados leves, consciência pesada.",
      "Hoje o arquétipo mudou para 'Caótico Neutro'.",
      "Equilíbrio precário entre a luz e as notificações do celular."
    ];

    // Gerar 365 dias de histórico fake
    for (let i = 365; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Simular variações: alguns períodos com mais pecados, outros com menos
      const seasonalFactor = Math.sin(i / 10) * 2; // Cria ondas de comportamento
      const baseSins = Math.max(0, Math.floor(Math.random() * 3) + 1 + Math.floor(seasonalFactor));
      
      const shuffledSins = [...SINS].sort(() => 0.5 - Math.random());
      const selectedSinsForDay = shuffledSins.slice(0, baseSins).map(s => s.name);
      
      if (selectedSinsForDay.length > 0) {
        mockHistory.push({
          userId: mockUser.uid,
          date: dateStr,
          sins: selectedSinsForDay,
          score: selectedSinsForDay.length,
          synthesis: syntheses[Math.floor(Math.random() * syntheses.length)]
        });
      }
    }

    setIsDemo(true);
    setUser(mockUser);
    setHistory(mockHistory.reverse()); // Recentes primeiro
    toast.info("Modo Demonstração Turbinado! 1 ano de dados gerados. ✨");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground transition-colors">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Flame className="w-12 h-12 text-orange-600" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-orange-600 selection:text-white font-sans overflow-x-hidden">
        <nav className="fixed top-0 left-0 right-0 h-20 z-50 bg-background/60 backdrop-blur-md border-b border-border/10">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-8 h-8 text-orange-600" />
              <span className="font-black uppercase tracking-tighter text-2xl italic">Pecadômetro</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button 
                onClick={handleLogin}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black px-6 sm:px-8 py-4 sm:py-6 rounded-full shadow-[0_5px_20px_rgba(234,88,12,0.3)] transition-transform hover:scale-105 active:scale-95 text-xs sm:text-base"
              >
                ENTRAR
              </Button>
            </div>
          </div>
        </nav>

        {/* Fundo com Brasas Animadas */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-orange-600/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, -5, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-red-600/10 rounded-full blur-[150px]"
          />
        </div>

        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4"
            >
              <Badge variant="outline" className="border-orange-500/50 text-orange-500 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] bg-orange-500/5">
                INTELIGÊNCIA COMPORTAMENTAL 2.0
              </Badge>
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.8] text-foreground">
                Sua Alma em <br />
                <span className="text-orange-600">Gráficos Reais.</span>
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="max-w-2xl text-lg md:text-xl text-zinc-400 font-medium leading-relaxed"
            >
              Gamifique seus deslizes diários com Machine Learning de ponta e descubra se você está garantindo sua vaga no céu ou apenas reservando o tridente no térreo.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto"
            >
              <Button 
                onClick={handleLogin}
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-black px-12 py-8 text-xl rounded-2xl shadow-[0_10px_40px_rgba(234,88,12,0.4)] transition-all hover:-translate-y-1"
              >
                COMEÇAR MINHA CONFISSÃO
              </Button>
              
              <Button 
                onClick={handleDemoLogin}
                variant="outline"
                className="w-full sm:w-auto border-2 border-orange-600/30 hover:border-orange-600 text-orange-600 font-bold px-10 py-8 text-lg rounded-2xl transition-all hover:bg-orange-600/5 hover:-translate-y-1"
              >
                MODO DEMONSTRAÇÃO
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Como Funciona Section */}
        <section className="py-32 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">O Caminho da Redenção (ou não)</h2>
              <div className="h-1 w-20 bg-orange-600 mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { 
                  icon: <CheckCircle2 className="w-10 h-10" />, 
                  title: "1. Confesse", 
                  desc: "Marque seus 'deslizes' diários nos nossos Hero Cards estilosos. De Glutonaria a Mentira, não escondemos nada.",
                  color: "text-cyan-500"
                },
                { 
                  icon: <Brain className="w-10 h-10" />, 
                  title: "2. Analise", 
                  desc: "Nossa IA processa seus dados usando regressão linear e clustering para definir seu arquétipo espiritual.",
                  color: "text-orange-500"
                },
                { 
                  icon: <Trophy className="w-10 h-10" />, 
                  title: "3. Evolua", 
                  desc: "Acompanhe sua linha do tempo, compare com amigos no Ranking e tente (pelo menos hoje) não pecar.",
                  color: "text-green-500"
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-card p-8 rounded-3xl border border-border hover:border-orange-500/50 transition-all group"
                >
                  <div className={`${step.color} mb-6 transition-transform group-hover:scale-110 duration-300`}>
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção Técnica (Portfolio Highlight) */}
        <section className="py-32 px-6 overflow-hidden relative">
          <div className="max-w-5xl mx-auto bg-orange-600 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-[0_20px_60px_rgba(234,88,12,0.4)]">
             <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Tecnologia de Ponta</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-[0.9]">
                  IA que realmente <br /> entende sua alma.
                </h2>
                <p className="max-w-2xl text-lg text-orange-100 font-medium">
                  Não é apenas um contador. Usamos <span className="underline decoration-white/40 cursor-help" title="Fitted using Ordinary Least Squares (OLS) to identify long-term spiritual trends.">Regressão Linear</span> para prever seu futuro e <span className="underline decoration-white/40 cursor-help" title="Categorical Behavioral Clustering to identify users based on Sin Intensity.">Clustering Comportamental</span> para definir quem você é de verdade.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  {['React 19', 'Firebase', 'Recharts', 'Framer Motion', 'Tailwind 4'].map((tech) => (
                    <span key={tech} className="bg-white/10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                      {tech}
                    </span>
                  ))}
                </div>
             </div>
             {/* Background Decoration */}
             <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
          </div>
        </section>

        {/* Footer Landing */}
        <footer className="py-20 px-6 border-t border-border">
          <div className="max-w-7xl mx-auto flex flex-col items-center space-y-8">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-600" />
              <span className="font-black uppercase tracking-tighter text-xl italic">Pecadômetro</span>
            </div>
            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.3em]">
              Desenvolvido por um dos engenheiros do Wlad
            </p>
            <div className="flex gap-12">
               <button onClick={handleLogin} className="text-xs font-black uppercase tracking-widest hover:text-orange-600 transition-colors">Entrar</button>
               <a href="#" className="text-xs font-black uppercase tracking-widest hover:text-orange-600 transition-colors">Privacidade</a>
               <a href="#" className="text-xs font-black uppercase tracking-widest hover:text-orange-600 transition-colors">Termos</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors font-sans selection:bg-orange-600 selection:text-white relative isolate">
      
      {/* Fundo Abstrato (Brasas) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.5, 1], y: [0, -150, 0], x: [0, 80, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] bg-orange-600/50 rounded-full blur-[100px] dark:bg-orange-500/30"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.7, 0.2], x: [0, -120, 0], scale: [1, 1.4, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] bg-red-600/40 rounded-full blur-[120px] dark:bg-red-600/30"
        />
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 100, 0], scale: [1, 1.6, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] bg-amber-500/40 rounded-full blur-[100px] dark:bg-amber-500/20"
        />
      </div>

      <Toaster position="top-center" />
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-600" />
              <span className="font-black uppercase tracking-tighter text-xl italic hidden sm:inline">Pecadômetro</span>
            </div>

            {/* Status Dinâmico no Header */}
            <AnimatePresence mode="wait">
              {activeTab === 'daily' && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 border-l border-border pl-6"
                >
                  <div className="flex flex-col">
                    <motion.span 
                      key={getLiveStatus(selectedSins.length).label}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${getLiveStatus(selectedSins.length).color}`}
                    >
                      {getLiveStatus(selectedSins.length).label}
                    </motion.span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight mt-0.5">Veredito Atual</span>
                  </div>
                  <div className="bg-secondary px-2 md:px-3 py-1 rounded-lg border border-border flex items-center gap-1 md:gap-1.5">
                    <span className="text-xs md:text-sm font-black text-foreground">{selectedSins.length}</span>
                    <span className="text-[8px] font-black uppercase text-muted-foreground">pts</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden lg:flex items-center gap-2 bg-secondary px-3 py-1 rounded-full border border-border">
              <Avatar className="w-6 h-6">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{user.displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Soul Line: Barra de acento colorida na base do header */}
        <motion.div 
          initial={false}
          animate={{ 
            backgroundColor: activeTab === 'daily' ? getLiveStatus(selectedSins.length).color.replace('text-', '#').replace('cyan-400', '22d3ee').replace('green-400', '4ade80').replace('yellow-400', 'facc15').replace('orange-500', 'f97316').replace('red-500', 'ef4444') : 'transparent',
            opacity: activeTab === 'daily' ? 1 : 0
          }}
          className="absolute bottom-[-1px] left-0 right-0 h-[2px] z-50 transition-colors duration-500 shadow-[0_0_10px_rgba(234,88,12,0.3)]"
        />
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center w-full overflow-x-auto no-scrollbar pb-2">
            <TabsList className="bg-muted border border-border p-1 h-auto flex-wrap sm:flex-nowrap justify-center">
              <TabsTrigger value="daily" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-2 text-[10px] sm:text-sm py-2">
                <CheckCircle2 className="w-4 h-4" /> <span className="hidden xs:inline">Diário</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-2 text-[10px] sm:text-sm py-2">
                <BarChart3 className="w-4 h-4" /> <span className="hidden xs:inline">Estatísticas</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-2 text-[10px] sm:text-sm py-2">
                <Trophy className="w-4 h-4" /> <span className="hidden xs:inline">Ranking</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-2 text-[10px] sm:text-sm py-2">
                <History className="w-4 h-4" /> <span className="hidden xs:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Daily Checklist */}
          <TabsContent value="daily" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between bg-card p-4 md:p-6 rounded-2xl border border-border text-card-foreground shadow-2xl">
                  <div>
                    <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">Diário do Arrependimento</h2>
                    <p className="text-muted-foreground font-mono text-[10px] md:text-xs uppercase tracking-widest mt-1">Sua jornada espiritual diária</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pontuação Hoje</div>
                    <div className="text-2xl md:text-4xl font-black text-orange-600">{selectedSins.length}</div>
                  </div>
                </div>

                {/* Filtro de Categorias */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar sticky top-[64px] z-40 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-border/50">
                  {['Todos', 'Vícios', 'Atitude', 'Relacionamento', 'Religiosidade', 'Moral'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                        selectedCategory === cat 
                          ? 'bg-orange-600 border-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
                          : 'bg-card/40 border-border text-muted-foreground hover:border-orange-500/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {SINS.filter(s => selectedCategory === 'Todos' || s.category === selectedCategory).map((sin, idx) => (
                        <motion.div 
                        key={sin.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col gap-3 min-h-[170px] ${
                          selectedSins.includes(sin.name) 
                            ? 'bg-orange-600/20 border-orange-500 shadow-[0_0_40px_rgba(234,88,12,0.2)]' 
                            : 'bg-card/60 border-border hover:border-orange-500/40 backdrop-blur-md'
                        }`}
                        onClick={() => handleToggleSin(sin.name)}
                      >
                        {/* Indicador de Seleção High-End */}
                        <div className={`absolute top-4 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          selectedSins.includes(sin.name) 
                            ? 'bg-orange-500 border-orange-400 scale-110 shadow-[0_0_20px_rgba(234,88,12,0.6)]' 
                            : 'border-border bg-background/50'
                        }`}>
                          {selectedSins.includes(sin.name) && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>

                        <div>
                          <div className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${
                            selectedSins.includes(sin.name) ? 'text-orange-400' : 'text-zinc-500'
                          }`}>
                            {sin.category}
                          </div>
                          <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1">{sin.name}</h3>
                        </div>

                        <p className={`text-[14px] font-medium leading-snug transition-colors ${
                          selectedSins.includes(sin.name) ? 'text-orange-50' : 'text-zinc-300 dark:text-zinc-100'
                        }`}>
                          {sin.description}
                        </p>

                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="sticky bottom-6 left-0 right-0 z-20">
                  <Button 
                    onClick={saveToday} 
                    disabled={isSaving}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-7 text-lg shadow-[0_10px_30px_rgba(234,88,12,0.3)] uppercase tracking-tighter"
                  >
                    {isSaving ? "Gravando Confissão..." : "Confirmar Pecados de Hoje"}
                  </Button>
                </div>
              </div>


              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card className="bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl text-card-foreground transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Lembrete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    Seja honesto consigo mesmo e com seus amigos. O objetivo é a diversão e a reflexão pessoal. Ninguém é perfeito!
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl text-card-foreground transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg ">Seu Resumo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs uppercase font-bold">Total Acumulado</span>
                      <Badge variant="outline" className="border-orange-600 text-orange-600 font-mono">
                        {leaderboard.find(l => l.uid === user.uid)?.totalScore || 0} pts
                      </Badge>
                    </div>
                    <Separator className="bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs uppercase font-bold">Pecado mais comum</span>
                      <span className="text-muted-foreground text-xs">Em breve...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <Card className="bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl text-card-foreground transition-all">
              <CardHeader className="text-center">
                <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-orange-600">Hall da Fama (ou Infâmia)</CardTitle>
                <CardDescription className="text-muted-foreground">Quem está liderando a lista de pecados do grupo</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="border-border">
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[100px] text-muted-foreground uppercase font-bold text-[10px]">Posição</TableHead>
                      <TableHead className="text-muted-foreground uppercase font-bold text-[10px]">Usuário</TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase font-bold text-[10px]">Pontuação Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((profile, index) => (
                      <TableRow key={profile.uid} className="border-border hover:bg-border/30 transition-colors">
                        <TableCell className="font-mono text-lg">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border border-border">
                              <AvatarImage src={profile.photoURL} />
                              <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold">{profile.displayName}</span>
                            {profile.uid === user.uid && <Badge className="bg-border text-zinc-400 text-[8px] uppercase">Você</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-xl text-orange-600">
                          {profile.totalScore}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard de Estatísticas */}
          <TabsContent value="stats">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase tracking-tight italic leading-none">Radiografia da Alma</h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-70">Auditoria temporal e padrões de comportamento</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50 w-full sm:w-auto">
                  {(['7d', '30d', 'all', 'custom'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        timeRange === range 
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' 
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {range === '7d' ? '7 Dias' : range === '30d' ? '30 Dias' : range === 'all' ? 'Tudo' : 'Personalizado'}
                    </button>
                  ))}
                </div>

                {timeRange === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 bg-card/60 backdrop-blur-xl p-1.5 rounded-2xl border border-orange-500/30 w-full sm:w-auto overflow-hidden"
                  >
                    <input 
                      type="date" 
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-transparent text-[10px] font-black uppercase px-2 outline-none text-foreground"
                    />
                    <div className="w-px h-4 bg-border/50" />
                    <input 
                      type="date" 
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-transparent text-[10px] font-black uppercase px-2 outline-none text-foreground"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            <InfamyHeatmap />

            {filteredHistory.length === 0 ? (
              <div className="text-center py-32 bg-card/20 rounded-[3rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <FlameIcon className="w-8 h-8 text-zinc-600" />
                </div>
                <div>
                   <p className="text-lg font-black uppercase italic tracking-tighter">Caminho da Pureza</p>
                   <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Nenhum registro para este intervalo</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* ML Insights Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="bg-orange-600/10 border-orange-500/20 backdrop-blur-2xl overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Brain className="w-20 h-20 text-orange-600" />
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-widest" title="Modelo de Regressão Linear OLS: Encontra a tendência matemática baseada em todos os seus dias anteriores.">
                          <Zap className="w-3 h-3" /> Vaticínio do Oráculo (ML)
                        </div>
                        <CardTitle className="text-sm font-bold">Bola de Cristal 🔮</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black mb-1">~{stats?.prediction || '0.0'}</div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          Pontos previstos para amanhã.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-card/40 border-border backdrop-blur-2xl overflow-hidden relative group">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest" title="Z-Score: Mede o desvio da sua rotina atual frente à média histórica. Útil para identificar mudanças súbitas de comportamento.">
                          <Target className="w-3 h-3" /> Detector de Sustos (Z-Score)
                        </div>
                        <CardTitle className="text-sm font-bold">Radar de Surpresas 📡</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-black mb-1 ${Math.abs(parseFloat(stats?.zScore || '0')) > 1.5 ? 'text-red-500' : 'text-green-500'}`}>
                          {Math.abs(parseFloat(stats?.zScore || '0')) > 1.5 ? 'Fora da Curva!' : 'Na Normalidade'}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {Math.abs(parseFloat(stats?.zScore || '0')) > 1.5 
                            ? `Você fugiu do padrão em ${stats?.zScore} sigmas!` 
                            : 'Você está sendo consistente hoje.'}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="bg-card/40 border-border backdrop-blur-2xl overflow-hidden relative group">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-purple-500 font-black text-[10px] uppercase tracking-widest" title="Análise Clusterizada: Agrupa as frequências de cada tipo de pecado para inferir um perfil psicológico dominante.">
                          <Brain className="w-3 h-3" /> Arquétipo Dominante (ML)
                        </div>
                        <CardTitle className="text-sm font-bold">Personalidade Pecaminosa 🎭</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-black mb-1 text-purple-500">{stats?.cluster || 'Estudando...'}</div>
                        <p className="text-[10px] text-muted-foreground">
                           Seu cluster principal baseado no histórico.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Original Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-card/40 backdrop-blur-xl border-border">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-orange-600/20 rounded-lg"><Activity className="w-5 h-5 text-orange-600" /></div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Média Diária</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-black">{stats?.averageSins || '0'}</p>
                              {timeRange !== 'all' && stats && (
                                <span className={`text-[10px] font-bold px-1 rounded ${
                                  parseFloat(stats.trend) <= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {parseFloat(stats.trend) >= 0 ? '+' : ''}{stats.trend}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="bg-card/40 backdrop-blur-xl border-border">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-red-600/20 rounded-lg"><TrendingUp className="w-5 h-5 text-red-600" /></div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Mais Comum</p>
                            <p className="text-lg font-black truncate max-w-[120px]">{stats?.mostCommonSin || 'Nenhum'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="bg-card/40 backdrop-blur-xl border-border">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-amber-600/20 rounded-lg"><Calendar className="w-5 h-5 text-amber-600" /></div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Dias Ativos</p>
                            <p className="text-2xl font-black">{stats?.totalLogs || '0'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="bg-card/40 backdrop-blur-xl border-border">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-orange-600/20 rounded-lg"><Award className="w-5 h-5 text-orange-600" /></div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Pontos Totais</p>
                            <p className="text-2xl font-black">{leaderboard.find(l => l.uid === user.uid)?.totalScore || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="bg-card/40 backdrop-blur-2xl border-border p-6 shadow-2xl">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" /> Evolução de Pecados
                      </CardTitle>
                      <CardDescription>Sua performance nas últimas semanas</CardDescription>
                    </CardHeader>
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getStatsForRange(filteredHistory)?.evolution || []}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#888" 
                            fontSize={10} 
                            tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                          />
                          <YAxis stroke="#888" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #444', borderRadius: '8px' }}
                            itemStyle={{ color: '#ea580c' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#ea580c" 
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                            strokeWidth={3}
                            name="Pecados"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="trendline" 
                            stroke="#ef4444" 
                            strokeDasharray="5 5"
                            dot={false}
                            strokeWidth={1}
                            name="Trendline (Linear Regression)"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ma" 
                            stroke="#888" 
                            strokeDasharray="3 3"
                            dot={false}
                            strokeWidth={1}
                            name="Média Móvel (MA7)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="bg-card/40 backdrop-blur-2xl border-border p-6 shadow-2xl">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-600" /> Distribuição de Pecados
                      </CardTitle>
                      <CardDescription>Quais pecados você mais cometeu</CardDescription>
                    </CardHeader>
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getStatsForRange(filteredHistory)?.topSins || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#888" 
                            fontSize={10} 
                            width={100}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #444', borderRadius: '8px' }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {(getStatsForRange(filteredHistory)?.topSins || []).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#ea580c' : '#f97316'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Danger Zone */}
                  <div className="mt-12 space-y-6">
                    <div className="flex items-center gap-2 text-red-600 opacity-80">
                      <AlertTriangle className="w-5 h-5" />
                      <h2 className="text-xl font-black uppercase italic tracking-tighter">Zona de Perigo</h2>
                    </div>
                    
                    <Card className="border-red-600/30 bg-red-600/5 backdrop-blur-xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-red-500">Redenção Total</CardTitle>
                        <CardDescription className="text-zinc-400">
                          Apague todos os seus pecados e estatísticas permanentemente. Esta ação não pode ser desfeita.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="destructive" 
                          className="font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => setShowResetDialog(true)}
                        >
                          Zerar Todo meu Histórico
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Diário da Infâmia</h2>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Linha do tempo dos registros filtrados</p>
              </div>
            </div>

            <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-orange-600 before:via-orange-600/20 before:to-transparent">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 font-bold uppercase tracking-widest text-xs italic bg-card/20 rounded-[2rem] border-2 border-dashed border-border/50">
                  Nenhum pecado neste intervalo. Glória!
                </div>
              ) : (
                filteredHistory.sort((a,b) => b.date.localeCompare(a.date)).map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline Node */}
                    <div className="absolute -left-[37px] top-1 w-6 h-6 rounded-full bg-background border-4 border-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.5)] z-10" />
                    
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="min-w-[120px] pt-1">
                        <div className="text-sm font-black text-orange-600 uppercase tracking-tighter">{log.date}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">{new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'long' })}</div>
                      </div>
                      
                      <Card className="flex-1 bg-card/40 backdrop-blur-xl border-border hover:border-orange-500/50 transition-all p-4">
                        <div className="mb-4">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-sm font-bold flex items-center gap-2 uppercase italic tracking-tight">
                              Atividade Registrada
                            </h3>
                            <Badge className="bg-orange-600 text-white border-none text-[10px]">{log.score} pts</Badge>
                          </div>
                          {log.synthesis && (
                            <p className="text-[11px] font-black uppercase text-orange-500 italic tracking-tighter">
                              "{log.synthesis}"
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {log.sins.map((sin, sIdx) => (
                            <Badge key={sIdx} variant="secondary" className="bg-secondary text-[10px] text-muted-foreground border-none px-2 py-0">
                              {sin}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-50">
            <Flame className="w-4 h-4" />
            <span className="font-black uppercase tracking-tighter text-sm italic">Pecadômetro</span>
          </div>
          <p 
            className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] cursor-help transition-colors hover:text-orange-600"
            title="W.L.A.D: Why? Logic Always Dies. (O mantra de todo debug às 3 da manhã)"
          >
            Desenvolvido por um dos engenheiros do Wlad
          </p>
        </div>
      </footer>

      {/* Modal de Veredito (Sucesso) */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md bg-card/90 backdrop-blur-2xl border-orange-500/20 shadow-[0_0_50px_rgba(234,88,12,0.2)]">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-orange-600/20 flex items-center justify-center mb-2">
              {lastSavedSins.length <= 3 ? <Sparkles className="w-10 h-10 text-orange-500" /> : <Flame className="w-10 h-10 text-orange-600" />}
            </div>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
              {lastSavedSins.length === 0 ? "Quase um Santo! 😇" : 
               lastSavedSins.length <= 3 ? "Sob Controle 👍" :
               lastSavedSins.length <= 7 ? "No Limite ⚠️" : "Pecador Nato! 😈"}
            </DialogTitle>
            <DialogDescription className="text-base font-bold text-orange-600 italic">
              "{generateSynthesis(lastSavedSins)}"
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-3">Resumo da Confissão</div>
              <div className="flex flex-wrap gap-2">
                {lastSavedSins.length === 0 ? (
                  <Badge variant="outline" className="border-orange-500 text-orange-500">Nenhum pecado hoje! 🎉</Badge>
                ) : (
                  lastSavedSins.map((sin, i) => (
                    <Badge key={i} variant="secondary" className="bg-secondary text-xs">{sin}</Badge>
                  ))
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-black text-orange-600">{lastSavedSins.length}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Pontos Adicionados</div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black"
              onClick={() => {
                const synthesis = generateSynthesis(lastSavedSins);
                const text = `Meu Veredito de Hoje:\n"${synthesis}"\n\n🔥 Pontos: ${lastSavedSins.length}\n📜 Lista: ${lastSavedSins.join(', ') || 'Nenhum!'}\n\nE você, como está sua alma hoje?`;
                navigator.clipboard.writeText(text);
                toast.success("Copiado para o clipboard! Mande para o grupo.");
              }}
            >
              <Share2 className="w-4 h-4 mr-2" /> Compartilhar Veredito
            </Button>
            <Button variant="ghost" className="w-full text-zinc-500" onClick={() => setShowSuccessModal(false)}>
              Fechar e Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Reset */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md bg-card/90 backdrop-blur-2xl border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-red-500">
              Tem certeza absoluta?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Esta ação irá apagar permanentemente todos os seus registros de pecado, estatísticas e manchetes. Não há volta após a confirmação.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-col gap-3 mt-6">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black"
              onClick={handleResetData}
              disabled={isResetting}
            >
              {isResetting ? "LAVANDO A ALMA..." : "SIM, QUERO ZERAR TUDO"}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-zinc-500" 
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
            >
              CANCELAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}
