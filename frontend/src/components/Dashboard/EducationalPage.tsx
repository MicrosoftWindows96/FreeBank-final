import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import '../../styles/EducationalPage.css';

const EducationalPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('problem');
  const [blockchainAnimation, setBlockchainAnimation] = useState(false);
  const [userStoryIndex, setUserStoryIndex] = useState(0);
  
  
  const tabs = [
    { id: 'problem', icon: '🏦', label: t('education.problem_tab') },
    { id: 'solution', icon: '⛓️', label: t('education.solution_tab') },
    { id: 'app', icon: '📱', label: t('education.app_tab') },
    { id: 'use_cases', icon: '👥', label: t('education.use_cases_tab') }
  ];
  
  
  const userStories = [
    {
      avatar: '👨‍🌾',
      title: t('education.user1_title'),
      story: t('education.user1_story')
    },
    {
      avatar: '👩‍💼',
      title: t('education.user2_title'),
      story: t('education.user2_story')
    },
    {
      avatar: '👴',
      title: t('education.user3_title'),
      story: t('education.user3_story')
    },
    {
      avatar: '👨‍⚖️',
      title: t('education.user4_title'),
      story: t('education.user4_story')
    }
  ];

  useEffect(() => {
    
    document.body.style.overflow = 'hidden';
    document.body.style.maxWidth = '100%';
    
    return () => {
      
      document.body.style.overflow = '';
      document.body.style.maxWidth = '';
    };
  }, []);
  
  
  useEffect(() => {
    if (activeTab === 'solution') {
      const timer = setTimeout(() => {
        setBlockchainAnimation(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setBlockchainAnimation(false);
    }
  }, [activeTab]);
  
  
  const nextUserStory = () => {
    setUserStoryIndex((prev) => (prev + 1) % userStories.length);
  };
  
  const prevUserStory = () => {
    setUserStoryIndex((prev) => (prev - 1 + userStories.length) % userStories.length);
  };

  return (
    <div className="educational-page">
      <div className="educational-header">
        <h1>{t('education.title')}</h1>
        <p className="subtitle">{t('education.subtitle')}</p>
      </div>

      <div className="tabs-container">
        <div className="tabs-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="tab-content">
          {/* Problem Tab */}
          {activeTab === 'problem' && (
            <div className="tab-panel">
              <h2>{t('education.problem_title')}</h2>
              
              {/* Stat Box - Horizontal layout */}
              <div className="stat-box-horizontal">
                <div className="icon-container">
                  <span className="material-icon">🏦</span>
                </div>
                <div className="stat-info">
                  <h3>{t('education.stat1_title')}</h3>
                  <div className="stat-value">
                    <div className="stat-wrapper">
                      <span className="stat">90</span>
                      <span className="stat-percent">%</span>
                    </div>
                  </div>
                  <p>{t('education.stat1_description')}</p>
                </div>
              </div>
              
              {/* Content - Horizontal text layout */}
              <div className="horizontal-text-content">
                <p>{t('education.problem_p1')}</p>
                <p>{t('education.problem_p2')}</p>
                <ul className="bullet-list">
                  <li>{t('education.problem_bullet1')}</li>
                  <li>{t('education.problem_bullet2')}</li>
                  <li>{t('education.problem_bullet3')}</li>
                  <li>{t('education.problem_bullet4')}</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Solution Tab */}
          {activeTab === 'solution' && (
            <div className="tab-panel">
              <h2>{t('education.solution_title')}</h2>
              <div className="section-content">
                <div className="text-content">
                  <p>{t('education.solution_p1')}</p>
                  <p>{t('education.solution_p2')}</p>
                  <ul className="bullet-list">
                    <li>{t('education.solution_bullet1')}</li>
                    <li>{t('education.solution_bullet2')}</li>
                    <li>{t('education.solution_bullet3')}</li>
                    <li>{t('education.solution_bullet4')}</li>
                  </ul>
                </div>
              </div>
              
              <div className="blockchain-explanation">
                <h3>{t('education.blockchain_explanation_title') || 'How Blockchain Works'}</h3>
                <p>{t('education.blockchain_explanation') || 'A blockchain is a chain of blocks, where each block contains transaction data and is cryptographically linked to the previous block. Below is a simplified visualization:'}</p>
                
                <div className="blockchain-features">
                  <div className="blockchain-feature">
                    <span className="feature-icon">📦</span>
                    <h4>{t('education.blockchain_block_title')}</h4>
                    <p>{t('education.blockchain_block_description')}</p>
                  </div>
                  
                  <div className="blockchain-feature">
                    <span className="feature-icon">🔄</span>
                    <h4>{t('education.blockchain_chain_title')}</h4>
                    <p>{t('education.blockchain_chain_description')}</p>
                  </div>
                  
                  <div className="blockchain-feature">
                    <span className="feature-icon">🔒</span>
                    <h4>{t('education.blockchain_security_title')}</h4>
                    <p>{t('education.blockchain_security_description')}</p>
                  </div>
                </div>
              </div>
              
              <div className="blockchain-timeline">
                <div className="blockchain-block">
                  <div className="block-title">{t('education.block_title')} #1</div>
                  <div className="block-transactions">
                    <div className="block-transaction">"{t('education.transaction1')}"</div>
                    <div className="block-transaction">"{t('education.transaction2')}"</div>
                    <div className="block-transaction">"{t('education.transaction3')}"</div>
                  </div>
                  <div className="block-hash">Hash: 0x8f2a4d5e6b3c7f9a...</div>
                  <div className="block-caption">
                    <span className="caption-icon">ℹ️</span>
                    <p>{t('education.block1_explanation') || 'Genesis block: The first block in the chain has no previous block to reference. It establishes the foundation of the blockchain.'}</p>
                  </div>
                </div>
                
                <div className="blockchain-block">
                  <div className="block-title">{t('education.block_title')} #2</div>
                  <div className="block-transactions">
                    <div className="block-transaction">"{t('education.transaction4')}"</div>
                    <div className="block-transaction">"{t('education.transaction5')}"</div>
                    <div className="block-transaction">"{t('education.transaction6')}"</div>
                  </div>
                  <div className="block-hash">Hash: 0x2a4f7c9d8e6b3a5...</div>
                  <div className="block-caption">
                    <span className="caption-icon">ℹ️</span>
                    <p>{t('education.block2_explanation') || 'This block contains the hash of Block #1 (not shown here), linking them together. Changing Block #1 would invalidate this reference.'}</p>
                  </div>
                </div>
                
                <div className="blockchain-block">
                  <div className="block-title">{t('education.block_title')} #3</div>
                  <div className="block-transactions">
                    <div className="block-transaction">"{t('education.transaction2')}"</div>
                    <div className="block-transaction">"{t('education.transaction5')}"</div>
                    <div className="block-transaction">"{t('education.transaction3')}"</div>
                  </div>
                  <div className="block-hash">Hash: 0x3d7b8c9a2f1e5d4...</div>
                  <div className="block-caption">
                    <span className="caption-icon">ℹ️</span>
                    <p>{t('education.block3_explanation') || 'As more blocks are added, the earlier blocks become increasingly secure. Each new block reinforces the validity of previous blocks.'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* App Tab */}
          {activeTab === 'app' && (
            <div className="tab-panel">
              <h2>{t('education.app_title')}</h2>
              <div className="text-content">
                <p>{t('education.app_p1')}</p>
                <p>{t('education.app_p2')}</p>
              </div>
              <div className="app-features">
                <div className="feature" onClick={() => console.log('Feature clicked')}>
                  <div className="feature-icon">💳</div>
                  <h3>{t('education.feature1_title')}</h3>
                  <p>{t('education.feature1_description')}</p>
                </div>
                <div className="feature" onClick={() => console.log('Feature clicked')}>
                  <div className="feature-icon">🔒</div>
                  <h3>{t('education.feature2_title')}</h3>
                  <p>{t('education.feature2_description')}</p>
                </div>
                <div className="feature" onClick={() => console.log('Feature clicked')}>
                  <div className="feature-icon">⚡</div>
                  <h3>{t('education.feature3_title')}</h3>
                  <p>{t('education.feature3_description')}</p>
                </div>
                <div className="feature" onClick={() => console.log('Feature clicked')}>
                  <div className="feature-icon">🌐</div>
                  <h3>{t('education.feature4_title')}</h3>
                  <p>{t('education.feature4_description')}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Use Cases Tab */}
          {activeTab === 'use_cases' && (
            <div className="tab-panel">
              <h2>{t('education.use_cases_title')}</h2>
              <div className="user-story-slider">
                <div className="user-story-navigation">
                  <button 
                    className="nav-button prev" 
                    onClick={prevUserStory}
                    aria-label="Previous user story"
                  >
                    ←
                  </button>
                  <div className="slider-indicators">
                    {userStories.map((_, index) => (
                      <span 
                        key={index} 
                        className={`indicator ${index === userStoryIndex ? 'active' : ''}`}
                        onClick={() => setUserStoryIndex(index)}
                      />
                    ))}
                  </div>
                  <button 
                    className="nav-button next" 
                    onClick={nextUserStory}
                    aria-label="Next user story"
                  >
                    →
                  </button>
                </div>
                <div className="user-story current-story">
                  <div className="user-avatar">{userStories[userStoryIndex].avatar}</div>
                  <div className="story-content">
                    <h3>{userStories[userStoryIndex].title}</h3>
                    <p>{userStories[userStoryIndex].story}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate('/dashboard/settings')}>
          {t('education.back_to_settings')}
        </button>
      </div>
    </div>
  );
};

export default EducationalPage; 