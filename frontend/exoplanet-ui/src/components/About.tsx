import React from 'react';
import { Users, Award, Rocket, Globe, Github, Linkedin } from 'lucide-react';
import './About.css';
import kMagodaImage from '../assets/K.Magoda.jpeg';
import tMtshaliImage from '../assets/T.Mtshali.jpeg';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  skills: string[];
  github?: string;
  linkedin?: string;
}

const About: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: "K. Magoda",
      role: "Data Scientist & ML Engineer",
      image: kMagodaImage,
      bio: "Passionate about using machine learning to unlock the mysteries of space. Specializes in exoplanet detection algorithms and deep space data analysis.",
      skills: ["Python", "TensorFlow", "XGBoost", "Data Analysis", "Astrophysics"],
      github: "#",
      linkedin: "#"
    },
    {
      name: "T. Mtshali",
      role: "Full-Stack Developer & UI/UX Designer",
      image: tMtshaliImage,
      bio: "Creates intuitive and beautiful interfaces for complex astronomical data. Expert in modern web technologies and space visualization systems.",
      skills: ["React", "TypeScript", "Three.js", "UI/UX Design", "WebGL"],
      github: "#",
      linkedin: "#"
    }
  ];

  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-header">
          <div className="about-title-section">
            <Rocket className="about-icon" />
            <h1>About NASA Exoplanet Hunter</h1>
            <p className="about-subtitle">Discovering new worlds through AI-powered detection</p>
          </div>
        </div>
        {/* Mission Section */}
        <section className="mission-section">
          <div className="mission-card">
            <Globe className="section-icon" />
            <h2>Our Mission</h2>
            <p>
              NASA Exoplanet Hunter leverages cutting-edge machine learning algorithms to analyze 
              astronomical data from NASA's Kepler, K2, and TESS missions. Our AI-powered system 
              helps identify potential exoplanets by detecting subtle transit patterns in stellar 
              brightness data, contributing to humanity's quest to discover Earth-like worlds 
              beyond our solar system.
            </p>
          </div>
        </section>

        {/* Technology Section */}
        <section className="tech-section">
          <div className="tech-card">
            <Award className="section-icon" />
            <h2>Technology Stack</h2>
            <div className="tech-grid">
              <div className="tech-item">
                <h3>Machine Learning</h3>
                <p>XGBoost ensemble models trained on NASA's exoplanet datasets</p>
              </div>
              <div className="tech-item">
                <h3>Frontend</h3>
                <p>React 19 with TypeScript and Three.js for 3D visualization</p>
              </div>
              <div className="tech-item">
                <h3>Backend</h3>
                <p>FastAPI with Python for high-performance ML inference</p>
              </div>
              <div className="tech-item">
                <h3>Data</h3>
                <p>NASA Exoplanet Archive with 9,500+ confirmed exoplanets</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <div className="team-header">
            <Users className="section-icon" />
            <h2>Meet Our Team</h2>
            <p>NASA Space Apps Challenge 2025 Participants</p>
          </div>

          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member-card">
                <div className="member-image-container">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="member-image"
                  />
                  <div className="member-overlay">
                    <div className="social-links">
                      {member.github && (
                        <a href={member.github} className="social-link" target="_blank" rel="noopener noreferrer">
                          <Github size={20} />
                        </a>
                      )}
                      {member.linkedin && (
                        <a href={member.linkedin} className="social-link" target="_blank" rel="noopener noreferrer">
                          <Linkedin size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="member-info">
                  <h3 className="member-name">{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <p className="member-bio">{member.bio}</p>
                  
                  <div className="member-skills">
                    {member.skills.map((skill, skillIndex) => (
                      <span key={skillIndex} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Challenge Info */}
        <section className="challenge-section">
          <div className="challenge-card">
            <h2>NASA Space Apps Challenge 2025</h2>
            <p>
              This project was developed as part of the NASA Space Apps Challenge, 
              the world's largest global hackathon focused on space exploration and 
              Earth observation. Our team tackled the challenge of making exoplanet 
              detection more accessible and interactive through modern web technologies 
              and machine learning.
            </p>
            <div className="challenge-stats">
              <div className="stat">
                <strong>9,564+</strong>
                <span>Exoplanet Candidates Analyzed</span>
              </div>
              <div className="stat">
                <strong>3</strong>
                <span>NASA Missions Integrated</span>
              </div>
              <div className="stat">
                <strong>82</strong>
                <span>Data Features Processed</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;