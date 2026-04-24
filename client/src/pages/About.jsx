import React from "react";
import { FaHandshake, FaLeaf, FaAward, FaUsers, FaMapMarkedAlt, FaChartLine, FaStar, FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";

const About = () => {
  const values = [
    { title: "🤝 Customer First", desc: "Our customers are at the heart of everything we do, ensuring satisfaction at every step.", icon: <FaHandshake /> },
    { title: "🌱 Sustainable Packaging", desc: "We use eco-friendly materials to reduce our carbon footprint and protect the planet.", icon: <FaLeaf /> },
    { title: "💯 Quality Assurance", desc: "Every product is rigorously tested to meet our high standards of quality and durability.", icon: <FaAward /> },
  ];

  const teamMembers = [
    { name: "John Doe", role: "Founder & CEO", photo: "https://i.pravatar.cc/150?u=john", social: { twitter: "#", linkedin: "#" } },
    { name: "Jane Smith", role: "Chief Designer", photo: "https://i.pravatar.cc/150?u=jane", social: { twitter: "#", linkedin: "#" } },
    { name: "Michael Ross", role: "Head of Tech", photo: "https://i.pravatar.cc/150?u=mike", social: { twitter: "#", linkedin: "#" } },
    { name: "Sarah Connor", role: "Ops Manager", photo: "https://i.pravatar.cc/150?u=sarah", social: { twitter: "#", linkedin: "#" } },
  ];

  const stats = [
    { label: "Happy Customers", value: "50K+", icon: <FaUsers /> },
    { label: "Products Sold", value: "10K+", icon: <FaChartLine /> },
    { label: "Average Rating", value: "4.8★", icon: <FaStar /> },
    { label: "Cities Served", value: "100+", icon: <FaMapMarkedAlt /> },
  ];

  return (
    <div className="bg-surface-2 min-h-screen transition-colors duration-400">
      {/* Hero Section */}
      <section className="bg-surface-3 text-primary-text py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 animate-pulse-slow" />
        <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 italic tracking-tight">About ElectroHub</h1>
            <p className="text-lg md:text-xl text-gray-400 font-bold max-w-2xl mx-auto">
                Your Trusted Online Store Since 2020. Delivering premium electronics to your doorstep.
            </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">Our Journey</div>
            <h2 className="text-3xl md:text-5xl font-black text-primary-text leading-tight">Driven by a Passion for Pure Technology.</h2>
            <p className="text-muted-text leading-relaxed text-lg">
                Founded in 2020, ElectroHub started with a simple mission: to bridge the gap between premium global brands and Indian households. We believe that technology should be accessible, reliable, and delightful.
            </p>
            <p className="text-muted-text leading-relaxed">
                Over the past few years, we've grown from a small specialized store to a pan-India electronics hub. Our commitment to authentic products and lightning-fast logistics remains our top priority.
            </p>
            <div className="pt-4">
                <div className="flex items-center gap-4 p-6 bg-surface-1 rounded-3xl border-l-4 border-primary border-theme">
                    <div className="text-3xl text-primary"><FaChartLine /></div>
                    <div>
                        <h4 className="font-bold text-primary-text">Our Mission</h4>
                        <p className="text-sm text-muted-text">To provide a seamless shopping experience with a focus on trust and transparency.</p>
                    </div>
                </div>
            </div>
          </div>
          <div className="relative">
             <div className="absolute -inset-4 bg-primary/5 rounded-[40px] -rotate-3" />
             <img 
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Our Team Working" 
                className="relative rounded-[40px] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" 
             />
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-surface-2">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-primary-text mb-4">Core Values</h2>
                <p className="text-muted-text">The pillars that define our service standards.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {values.map((v, i) => (
                    <div key={i} className="bg-surface-1 p-10 rounded-[32px] border border-theme shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all transition-duration-300">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-3xl mb-6">
                            {v.icon}
                        </div>
                        <h4 className="text-xl font-bold text-primary-text mb-4">{v.title}</h4>
                        <p className="text-muted-text leading-relaxed">{v.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-surface-3 text-primary-text text-center">
        <div className="container mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((s, i) => (
                <div key={i} className="space-y-2">
                    <div className="text-primary text-3xl mb-2 flex justify-center">{s.icon}</div>
                    <div className="text-4xl font-black italic">{s.value}</div>
                    <div className="text-gray-400 font-bold text-sm tracking-widest uppercase">{s.label}</div>
                </div>
            ))}
        </div>
      </section>

      {/* Team Members Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary-text mb-4">Meet the Visionaries</h2>
            <p className="text-muted-text">The expert team behind our success.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((m, i) => (
                <div key={i} className="group flex flex-col items-center">
                    <div className="relative w-full aspect-square mb-6 overflow-hidden rounded-[40px]">
                        <img 
                            src={m.photo} 
                            alt={m.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                        />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <a href={m.social.twitter} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all"><FaTwitter /></a>
                            <a href={m.social.linkedin} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all"><FaLinkedin /></a>
                        </div>
                    </div>
                    <h5 className="text-xl font-bold text-primary-text mb-1">{m.name}</h5>
                    <p className="text-primary font-black uppercase text-[10px] tracking-widest">{m.role}</p>
                </div>
            ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 container mx-auto px-4">
          <div className="bg-primary rounded-[40px] p-12 text-center text-white space-y-6">
              <h2 className="text-3xl md:text-5xl font-black italic uppercase">Want to Join Us?</h2>
              <p className="text-white/80 max-w-xl mx-auto font-bold text-lg">We are always looking for passionate tech enthusiasts to join our growing team.</p>
              <button className="bg-white text-primary px-12 py-4 rounded-2xl font-black shadow-2xl transition-all active:scale-95 leading-none">VIEW CAREERS</button>
          </div>
      </section>
    </div>
  );
};

export default About;
