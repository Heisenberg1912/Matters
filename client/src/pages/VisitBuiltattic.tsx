import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Building2, Target, Users, Award, Mail, Phone, MapPin, ExternalLink, Linkedin, Twitter, Instagram, Facebook } from "lucide-react";

const companyStats = [
  { label: "Active Projects", value: "10,000+", color: "#cfe0ad" },
  { label: "Happy Clients", value: "5,200+", color: "#b8d4f1" },
  { label: "Contractors Network", value: "2,500+", color: "#f3c5a8" },
  { label: "Years of Excellence", value: "8+", color: "#e8b3d4" }
];

const teamMembers = [
  {
    id: "1",
    name: "Rajesh Malhotra",
    role: "Founder & CEO",
    description: "15+ years in construction tech, passionate about digitizing the industry",
    initials: "RM"
  },
  {
    id: "2",
    name: "Priya Sharma",
    role: "Head of Product",
    description: "Expert in building user-centric construction management tools",
    initials: "PS"
  },
  {
    id: "3",
    name: "Amit Kumar",
    role: "Chief Technology Officer",
    description: "Leading our engineering team with cutting-edge solutions",
    initials: "AK"
  },
  {
    id: "4",
    name: "Sneha Patel",
    role: "Head of Customer Success",
    description: "Ensuring every project runs smoothly with our platform",
    initials: "SP"
  }
];

const achievements = [
  {
    id: "1",
    title: "Best Construction Tech Platform 2025",
    organization: "India Construction Awards",
    year: "2025"
  },
  {
    id: "2",
    title: "Fastest Growing Startup",
    organization: "Tech Innovation Forum",
    year: "2024"
  },
  {
    id: "3",
    title: "Excellence in Digital Transformation",
    organization: "National Builder's Association",
    year: "2024"
  }
];

const socialLinks = [
  { name: "LinkedIn", icon: <Linkedin size={24} />, url: "https://linkedin.com/company/builtattic", color: "#0077b5" },
  { name: "Twitter", icon: <Twitter size={24} />, url: "https://twitter.com/builtattic", color: "#1da1f2" },
  { name: "Instagram", icon: <Instagram size={24} />, url: "https://instagram.com/builtattic", color: "#e4405f" },
  { name: "Facebook", icon: <Facebook size={24} />, url: "https://facebook.com/builtattic", color: "#1877f2" }
];

