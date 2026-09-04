import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import StaffDashboard from './components/StaffDashboard';
import TeamDashboard from './components/TeamDashboard';
import NewComplaintModal from './components/NewComplaintModal';
import TrackComplaintModal from './components/TrackComplaintModal';
import AllSolvedCases from './components/AllSolvedCases';
import Logo from './components/Logo';
import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'teams' | 'staff' | 'solved-cases'
  const [complaints, setComplaints] = useState([]);
  
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [isTrackComplaintOpen, setIsTrackComplaintOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initial load
  useEffect(() => {
    fetchComplaints();

    const interval = setInterval(() => {
      fetchComplaints(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const comps = await api.getComplaints();
      setComplaints(comps || []);
    } catch (err) {
      console.error('Complaints sync error:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Submit Complaint Handler (Guest citizen, name only)
  const handleCreateComplaint = async (data) => {
    const res = await api.createComplaint(data);
    await fetchComplaints(true);
    return res;
  };

  // Update Status Handler (Municipal Staff)
  const handleUpdateStatus = async (id, status) => {
    const res = await api.updateComplaintStatus(id, status);
    await fetchComplaints(true);
    return res;
  };

  // Delete Complaint Handler
  const handleDeleteComplaint = async (id) => {
    try {
      await api.deleteComplaint(id);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      await fetchComplaints(true);
    } catch (err) {
      console.error('Delete error:', err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigateHome={() => setCurrentView('home')}
        onNavigateTeams={() => setCurrentView('teams')}
        onOpenReport={() => setIsNewComplaintOpen(true)}
        onOpenTrack={() => setIsTrackComplaintOpen(true)}
        onOpenDashboard={() => setCurrentView('staff')}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomePage
            onOpenReport={() => setIsNewComplaintOpen(true)}
            onOpenTrack={() => setIsTrackComplaintOpen(true)}
            onNavigateTeams={() => setCurrentView('teams')}
            onViewAllSolved={() => setCurrentView('solved-cases')}
          />
        )}

        {currentView === 'solved-cases' && (
          <AllSolvedCases
            complaints={complaints}
            onNavigateHome={() => setCurrentView('home')}
          />
        )}

        {currentView === 'teams' && (
          <TeamDashboard />
        )}

        {currentView === 'staff' && (
          <StaffDashboard
            complaints={complaints}
            onUpdateStatus={handleUpdateStatus}
            onRefresh={() => fetchComplaints(false)}
            onDeleteComplaint={handleDeleteComplaint}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">Delhi • Ghaziabad • Noida Municipal Operations</span>
          </div>
          <p className="text-slate-400 font-medium text-center sm:text-right">
            Smart Municipal Infrastructure Management • Autonomous Water Operations
          </p>
        </div>
      </footer>

      {/* Citizen Report Modal */}
      <NewComplaintModal
        isOpen={isNewComplaintOpen}
        onClose={() => setIsNewComplaintOpen(false)}
        onSubmitComplaint={handleCreateComplaint}
      />

      {/* Track Complaint Modal */}
      <TrackComplaintModal
        isOpen={isTrackComplaintOpen}
        onClose={() => setIsTrackComplaintOpen(false)}
        complaints={complaints}
      />

    </div>
  );
}
