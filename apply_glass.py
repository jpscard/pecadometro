def main():
    filepath = "c:\\Users\\DevJp\\Desktop\\pecadômetro-diário\\src\\App.tsx"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Glassmorphism on the big header of the list
    content = content.replace(
        'className="flex items-center justify-between bg-card p-6 rounded-2xl border border-border text-card-foreground shadow-2xl transition-colors"',
        'className="flex items-center justify-between bg-card/40 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 dark:border-white/5 text-card-foreground shadow-2xl transition-all"'
    )

    # Glassmorphism on the list card
    content = content.replace(
        'className="bg-card border-border shadow-2xl overflow-hidden transition-colors"',
        'className="bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl overflow-hidden transition-all"'
    )

    # Glassmorphism on sidebar lembrete & resumo
    content = content.replace(
        'className="bg-card border-border shadow-2xl text-card-foreground"',
        'className="bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl text-card-foreground transition-all"'
    )
    content = content.replace(
        'className="bg-card border-border shadow-2xl"',
        'className="bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl transition-all"'
    )

    # Glassmorphism on Leaderboard table card
    content = content.replace(
        '<Card className="bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl transition-all">',
        '<Card className="bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl transition-all">' # ensure we target Leaderboard too if previous hit it
    )

    # Glassmorphism on History cards
    content = content.replace(
        'className="bg-card border-border text-card-foreground hover:border-orange-900/50 transition-all"',
        'className="bg-card/40 backdrop-blur-xl border-white/10 dark:border-white/5 text-card-foreground hover:border-orange-500/50 hover:bg-card/60 transition-all"'
    )

    # To make the glass really pop, add a cool subtle background gradient to the entire app body
    content = content.replace(
        'className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-600 selection:text-white transition-colors duration-300"',
        'className="min-h-screen bg-gradient-to-br from-background via-background/95 to-orange-900/10 text-foreground font-sans selection:bg-primary selection:text-primary-foreground transition-colors duration-500 relative"'
    )
    
    # We already have some blobs for the login screen, let's make sure they are visible on the main screen too but very subtle
    # Wait, the main screen doesn't have the blobs. Let's not inject hard XML changes without AST, just stick to replacing classes.

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    main()
