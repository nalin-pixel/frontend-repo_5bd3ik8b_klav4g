import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Home, Image as ImageIcon, Library, Settings, CreditCard, LogOut, Moon, Sun, Sparkles } from 'lucide-react'
import Spline from '@splinetool/react-spline'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  return { theme, setTheme }
}

function Container({ children }) {
  return <div className="min-h-screen bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">{children}</div>
}

function Topbar({ user, credits, onLogout, themeCtl }) {
  return (
    <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-20 backdrop-blur bg-white/70 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 font-semibold">
        <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-500 to-purple-500" />
        <span>ClipGen Studio</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500"/> {credits} credits</div>
        <button onClick={() => themeCtl.setTheme(themeCtl.theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle theme">
          {themeCtl.theme === 'dark' ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
        </button>
        {user && (
          <button onClick={onLogout} className="px-3 py-1 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">Logout</button>
        )}
      </div>
    </div>
  )
}

function Sidebar() {
  const nav = [
    { to: '/', label: 'Generate', icon: ImageIcon },
    { to: '/library', label: 'My Library', icon: Library },
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]
  return (
    <div className="w-60 border-r border-slate-200 dark:border-slate-800 p-4 hidden md:block">
      <div className="text-xs uppercase text-slate-500 mb-2">Dashboard</div>
      <nav className="grid gap-1">
        {nav.map(n => (
          <Link key={n.to} to={n.to} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <n.icon className="w-4 h-4"/> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

function AuthGate({ children, setUser }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    try {
      const res = await fetch(`${API}/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Auth error')
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <Spline scene="https://prod.spline.design/qQUip0dJPqrrPryE/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/30 to-transparent dark:from-slate-950/40"/>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold mb-2">Welcome to ClipGen Studio</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Generate cute 3D clipart with AI prompts.</p>
          <div className="grid gap-3">
            {mode === 'signup' && (
              <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="px-3 py-2 rounded border bg-transparent"/>
            )}
            <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="px-3 py-2 rounded border bg-transparent"/>
            <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="px-3 py-2 rounded border bg-transparent"/>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button onClick={submit} className="bg-gradient-to-r from-blue-600 to-violet-600 text-white py-2 rounded">{mode==='login'?'Login':'Create account'}</button>
            <button onClick={()=>setMode(mode==='login'?'signup':'login')} className="text-sm text-blue-600">{mode==='login'?"No account? Sign up":"Have an account? Login"}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Layout({ user, setUser, credits, setCredits, children }) {
  const themeCtl = useTheme()
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <Container>
      <Topbar user={user} credits={credits} onLogout={logout} themeCtl={themeCtl} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </Container>
  )
}

function Generate({ user, credits, setCredits }) {
  const [prompt, setPrompt] = useState('a cute 3D pastel cat with big eyes')
  const [img, setImg] = useState(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function doGen() {
    if (credits <= 0) { nav('/billing'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-token': localStorage.getItem('token') }, body: JSON.stringify({ prompt }) })
      if (!res.ok) throw new Error((await res.json()).detail)
      const data = await res.json()
      setImg(data.url)
      const c = await fetch(`${API}/credits`, { headers: { 'x-token': localStorage.getItem('token') } })
      const cj = await c.json(); setCredits(cj.credits)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function save() {
    const body = { user_id: user.id, prompt, url: img, format: 'jpg', width: 768, height: 768 }
    const res = await fetch(`${API}/library/save`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-token': localStorage.getItem('token') }, body: JSON.stringify(body) })
    if (res.ok) alert('Saved to library')
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr,400px]">
      <div>
        <div className="flex gap-2"><input value={prompt} onChange={e=>setPrompt(e.target.value)} className="w-full px-3 py-2 rounded border bg-transparent" placeholder="Describe your clipart..."/><button onClick={doGen} disabled={loading||credits<=0} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{loading? 'Generating...':'Generate Clipart'}</button></div>
        {img && (
          <div className="mt-4 p-4 border rounded">
            <img src={img} alt="generated" className="w-full rounded"/>
            <div className="flex gap-2 mt-3">
              <button onClick={save} className="px-3 py-2 rounded bg-slate-900 text-white">Save to Library</button>
              <a href={img} download className="px-3 py-2 rounded border">Download JPG</a>
              <button onClick={doGen} className="px-3 py-2 rounded border">Regenerate</button>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="p-4 rounded border">
          <div className="font-medium mb-2">Quick create</div>
          <div className="flex flex-wrap gap-2">
            {['kawaii robot','smiling donut','pastel space whale','tiny camera with face'].map(p=> (
              <button key={p} onClick={()=>setPrompt(p)} className="px-3 py-1 rounded-full border text-sm">{p}</button>
            ))}
          </div>
        </div>
        <div className="p-4 rounded border">
          <div className="font-medium">Credits</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Each generation costs 1 credit.</div>
        </div>
      </div>
    </div>
  )
}

function LibraryPage() {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(null)
  async function load() {
    const res = await fetch(`${API}/library`, { headers: { 'x-token': localStorage.getItem('token') } })
    const data = await res.json(); setItems(data)
  }
  useEffect(()=>{ load() },[])
  async function del(id){
    if (!confirm('Delete this item?')) return
    await fetch(`${API}/library/${id}`, { method:'DELETE', headers:{ 'x-token': localStorage.getItem('token') } })
    setItems(items.filter(i=>i.id!==id)); setOpen(null)
  }
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(it=> (
          <button key={it.id} onClick={()=>setOpen(it)} className="block border rounded overflow-hidden">
            <img src={it.url} alt="" className="w-full aspect-square object-cover"/>
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4" onClick={()=>setOpen(null)}>
          <div className="bg-white dark:bg-slate-900 p-4 rounded max-w-2xl w-full" onClick={e=>e.stopPropagation()}>
            <img src={open.url} alt="" className="w-full rounded"/>
            <div className="flex gap-2 mt-3 justify-between">
              <a href={open.url} download className="px-3 py-2 rounded bg-slate-900 text-white">Download</a>
              <button onClick={()=>del(open.id)} className="px-3 py-2 rounded border">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BillingPage({ setCredits }) {
  async function buy(tier){
    const res = await fetch(`${API}/billing/checkout`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-token': localStorage.getItem('token') }, body: JSON.stringify({ tier }) })
    if (res.ok) {
      const cr = await fetch(`${API}/credits`, { headers: { 'x-token': localStorage.getItem('token') } })
      const cj = await cr.json(); setCredits(cj.credits)
      alert('Purchase successful. Credits added!')
    }
  }
  const tiers = [
    { id:'starter', name:'Starter', credits:50, price:'€5' },
    { id:'creator', name:'Creator', credits:150, price:'€10' },
    { id:'pro', name:'Pro', credits:500, price:'€25' },
  ]
  const [history, setHistory] = useState([])
  useEffect(()=>{ (async()=>{ const r=await fetch(`${API}/billing/history`, { headers:{ 'x-token': localStorage.getItem('token') }}); setHistory(await r.json()) })() },[])
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 grid sm:grid-cols-3 gap-3">
        {tiers.map(t => (
          <div key={t.id} className="p-4 border rounded">
            <div className="text-lg font-medium">{t.name}</div>
            <div className="text-sm text-slate-600">{t.credits} credits</div>
            <div className="text-2xl font-semibold my-2">{t.price}</div>
            <button onClick={()=>buy(t.id)} className="w-full py-2 rounded bg-blue-600 text-white">Buy</button>
          </div>
        ))}
      </div>
      <div className="p-4 border rounded">
        <div className="font-medium mb-2">Purchase history</div>
        <div className="space-y-2">
          {history.map(h=> (
            <div key={h.id} className="flex items-center justify-between text-sm"><span className="capitalize">{h.tier}</span><span>+{h.credits_added} credits</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsPage({ setUser }) {
  const [email, setEmail] = useState('')
  const [oldp, setOldp] = useState('')
  const [newp, setNewp] = useState('')
  useEffect(()=>{ const u = JSON.parse(localStorage.getItem('user')||'null'); if (u) setEmail(u.email) },[])
  async function changeEmail(){ const r=await fetch(`${API}/settings/email`,{method:'POST',headers:{'Content-Type':'application/json','x-token':localStorage.getItem('token')},body:JSON.stringify({email})}); if(r.ok){ const u=await r.json(); localStorage.setItem('user',JSON.stringify(u)); setUser(u); alert('Email updated')} }
  async function changePass(){ const r=await fetch(`${API}/settings/password`,{method:'POST',headers:{'Content-Type':'application/json','x-token':localStorage.getItem('token')},body:JSON.stringify({old_password:oldp,new_password:newp})}); if(r.ok){ setOldp(''); setNewp(''); alert('Password changed') } }
  async function del(){ if(!confirm('Delete account? This cannot be undone.')) return; const r=await fetch(`${API}/settings/delete-account`,{method:'DELETE',headers:{'x-token':localStorage.getItem('token')}}); if(r.ok){ localStorage.clear(); location.href='/' } }
  return (
    <div className="grid gap-4 max-w-xl">
      <div className="p-4 border rounded grid gap-2">
        <div className="font-medium">Change email</div>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="px-3 py-2 rounded border bg-transparent"/>
        <button onClick={changeEmail} className="px-3 py-2 rounded bg-slate-900 text-white">Update email</button>
      </div>
      <div className="p-4 border rounded grid gap-2">
        <div className="font-medium">Change password</div>
        <input placeholder="Old password" type="password" value={oldp} onChange={e=>setOldp(e.target.value)} className="px-3 py-2 rounded border bg-transparent"/>
        <input placeholder="New password" type="password" value={newp} onChange={e=>setNewp(e.target.value)} className="px-3 py-2 rounded border bg-transparent"/>
        <button onClick={changePass} className="px-3 py-2 rounded bg-slate-900 text-white">Update password</button>
      </div>
      <div className="p-4 border rounded">
        <div className="font-medium mb-2">Danger zone</div>
        <button onClick={del} className="px-3 py-2 rounded border border-red-600 text-red-600">Delete account</button>
      </div>
    </div>
  )
}

function Dashboard({ user, credits }) {
  const navigate = useNavigate()
  const [recent, setRecent] = useState([])
  useEffect(()=>{ (async()=>{ const r=await fetch(`${API}/library`, { headers:{ 'x-token': localStorage.getItem('token') }}); const j=await r.json(); setRecent(j.slice(0,6)) })() },[])
  return (
    <div className="grid lg:grid-cols-[1fr,320px] gap-4">
      <div>
        <div className="text-xl font-medium mb-3">Welcome back{user?.name?`, ${user.name}`:''}!</div>
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded border"><div className="text-sm text-slate-500">Credits left</div><div className="text-2xl font-semibold">{credits}</div></div>
          <div className="p-4 rounded border"><div className="text-sm text-slate-500">Recent creations</div><div className="text-2xl font-semibold">{recent.length}</div></div>
          <div className="p-4 rounded border"><div className="text-sm text-slate-500">Plan</div><div className="text-2xl font-semibold">Flexible</div></div>
        </div>
        <div className="mb-3 font-medium">Recent</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {recent.map(r=> (<img key={r.id} src={r.url} className="w-full aspect-square object-cover rounded"/>))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="p-4 rounded border">
          <div className="font-medium mb-2">Quick create</div>
          <button onClick={()=>navigate('/')} className="w-full py-2 rounded bg-blue-600 text-white">Generate</button>
        </div>
        <div className="p-4 rounded border">
          <div className="font-medium mb-2">Shortcuts</div>
          <div className="grid gap-2">
            <button onClick={()=>navigate('/library')} className="px-3 py-2 rounded border text-left">Open Library</button>
            <button onClick={()=>navigate('/billing')} className="px-3 py-2 rounded border text-left">Buy credits</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppShell() {
  const [user, setUser] = useState(()=>{ const u = localStorage.getItem('user'); return u? JSON.parse(u): null })
  const [credits, setCredits] = useState(0)

  useEffect(()=>{
    (async()=>{
      if (!user) return
      const r = await fetch(`${API}/credits`, { headers: { 'x-token': localStorage.getItem('token') }})
      if (r.ok) { const j=await r.json(); setCredits(j.credits) }
    })()
  }, [user])

  if (!user) return <AuthGate setUser={setUser} />

  return (
    <Layout user={user} setUser={setUser} credits={credits} setCredits={setCredits}>
      <Routes>
        <Route path="/" element={<Generate user={user} credits={credits} setCredits={setCredits} />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/billing" element={<BillingPage setCredits={setCredits} />} />
        <Route path="/settings" element={<SettingsPage setUser={setUser} />} />
        <Route path="*" element={<Dashboard user={user} credits={credits} />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
