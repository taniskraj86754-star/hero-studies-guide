const groups = [
  {
    title: "Primary (Classes 1–5)",
    items: [
      { name: "English", emoji: "📚" },
      { name: "Hindi", emoji: "📖" },
      { name: "Mathematics", emoji: "🧮" },
      { name: "Environmental Studies (EVS)", emoji: "🌱" },
      { name: "General Knowledge", emoji: "🌍" },
      { name: "Computer Basics", emoji: "💻" },
      { name: "Art & Craft", emoji: "🎨" },
      { name: "Moral Science / Value Education", emoji: "🕊️" },
    ],
  },
  {
    title: "Middle (Classes 6–8)",
    items: [
      { name: "English", emoji: "📚" },
      { name: "Hindi", emoji: "📖" },
      { name: "Sanskrit", emoji: "🕉️" },
      { name: "Mathematics", emoji: "🧮" },
      { name: "Science", emoji: "🔬" },
      { name: "Social Science (History, Geography, Civics)", emoji: "🏛️" },
      { name: "Computer Science", emoji: "💻" },
      { name: "AI (417) – Intro", emoji: "🤖" },
      { name: "Health & Physical Education", emoji: "🏃" },
    ],
  },
  {
    title: "Secondary (Classes 9–10)",
    items: [
      { name: "English (Language & Literature)", emoji: "📚" },
      { name: "Hindi A / Hindi B", emoji: "📖" },
      { name: "Sanskrit", emoji: "🕉️" },
      { name: "Mathematics (Standard / Basic)", emoji: "🧮" },
      { name: "Science (Physics, Chemistry, Biology)", emoji: "🧪" },
      { name: "Social Science", emoji: "🏛️" },
      { name: "Information Technology (402)", emoji: "🌐" },
      { name: "Artificial Intelligence (417)", emoji: "🤖" },
      { name: "Other Languages (Urdu, Punjabi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, Assamese, French, German, Spanish)", emoji: "🗣️" },
    ],
  },
  {
    title: "Senior Secondary (Classes 11–12) — Science",
    items: [
      { name: "Physics", emoji: "⚛️" },
      { name: "Chemistry", emoji: "🧪" },
      { name: "Biology", emoji: "🧬" },
      { name: "Mathematics", emoji: "🧮" },
      { name: "Computer Science (083)", emoji: "🖥️" },
      { name: "Informatics Practices (065)", emoji: "📊" },
      { name: "Biotechnology", emoji: "🧫" },
      { name: "Engineering Graphics", emoji: "📐" },
      { name: "Physical Education", emoji: "🏃" },
    ],
  },
  {
    title: "Senior Secondary (Classes 11–12) — Commerce",
    items: [
      { name: "Accountancy", emoji: "📒" },
      { name: "Business Studies", emoji: "💼" },
      { name: "Economics", emoji: "📈" },
      { name: "Mathematics / Applied Mathematics", emoji: "🧮" },
      { name: "Entrepreneurship", emoji: "🚀" },
      { name: "Legal Studies", emoji: "⚖️" },
    ],
  },
  {
    title: "Senior Secondary (Classes 11–12) — Humanities",
    items: [
      { name: "History", emoji: "🏺" },
      { name: "Geography", emoji: "🗺️" },
      { name: "Political Science", emoji: "🏛️" },
      { name: "Sociology", emoji: "👥" },
      { name: "Psychology", emoji: "🧠" },
      { name: "Philosophy", emoji: "💭" },
      { name: "Fine Arts", emoji: "🎨" },
      { name: "Home Science", emoji: "🏠" },
    ],
  },
  {
    title: "Languages & Skill Subjects",
    items: [
      { name: "English Core / Elective", emoji: "📚" },
      { name: "Hindi Core / Elective", emoji: "📖" },
      { name: "Sanskrit", emoji: "🕉️" },
      { name: "Urdu, Punjabi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, Assamese", emoji: "🗣️" },
      { name: "French / German / Spanish / Japanese", emoji: "🌐" },
      { name: "Artificial Intelligence (417/843)", emoji: "🤖" },
      { name: "Web Application (803)", emoji: "🌐" },
      { name: "Data Science (844)", emoji: "📊" },
      { name: "Financial Markets Management", emoji: "💹" },
    ],
  },
];

const palette = [
  "from-violet-500/20 to-indigo-500/20",
  "from-fuchsia-500/20 to-purple-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-lime-500/20 to-green-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-sky-500/20 to-blue-500/20",
  "from-rose-500/20 to-pink-500/20",
  "from-cyan-500/20 to-blue-500/20",
  "from-yellow-500/20 to-amber-500/20",
];

const Subjects = () => (
  <section id="subjects" className="py-20 gradient-soft">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Every CBSE subject. <span className="text-gradient">Classes 1–12.</span>
        </h2>
        <p className="text-lg text-muted-foreground">
          Full CBSE curriculum coverage from Primary to Senior Secondary — Science, Commerce, Humanities,
          languages from across India, and skill subjects like AI, IT &amp; Data Science.
        </p>
      </div>

      <div className="space-y-12">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="text-xl md:text-2xl font-bold mb-5">{g.title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {g.items.map((s, i) => (
                <div
                  key={s.name}
                  className={`bg-gradient-to-br ${palette[i % palette.length]} backdrop-blur rounded-3xl p-6 border border-border/50 text-center hover:scale-105 hover:shadow-card transition-bounce cursor-pointer animate-fade-up`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="text-5xl mb-3">{s.emoji}</div>
                  <p className="font-semibold text-sm">{s.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Subjects;
