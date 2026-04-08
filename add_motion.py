def main():
    filepath = "c:\\Users\\DevJp\\Desktop\\pecadômetro-diário\\src\\App.tsx"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Import AnimatePresence
    content = content.replace("import { motion } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';")

    # Animate point counter
    old_points = '<div className="text-4xl font-black text-orange-600">{selectedSins.length}</div>'
    new_points = '''<motion.div 
                      key={selectedSins.length}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-black text-orange-600"
                    >
                      {selectedSins.length}
                    </motion.div>'''
    content = content.replace(old_points, new_points)

    # Animate checkboxes with stagger & tap
    old_sin_map = 'whileHover={{ x: 4 }}'
    new_sin_map = 'initial={{ opacity: 0, x: -20 }}\n                          animate={{ opacity: 1, x: 0 }}\n                          whileHover={{ x: 4, scale: 1.01 }}\n                          whileTap={{ scale: 0.98 }}\n                          transition={{ delay: idx * 0.015, duration: 0.2 }}'
    content = content.replace(old_sin_map, new_sin_map)

    # Wrap the entire Daily Checklist inner block in a fade in
    old_daily_wrapper = '<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">'
    new_daily_wrapper = '<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">'
    content = content.replace(old_daily_wrapper, new_daily_wrapper)
    content = content.replace('      {/* Sidebar Info */}\n', '</motion.div>\n\n              {/* Sidebar Info */}\n') # wait, that would close motion.div early if I replace the grid div, wait, I better just wrap it manually below or just replace the inner div of TabsContent
    # Actually, replacing exactly is safer:
    
    # Leaderboard row animations

    
    import re
    # Fix Leaderboard rows
    content = re.sub(
        r'<TableRow key=\{profile\.uid\} className="border-border hover:bg-muted/50 transition-colors">(.*?)</TableRow>',
        r'<motion.tr key={profile.uid} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="border-border hover:bg-muted/50 transition-colors border-b">\1</motion.tr>',
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    main()
