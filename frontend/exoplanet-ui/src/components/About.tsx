import { Users, Github, Linkedin, GraduationCap, Telescope } from 'lucide-react'
import './About.css'

interface TeamMember {
  name: string
  role: string
  bio: string
  linkedin: string
  github: string
  skills: string[]
}

const teamMembers: TeamMember[] = [
  {
    name: 'Khomisani Murema Manganyi',
    role: 'Computer Science & Applied Statistics Student - UCT',
    bio: 'Passionate about machine learning and data science, with a strong foundation in statistical modeling and full-stack development.',
    linkedin: 'https://www.linkedin.com/in/findmuremahere/',
    github: 'https://github.com/murema-v3-exp',
    skills: ['Python', 'Machine Learning', 'XGBoost', 'Data Science', 'Full-Stack Development', 'R', 'CNN', 'Logistic Regression']
  },
  {
    name: 'Thando Mtshali',
    role: 'Computer Science & Computer Engineering Student - UCT',
    bio: 'Expertise in machine learning, data science, and full-stack development, with strong systems programming and embedded systems skills.',
    linkedin: 'https://www.linkedin.com/in/thando-magalela',
    github: 'https://github.com/thandomtshali',
    skills: ['React', 'TypeScript', 'Machine Learning', 'Data Science', 'Full-Stack Development', 'Embedded Systems', 'Python', 'C', 'C++', 'ARM64 ASM', 'Reinforcement Learning']
  }
]

function About() {
  return (
    <div className="about-page">
      <div className="about-header">
        <Telescope size={48} />
        <h2>About NASA Exoplanet Hunter</h2>
        <p className="about-subtitle">
          Advanced AI-powered system for detecting exoplanets from NASA mission data
        </p>
      </div>

      <div className="mission-section">
        <h3>
          <Telescope size={24} />
          Our Mission
        </h3>
      </div>

      <div className="team-section">
        <h3>
          <Users size={24} />
          Meet the Team
        </h3>
        <p className="team-intro">
          Students from the University of Cape Town building advanced ML systems for space exploration
        </p>

        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-card-header">
                <GraduationCap size={32} />
                <div className="team-card-title">
                  <h4>{member.name}</h4>
                  <p className="team-role">{member.role}</p>
                </div>
              </div>

              <p className="team-bio">{member.bio}</p>

              <div className="team-skills">
                {member.skills.map((skill, idx) => (
                  <span key={idx} className="skill-pill">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="team-links">
                <a 
                  href={member.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <Linkedin size={20} />
                  LinkedIn
                </a>
                <a 
                  href={member.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <Github size={20} />
                  GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="challenge-section">
        <h3>The Challenge</h3>
        <p>
          This project was developed as part of NASA's Space Apps Challenge 2025. 
          Our goal is to leverage machine learning to improve the detection and classification 
          of exoplanets from transit light curves observed by NASA's Kepler, K2, and TESS missions.
        </p>
        <div className="dataset-info">
          <h4>Datasets Used</h4>
          <ul>
            <li><strong>Kepler</strong> - Primary mission (2009-2013)</li>
            <li><strong>K2</strong> - Extended mission (2014-2018)</li>
            <li><strong>TESS</strong> - Transiting Exoplanet Survey Satellite</li>
          </ul>
        </div>
      </div>

      <div className="technology-section">
        <h3>Technology Stack</h3>
        <div className="tech-grid">
          <div className="tech-category">
            <h4>Machine Learning</h4>
            <p>XGBoost, CNN, Logistic Regression, Ensemble Methods</p>
          </div>
          <div className="tech-category">
            <h4>Frontend</h4>
            <p>React, TypeScript, Three.js, Vite</p>
          </div>
          <div className="tech-category">
            <h4>Backend</h4>
            <p>Python, FastAPI, Pandas, Scikit-learn</p>
          </div>
          <div className="tech-category">
            <h4>Data Processing</h4>
            <p>NumPy, Pandas, R, Statistical Analysis</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
