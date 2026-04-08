

def main():
    filepath = "c:\\Users\\DevJp\\Desktop\\pecadômetro-diário\\src\\App.tsx"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Imports
    content = content.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\nimport { ThemeToggle } from './components/theme-toggle';")

    # Loading Background
    content = content.replace('bg-[#0a0a0a] text-white', 'bg-background text-foreground transition-colors')

    # Toaster globally
    content = content.replace('<Toaster theme="dark" position="top-center" />', '<Toaster position="top-center" />')

    # Not Logged In
    content = content.replace('bg-[#0a0a0a] p-4 text-white', 'bg-background p-4 text-foreground transition-colors')
    content = content.replace('text-zinc-400 font-mono', 'text-muted-foreground font-mono')
    content = content.replace('bg-zinc-900/50 border-zinc-800', 'bg-card/80 border-border')
    content = content.replace('text-white">Bem-vindo', 'text-card-foreground">Bem-vindo')

    # Logged In Layout
    content = content.replace('bg-[#0a0a0a] text-zinc-100', 'bg-background text-foreground transition-colors')
    content = content.replace('border-zinc-800 bg-zinc-900/50', 'border-border bg-card/80')
    content = content.replace('bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700', 'bg-secondary px-3 py-1 rounded-full border border-border')
    content = content.replace('text-zinc-400 hover:text-white', 'text-muted-foreground hover:text-foreground')

    # Add Theme Toggle to Header
    content = content.replace('<div className="hidden md:flex', '<ThemeToggle />\n            <div className="hidden md:flex')
    
    # Tabs List
    content = content.replace('bg-zinc-900 border border-zinc-800', 'bg-muted border border-border')

    # Daily Checklist Card
    content = content.replace('bg-zinc-900 p-6 rounded-2xl border border-zinc-800', 'bg-card p-6 rounded-2xl border border-border text-card-foreground')
    content = content.replace('text-zinc-500 font-mono text-xs', 'text-muted-foreground font-mono text-xs')
    content = content.replace('text-[10px] uppercase font-bold tracking-widest text-zinc-500', 'text-[10px] uppercase font-bold tracking-widest text-muted-foreground')
    content = content.replace('bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden', 'bg-card border-border shadow-2xl overflow-hidden')
    content = content.replace('bg-zinc-900/80 border-t border-zinc-800', 'bg-card/80 border-t border-border')

    # Checkbox logic
    old_checkbox = """selectedSins.includes(sin) 
                              ? 'bg-orange-900/20 border-orange-800/50 text-orange-200' 
                              : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600'"""
    new_checkbox = """selectedSins.includes(sin) 
                              ? 'bg-orange-600 border-orange-600 text-white shadow-md' 
                              : 'bg-secondary/40 border-border hover:border-orange-500/50 text-foreground'"""
    content = content.replace(old_checkbox, new_checkbox)
    content = content.replace('border-zinc-600 data-[state=checked]', 'border-primary data-[state=checked]')

    # Sidebar Lembrete
    content = content.replace('bg-zinc-900 border-zinc-800 shadow-2xl', 'bg-card border-border shadow-2xl text-card-foreground')
    content = content.replace('text-white">Lembrete', '">Lembrete')
    content = content.replace('text-white">Seu Resumo', '">Seu Resumo')
    content = content.replace('text-zinc-400 leading-relaxed', 'text-muted-foreground leading-relaxed')

    # Sidebar Resumo
    content = content.replace('text-zinc-500 text-xs uppercase font-bold', 'text-muted-foreground text-xs uppercase font-bold')
    content = content.replace('bg-zinc-800', 'bg-border') # for separators
    content = content.replace('text-zinc-300', 'text-muted-foreground')

    # Leaderboard
    content = content.replace('text-zinc-500">Quem', 'text-muted-foreground">Quem')
    content = content.replace('border-zinc-800', 'border-border')
    content = content.replace('hover:bg-zinc-800/30', 'hover:bg-muted/50')
    content = content.replace('text-zinc-500 uppercase font-bold', 'text-muted-foreground uppercase font-bold')
    content = content.replace('border-zinc-700', 'border-border')
    content = content.replace('bg-zinc-800 text-zinc-400', 'bg-secondary text-secondary-foreground')

    # History
    content = content.replace('text-zinc-500">Nenhum', 'text-muted-foreground">Nenhum')
    content = content.replace('bg-zinc-900 border-zinc-800', 'bg-card border-border text-card-foreground')
    content = content.replace('text-zinc-500">{log.date}', 'text-muted-foreground">{log.date}')
    content = content.replace('bg-zinc-800 text-[9px] text-zinc-400', 'bg-secondary text-[9px] text-secondary-foreground')
    content = content.replace('text-zinc-600 font-bold', 'text-muted-foreground font-bold')

    # Footer
    content = content.replace('text-zinc-600 text-[10px]', 'text-muted-foreground text-[10px]')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    main()