export default function VisitBuiltattic() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const navigate = useNavigate();

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center gap-6 rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-6 py-10 md:flex-nowrap md:px-10 lg:px-24 lg:py-16">
            <button onClick={() => navigate(-1)} className="text-white hover:text-[#cfe0ad]">
              <ArrowLeft size={24} />
            </button>

            <SheetTrigger asChild>
              <button type="button">
                <Avatar className="h-16 w-16 border-2 border-[#232323]">
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-3xl font-semibold">Oh Hi, Guest!</span>
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">About BuildAttic</span>
            </div>

            <div className="ml-auto flex rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-2 text-base font-semibold">
              {(["construction", "refurbish"] as const).map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setMode(state)}
                  className={`rounded-full px-6 py-2 transition ${
                    mode === state ? "bg-[var(--pill,#cfe0ad)] text-black" : "text-white"
                  }`}
                >
                  {state.toUpperCase()}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 pb-32 md:px-10 lg:px-24">
            <div className="mx-auto w-full max-w-6xl">
              <section className="mt-16">
                <Card className="border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-12">
                  <div className="flex items-center gap-8">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#cfe0ad] bg-[#0c0c0c]">
                      <Building2 size={64} className="text-[#cfe0ad]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-5xl font-black tracking-tight text-white">BuildAttic</h1>
                      <p className="mt-3 text-2xl text-[#cfe0ad]">Building the Future of Construction</p>
                      <p className="mt-4 text-xl leading-relaxed text-[#bdbdbd]">
                        Empowering contractors, builders, and project owners with smart construction management tools
                      </p>
                    </div>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Our Impact</h2>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {companyStats.map((stat) => (
                    <Card
                      key={stat.label}
                      className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-[#101010] p-10"
                    >
                      <div className="text-6xl font-black" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                      <p className="mt-4 text-center text-xl text-[#b9b9b9]">{stat.label}</p>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-20">
                <div className="flex items-center gap-6">
                  <Target size={64} className="text-[#cfe0ad]" strokeWidth={1.5} />
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Our Mission</h2>
                  </div>
                </div>
                <Card className="mt-8 border border-[#242424] bg-[#101010] p-10">
                  <p className="text-2xl leading-relaxed text-[#bdbdbd]">
                    To revolutionize the construction industry by providing innovative, easy-to-use technology that helps
                    builders and contractors manage their projects more efficiently, reduce costs, and deliver better results.
                  </p>
                  <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0c0c0c]">
                        <Building2 size={32} className="text-[#cfe0ad]" />
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">Simplify Construction</h3>
                      <p className="mt-2 text-lg text-[#8a8a8a]">
                        Make project management accessible to everyone, from large firms to independent contractors
                      </p>
                    </div>
                    <div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0c0c0c]">
                        <Users size={32} className="text-[#b8d4f1]" />
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">Connect People</h3>
                      <p className="mt-2 text-lg text-[#8a8a8a]">
                        Build a trusted network of contractors, suppliers, and project owners
                      </p>
                    </div>
                    <div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0c0c0c]">
                        <Award size={32} className="text-[#f3c5a8]" />
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">Deliver Excellence</h3>
                      <p className="mt-2 text-lg text-[#8a8a8a]">
                        Enable every project to be completed on time, on budget, and with quality
                      </p>
                    </div>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Meet Our Team</h2>
                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  {teamMembers.map((member) => (
                    <Card
                      key={member.id}
                      className="border border-[#2a2a2a] bg-[#101010] p-8"
                    >
                      <div className="flex items-start gap-6">
                        <Avatar className="h-24 w-24 border-2 border-[#2a2a2a]">
                          <AvatarFallback className="text-3xl">{member.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-white">{member.name}</h3>
                          <p className="mt-1 text-lg font-semibold text-[#cfe0ad]">{member.role}</p>
                          <p className="mt-3 text-base text-[#bdbdbd]">{member.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Awards & Recognition</h2>
                <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <div className="space-y-6">
                    {achievements.map((achievement, idx) => (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-6 py-6 ${
                          idx !== 0 ? "border-t border-[#2a2a2a]" : ""
                        }`}
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#cfe0ad] bg-[#0c0c0c]">
                          <Award size={40} className="text-[#cfe0ad]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-white">{achievement.title}</h3>
                          <p className="mt-2 text-lg text-[#bdbdbd]">{achievement.organization}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-5xl font-black text-[#cfe0ad]">{achievement.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Get In Touch</h2>
                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <Card className="border border-[#242424] bg-[#101010] p-10">
                    <h3 className="text-2xl font-semibold text-white">Contact Information</h3>
                    <div className="mt-8 space-y-6">
                      <div className="flex items-center gap-4">
                        <Mail size={32} className="text-[#cfe0ad]" />
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Email</p>
                          <p className="mt-1 text-xl text-white">contact@builtattic.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Phone size={32} className="text-[#b8d4f1]" />
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Phone</p>
                          <p className="mt-1 text-xl text-white">+91 98765 43210</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <MapPin size={32} className="text-[#f3c5a8]" />
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Address</p>
                          <p className="mt-1 text-xl text-white">
                            BuildAttic Technologies Pvt Ltd<br />
                            Bhopal, Madhya Pradesh, India
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="border border-[#242424] bg-[#101010] p-10">
                    <h3 className="text-2xl font-semibold text-white">Follow Us</h3>
                    <p className="mt-2 text-lg text-[#bdbdbd]">
                      Stay connected on social media for updates, tips, and industry news
                    </p>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      {socialLinks.map((social) => (
                        <button
                          key={social.name}
                          type="button"
                          className="flex items-center gap-4 rounded-[24px] border border-[#2a2a2a] bg-[#0c0c0c] p-6 transition hover:border-[#cfe0ad]"
                        >
                          <div style={{ color: social.color }}>
                            {social.icon}
                          </div>
                          <span className="text-xl font-semibold text-white">{social.name}</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              </section>

              <section className="mt-20">
                <Card className="border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-12">
                  <div className="text-center">
                    <Building2 size={80} className="mx-auto text-[#cfe0ad]" strokeWidth={1.5} />
                    <h3 className="mt-6 text-3xl font-bold text-white">Visit Our Website</h3>
                    <p className="mt-4 text-xl text-[#bdbdbd]">
                      Learn more about our services, pricing, and how MATTERS can transform your construction projects
                    </p>
                    <button
                      type="button"
                      className="mt-8 flex items-center gap-3 rounded-full bg-[#cfe0ad] px-10 py-5 text-xl font-semibold text-black transition hover:bg-[#d4e4b8] mx-auto"
                    >
                      www.builtattic.com
                      <ExternalLink size={24} />
                    </button>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <Card className="border border-[#242424] bg-[#101010] p-10 text-center">
                  <p className="text-xl text-[#bdbdbd]">
                    Have questions or want to partner with us?
                  </p>
                  <button
                    type="button"
                    className="mt-6 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-10 py-4 text-xl font-semibold text-white transition hover:border-[#cfe0ad]"
                  >
                    Contact Sales Team
                  </button>
                </Card>
              </section>
            </div>
          </div>
        </div>

        <SheetContent>
          <div className="space-y-10 text-2xl">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full text-left font-medium transition hover:text-[#cfe0ad]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </PhoneShell>
  );
}
