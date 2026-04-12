import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Leaf, Heart } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.zenspace.dailytools";

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.2 }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden selection:bg-secondary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-serif text-primary flex items-center gap-2">
            <Leaf className="w-6 h-6 text-secondary" />
            ZenSpace
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button onClick={() => scrollTo("features")} className="hover:text-secondary transition-colors cursor-pointer">Tools</button>
            <button onClick={() => scrollTo("ai")} className="hover:text-secondary transition-colors cursor-pointer">AI Guide</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-secondary transition-colors cursor-pointer">Plans</button>
            <Button onClick={() => scrollTo("pricing")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
              Get the App
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8 relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              Now available on Android
            </div>
            <h1 className="text-5xl md:text-7xl font-serif leading-[1.1] text-primary">
              Clarity in a <br/><span className="text-secondary italic">chaotic</span> world.
            </h1>
            <p className="text-lg md:text-xl text-primary/80 max-w-md leading-relaxed">
              Step off the busy street into your personal sanctuary. 30+ daily tools and a supportive AI guide, all in one beautifully calm app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-lg h-14 px-8 group">
                <PlayCircle className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Download on Google Play
              </Button>
              <p className="text-xs text-primary/60 text-center sm:text-left self-center">
                com.zenspace.dailytools • Free trial available
              </p>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-secondary/20 blur-[100px] rounded-full" />
            <img 
              src="/hero-mockup.png" 
              alt="ZenSpace App Interface" 
              className="w-full h-auto max-w-md mx-auto relative z-10 rounded-3xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Intro Text */}
      <section className="py-24 px-6 bg-primary text-primary-foreground text-center">
        <motion.div {...fadeIn} className="max-w-3xl mx-auto space-y-6">
          <Leaf className="w-10 h-10 mx-auto text-secondary mb-8 opacity-80" />
          <h2 className="text-3xl md:text-5xl font-serif leading-tight">
            Not just another productivity tracker. <br/> Something that feels sacred.
          </h2>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            We built ZenSpace for everyday Indians. Whether you need a chant counter for your morning puja, an expense tracker, or just someone to listen without judgment. It speaks your language.
          </p>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeIn} className="mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4">30+ tools. Zero clutter.</h2>
            <p className="text-lg text-primary/70">Everything you need for a mindful day, thoughtfully organized.</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: "🤖", title: "AI Friend", desc: "Chat & voice Talk Mode with your AI companion", featured: true },
              { icon: "🙏", title: "Chant Counter", desc: "Mala & Rosary counter with haptic feedback", featured: true },
              { icon: "🔥", title: "Habit Builder", desc: "Small steps, no streak guilt", featured: true },
              { icon: "🎵", title: "Music Player", desc: "Calm background music while you work", featured: true },
              { icon: "📝", title: "Notes", desc: "Quick jot-down notes, always at hand", featured: true },
              { icon: "💰", title: "Expense Tracker", desc: "Simple, stress-free money tracking", featured: true },
              { icon: "🧮", title: "Calculator", desc: "Clean everyday calculator" },
              { icon: "🔄", title: "Unit Converter", desc: "Convert length, weight, temp & more" },
              { icon: "⏱️", title: "Timer", desc: "Countdown & stopwatch for focus sessions" },
              { icon: "⚖️", title: "BMI Checker", desc: "Know your Body Mass Index instantly" },
              { icon: "🎂", title: "Age Calculator", desc: "Find your exact age in seconds" },
              { icon: "💡", title: "Tip Calculator", desc: "Split bills without the mental load" },
              { icon: "🔐", title: "Password Gen", desc: "Strong, random passwords on demand" },
              { icon: "🔔", title: "Reminders", desc: "Gentle nudges to keep you on track" },
              { icon: "🎙️", title: "Voice Recorder", desc: "Record thoughts, ideas, meetings" },
              { icon: "🎬", title: "Video Recorder", desc: "Quick video capture from within the app" },
              { icon: "🧒", title: "Kids Zone", desc: "Safe, fun space for little ones" },
              { icon: "🌬️", title: "Breathing Guide", desc: "Box breathing & relaxation visuals" },
              { icon: "🔦", title: "Flashlight", desc: "Instant torch at your fingertips" },
              { icon: "🌍", title: "World Clock", desc: "Track time across any timezone" },
              { icon: "📷", title: "QR Code", desc: "Scan & generate QR codes easily" },
              { icon: "😊", title: "Mood Tracker", desc: "Daily check-ins without judgment" },
              { icon: "🌙", title: "Sleep Log", desc: "Track your rest for better mornings" },
            ].map((tool, i) => (
              <motion.div key={i} variants={staggerItem}>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`tool-card-${i}`}
                  className="block group"
                >
                  <Card className={`border hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full cursor-pointer ${tool.featured ? "bg-secondary/8 border-secondary/40 hover:border-secondary" : "bg-card/50 border-border/30 hover:border-secondary/40"}`}>
                    <CardContent className="p-5 space-y-2">
                      <div className="text-3xl mb-3">{tool.icon}</div>
                      <h3 className={`text-base font-semibold transition-colors group-hover:text-secondary ${tool.featured ? "text-primary" : "text-primary"}`}>{tool.title}</h3>
                      <p className="text-xs text-primary/60 leading-relaxed">{tool.desc}</p>
                      {tool.featured && <span className="inline-block text-[10px] font-medium text-secondary/80 bg-secondary/10 px-2 py-0.5 rounded-full">Featured</span>}
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            ))}
          </motion.div>
          <motion.div {...fadeIn} className="mt-10 text-center">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-13">
                <PlayCircle className="mr-2 w-5 h-5" /> Download Free on Google Play
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section id="ai" className="py-24 px-6 relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary rounded-full blur-[120px] mix-blend-screen" />
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div {...fadeIn}>
            <img 
              src="/feature-ai.png" 
              alt="AI Voice Chat" 
              className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
            />
          </motion.div>
          <motion.div {...fadeIn} className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif">A guide that listens.</h2>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              Feeling overwhelmed? Activate Talk Mode and simply speak. Our AI assistant is designed with a depression-friendly, non-judgmental tone. It doesn't push you to "hustle"—it helps you ground yourself, step by step.
            </p>
            <ul className="space-y-4 text-primary-foreground/90">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                Conversational Voice Mode
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                Empathetic, supportive responses
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                Available 24/7 in multiple languages
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4">Simple, honest pricing.</h2>
            <p className="text-lg text-primary/70">No hidden fees. Support mindful living.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-8 h-full border-border/50 bg-background flex flex-col shadow-none">
                <h3 className="text-2xl font-serif text-primary mb-2">Free</h3>
                <div className="text-4xl font-serif text-primary mb-6">₹0<span className="text-lg text-primary/50 font-sans">/forever</span></div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center gap-2 text-primary/80">
                    <Heart className="w-4 h-4 text-secondary" /> All 30+ daily tools
                  </li>
                  <li className="flex items-center gap-2 text-primary/80">
                    <Heart className="w-4 h-4 text-secondary" /> Multi-language support
                  </li>
                  <li className="flex items-center gap-2 text-primary/80">
                    <Heart className="w-4 h-4 text-secondary" /> 50 AI Voice Credits
                  </li>
                </ul>
                <Button variant="outline" className="w-full rounded-full h-12 text-primary border-primary/20 hover:bg-primary/5">
                  Start Free
                </Button>
              </Card>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 h-full border-secondary bg-secondary/5 flex flex-col relative overflow-hidden shadow-lg shadow-secondary/10">
                <div className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
                <h3 className="text-2xl font-serif text-primary mb-2">Yearly Calm</h3>
                <div className="text-4xl font-serif text-primary mb-6">₹399<span className="text-lg text-primary/50 font-sans">/year</span></div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center gap-2 text-primary/80">
                    <Heart className="w-4 h-4 text-secondary" /> Everything in Free
                  </li>
                  <li className="flex items-center gap-2 text-primary/80">
                    <Heart className="w-4 h-4 text-secondary" /> 6000 AI Voice Credits
                  </li>
                  <li className="flex items-center gap-2 text-primary/80">
                    <Heart className="w-4 h-4 text-secondary" /> Priority support
                  </li>
                </ul>
                <p className="text-sm text-primary/60 mb-4 text-center">Also available: Monthly ₹49 (500 credits), Quarterly ₹121 (1500 credits)</p>
                <Button className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                  Subscribe
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-primary">Frequently Asked Questions</h2>
          </motion.div>
          <motion.div {...fadeIn}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-border/50">
                <AccordionTrigger className="text-lg font-medium text-primary hover:text-secondary">Are my journal entries private?</AccordionTrigger>
                <AccordionContent className="text-primary/70 leading-relaxed text-base">
                  Yes. All your personal data, mood logs, and journal entries are stored locally on your device by default. We do not sell your data.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-border/50">
                <AccordionTrigger className="text-lg font-medium text-primary hover:text-secondary">How do AI credits work?</AccordionTrigger>
                <AccordionContent className="text-primary/70 leading-relaxed text-base">
                  1 credit equals roughly 1 minute of AI voice chat or 1 text interaction. The Free plan includes 50 credits to try it out. Subscribing gives you a fresh allowance based on your plan.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-border/50">
                <AccordionTrigger className="text-lg font-medium text-primary hover:text-secondary">What languages are supported?</AccordionTrigger>
                <AccordionContent className="text-primary/70 leading-relaxed text-base">
                  We currently support English, Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam, Odia, Punjabi, and 20+ other global languages for both the interface and AI chat.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center">
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-6xl font-serif text-primary">Find your center today.</h2>
          <p className="text-xl text-primary/70">Join thousands of others starting their day with clarity.</p>
          <Button size="lg" className="bg-secondary text-primary-foreground hover:bg-secondary/90 rounded-full text-lg h-16 px-10 group">
            <PlayCircle className="mr-2 w-6 h-6 group-hover:scale-110 transition-transform" />
            Download on Google Play
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xl font-serif text-primary">
            <Leaf className="w-5 h-5 text-secondary" />
            ZenSpace
          </div>
          <div className="flex gap-6 text-sm text-primary/60">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
          <div className="text-sm text-primary/40">
            © {new Date().getFullYear()} ZenSpace Tools. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
