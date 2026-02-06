"use client";
import React, { useState } from 'react';
import { Home, Search, PlusSquare, Type, Image, Link, Code, Mic, Video, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ currentUser }: { currentUser: any }) {
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const router = useRouter();

  const navItems = [
    { icon: <Home size={28} />, label: 'Home', path: '/' },
    { icon: <Search size={28} />, label: 'Search', path: '/search' },
  ];

  return (
    <>
      <aside style={styles.sidebar}>
        {/* 1. Profile Picture Icon */}
        <div 
          onClick={() => router.push('/profile')} 
          style={styles.profileIcon}
          title="My Profile"
        >
          {currentUser?.avatar_url ? (
            <img src={currentUser.avatar_url} alt="Profile" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {currentUser?.email?.[0].toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* 2. Navigation Buttons */}
        <nav style={styles.navGroup}>
          {navItems.map((item) => (
            <button key={item.label} onClick={() => router.push(item.path)} style={styles.iconBtn}>
              {item.icon}
            </button>
          ))}

          {/* 3. New Post Button */}
          <button onClick={() => setPostModalOpen(true)} style={styles.postBtn}>
            <PlusSquare size={32} color="#6366f1" />
          </button>
        </nav>
      </aside>

      {/* NEW POST MODAL */}
      {isPostModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>Create New Post</h3>
              <button onClick={() => setPostModalOpen(false)} style={styles.closeBtn}><X /></button>
            </div>
            
            <div style={styles.optionsGrid}>
              <PostOption icon={<Type />} label="Text Only" color="#f3f4f6" />
              <PostOption icon={<Image />} label="Photo / Video" color="#e0e7ff" />
              <PostOption icon={<Link />} label="Link" color="#fef3c7" />
              <PostOption icon={<Code />} label="Embed Code" color="#dcfce7" />
              <PostOption icon={<Mic />} label="Audio Message" color="#fee2e2" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PostOption({ icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <button style={{ ...styles.optionItem, backgroundColor: color }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '75px',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    backgroundColor: '#fff',
    borderRight: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0',
    zIndex: 100,
  },
  profileIcon: {
    cursor: 'pointer',
    marginBottom: '40px',
    transition: 'transform 0.2s',
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #6366f1',
  },
  avatarPlaceholder: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  navGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#4b5563',
  },
  postBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '15px',
    width: '90%',
    maxWidth: '400px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  optionItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '20px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  }
};