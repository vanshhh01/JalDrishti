import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function GisMap({
  complaints = [],
  teams = [],
  onSelectComplaint,
  onSelectTeam,
  selectedComplaintId
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // 1. Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [28.6350, 77.2650], // Centered between Delhi, Ghaziabad & Noida
        zoom: 11,
        minZoom: 4,
        maxZoom: 22,
        zoomControl: false
      });

      // High-resolution OpenStreetMap tile layer with high zoom support
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 22,
        maxNativeZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    } catch (err) {
      console.error('GisMap initialization error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // 2. Update Markers dynamically WITHOUT destroying map or resetting zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // 1. RENDER CITIZEN COMPLAINT PINS (Active Only - Exclude Solved)
    if (Array.isArray(complaints)) {
      complaints
        .filter((c) => c && c.status !== 'Resolved')
        .forEach((comp) => {
          if (!comp || typeof comp.latitude !== 'number' || typeof comp.longitude !== 'number') return;

          let dotColor = '#10b981'; // Low: Emerald
          let glowColor = 'rgba(16, 185, 129, 0.4)';
          let size = 16;

          if (comp.urgency === 'Critical') {
            dotColor = '#ef4444';
            glowColor = 'rgba(239, 68, 68, 0.5)';
            size = 20;
          } else if (comp.urgency === 'High') {
            dotColor = '#f97316';
            glowColor = 'rgba(249, 115, 22, 0.45)';
            size = 18;
          } else if (comp.urgency === 'Medium') {
            dotColor = '#eab308';
            glowColor = 'rgba(234, 179, 8, 0.45)';
            size = 16;
          }

          const isSelected = selectedComplaintId === comp.id;

          const dotIcon = L.divIcon({
            className: 'map-complaint-marker',
            html: `
              <div style="
                width: ${isSelected ? size + 6 : size}px;
                height: ${isSelected ? size + 6 : size}px;
                background-color: ${dotColor};
                border: 2.5px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 10px ${glowColor}, 0 2px 5px rgba(0,0,0,0.3);
                transition: all 0.2s;
                cursor: pointer;
              "></div>
            `,
            iconSize: [size + 6, size + 6],
            iconAnchor: [(size + 6) / 2, (size + 6) / 2]
          });

          const marker = L.marker([comp.latitude, comp.longitude], { icon: dotIcon })
            .addTo(markersGroup);

          marker.on('click', () => {
            if (onSelectComplaint) onSelectComplaint(comp);
          });

          const safeId = comp.id ? comp.id.slice(0, 8).toUpperCase() : 'N/A';

          marker.bindPopup(`
            <div style="font-family: inherit; min-width: 230px; padding: 2px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-family: monospace; font-size: 11px; color: #0284c7; font-weight: 800;">
                  #JD-${safeId}
                </span>
                <span style="font-size: 10px; font-weight: 800; color: ${dotColor}; text-transform: uppercase; background: #f8fafc; padding: 2px 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  ${comp.urgency || 'Normal'}
                </span>
              </div>
              <h4 style="font-size: 12px; font-weight: 800; margin: 2px 0; color: #0f172a;">
                🏢 ${comp.department || 'General'}
              </h4>
              <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-clamp: 2; line-height: 1.4;">
                ${comp.description || ''}
              </p>
              ${comp.assignedTeam ? `
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 3px 6px; border-radius: 6px; font-size: 10px; color: #0369a1; margin-bottom: 6px; font-weight: 600;">
                  🚚 Dispatched: ${comp.assignedTeam.name} (${comp.assignedTeam.city})
                </div>
              ` : ''}
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 5px;">
                <span>Status: <strong style="color: #0f172a;">${comp.status || 'Assigned'}</strong></span>
                <span style="color: #0284c7; font-weight: 700;">Click to Inspect</span>
              </div>
            </div>
          `);
        });
    }

    // 2. RENDER STATIONED MUNICIPAL FIELD TEAMS (DELHI, GZB, NOIDA)
    if (Array.isArray(teams)) {
      teams.forEach((team) => {
        if (!team || typeof team.latitude !== 'number' || typeof team.longitude !== 'number') return;

        const isAvailable = team.status === 'Available';
        const badgeBg = isAvailable ? '#0284c7' : '#0f172a'; // Cyan or Deep Navy

        const teamIcon = L.divIcon({
          className: 'map-team-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              background: ${badgeBg};
              color: #ffffff;
              border: 2.5px solid #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4), 0 2px 4px rgba(0,0,0,0.2);
              font-size: 15px;
              cursor: pointer;
              transform: scale(1);
              transition: transform 0.2s;
            " title="${team.name}">
              🚚
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([team.latitude, team.longitude], { icon: teamIcon })
          .addTo(markersGroup);

        marker.on('click', () => {
          if (onSelectTeam) onSelectTeam(team);
        });

        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 240px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">
                MUNICIPAL FIELD UNIT
              </span>
              <span style="font-size: 10px; font-weight: 800; color: ${isAvailable ? '#059669' : '#d97706'}; background: #f8fafc; padding: 2px 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
                ● ${team.status || 'Available'}
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 800; margin: 2px 0; color: #0f172a;">
              ${team.name}
            </h4>
            <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0;">
              📍 ${team.area}, <strong>${team.city}</strong>
            </p>
            <div style="background: #f1f5f9; padding: 4px 8px; border-radius: 8px; font-size: 11px; color: #334155; margin-bottom: 6px;">
              <span>Specialty: <strong>${team.department}</strong></span><br/>
              <span>Contact: <strong>${team.phone || 'Toll-free 1916'}</strong></span>
            </div>
            <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              Stationed GPS: ${team.latitude.toFixed(4)}, ${team.longitude.toFixed(4)}
            </div>
          </div>
        `);
      });
    }
  }, [complaints, teams, selectedComplaintId, onSelectComplaint, onSelectTeam]);

  return (
    <div className="relative z-0 isolate w-full h-[520px] sm:h-[580px] min-h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" style={{ height: '100%', minHeight: '520px' }} />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[20] p-3 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs shadow-lg space-y-2 pointer-events-auto max-w-xs">
        <div className="border-b border-slate-100 pb-1.5">
          <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
            Municipal Fleet Units
          </span>
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <span className="w-5 h-5 rounded-lg bg-sky-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              🚚
            </span>
            <span>Stationed Field Team (Delhi/GZB/Noida)</span>
          </div>
        </div>

        <div>
          <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
            Incident Priority
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-xs" />
              <span className="text-slate-700 font-medium">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white shadow-xs" />
              <span className="text-slate-700 font-medium">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-white shadow-xs" />
              <span className="text-slate-700 font-medium">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-xs" />
              <span className="text-slate-700 font-medium">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
