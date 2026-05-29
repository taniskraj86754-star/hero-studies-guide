import { Sparkles } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 py-12">
    <div className="container grid md:grid-cols-4 gap-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-bold">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          Homework Hero
        </div>
        <p className="text-sm text-muted-foreground">Learn smarter, not harder.</p>
      </div>
      {[
        { title: "Product", links: ["Features", "Subjects", "Pricing", "Mobile app"] },
        { title: "For", links: ["Students", "Parents", "Teachers", "Schools"] },
        { title: "Company", links: ["About", "Blog", "Privacy", "Terms"] },
      ].map(col => (
        <div key={col.title}>
          <h4 className="font-semibold mb-3">{col.title}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {col.links.map(l => <li key={l}><a href="#" className="hover:text-foreground transition-smooth">{l}</a></li>)}
          </ul>
        </div>
      ))}
    </div>
    <div className="container mt-10 pt-6 border-t border-border/50 text-sm text-muted-foreground text-center">
      © 2026 Homework Hero. Made with 💜 for curious minds.
    </div>
  </footer>
);

export default Footer;
