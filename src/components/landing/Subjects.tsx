const subjects = [
  { name: "Math", emoji: "🧮", color: "from-violet-500/20 to-indigo-500/20" },
  { name: "Science", emoji: "🔬", color: "from-emerald-500/20 to-teal-500/20" },
  { name: "English", emoji: "📚", color: "from-rose-500/20 to-pink-500/20" },
  { name: "History", emoji: "🏛️", color: "from-amber-500/20 to-orange-500/20" },
  { name: "Computer Science", emoji: "💻", color: "from-sky-500/20 to-blue-500/20" },
  { name: "Physics", emoji: "⚛️", color: "from-fuchsia-500/20 to-purple-500/20" },
  { name: "Biology", emoji: "🧬", color: "from-lime-500/20 to-green-500/20" },
  { name: "Languages", emoji: "🌍", color: "from-cyan-500/20 to-blue-500/20" },
];

const Subjects = () => (
  <section id="subjects" className="py-20 gradient-soft">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Every subject. <span className="text-gradient">Every level.</span></h2>
        <p className="text-lg text-muted-foreground">From algebra basics to organic chemistry — Homework Hero has you covered.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {subjects.map((s, i) => (
          <div
            key={s.name}
            className={`bg-gradient-to-br ${s.color} backdrop-blur rounded-3xl p-6 border border-border/50 text-center hover:scale-105 hover:shadow-card transition-bounce cursor-pointer animate-fade-up`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="text-5xl mb-3">{s.emoji}</div>
            <p className="font-semibold">{s.name}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Subjects;
