import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { Ground, GroundAvailability } from '../types';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useToast } from '../components/ui/Toast';
import {
  Plus,
  Edit2,
  Power,
  Eye,
  X,
  MapPin,
  Clock,
  IndianRupee,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

interface AdminGroundsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminGroundsPage: React.FC<AdminGroundsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [activeGroundId, setActiveGroundId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('1000');
  const [formOpening, setFormOpening] = useState('06:00');
  const [formClosing, setFormClosing] = useState('22:00');
  const [formAvailability, setFormAvailability] = useState<GroundAvailability>('AVAILABLE');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchGrounds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getGrounds();
      if (res.success && res.data) {
        setGrounds(res.data);
      } else {
        setError(res.message || 'Failed to load grounds.');
      }
    } catch {
      setError('Unable to connect to database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrounds();
  }, []);

  const openAddModal = () => {
    setModalMode('ADD');
    setActiveGroundId(null);
    setFormName('');
    setFormLocation('');
    setFormDescription('Championship cricket turf featuring floodlights, standard pitch, and player dugouts.');
    setFormPrice('1200');
    setFormOpening('06:00');
    setFormClosing('22:00');
    setFormAvailability('AVAILABLE');
    setFormImageUrl('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80');
    setIsModalOpen(true);
  };

  const openEditModal = (g: Ground) => {
    setModalMode('EDIT');
    setActiveGroundId(g.groundId);
    setFormName(g.groundName);
    setFormLocation(g.location);
    setFormDescription(g.description);
    setFormPrice(String(g.hourlyPrice));
    setFormOpening(g.openingTime);
    setFormClosing(g.closingTime);
    setFormAvailability(g.availability);
    setFormImageUrl(g.imageUrl);
    setIsModalOpen(true);
  };

  const handleSaveGround = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      groundName: formName.trim(),
      location: formLocation.trim(),
      description: formDescription.trim(),
      hourlyPrice: Number(formPrice),
      openingTime: formOpening.trim(),
      closingTime: formClosing.trim(),
      availability: formAvailability,
      imageUrl: formImageUrl.trim()
    };

    try {
      if (modalMode === 'ADD') {
        const res = await adminApi.addGround(payload);
        if (res.success) {
          showToast('Ground created successfully in database.', 'success');
          setIsModalOpen(false);
          await fetchGrounds();
        } else {
          showToast(res.message || 'Failed to add ground.', 'error');
        }
      } else if (activeGroundId) {
        const res = await adminApi.updateGround(activeGroundId, payload);
        if (res.success) {
          showToast('Ground details updated successfully.', 'success');
          setIsModalOpen(false);
          await fetchGrounds();
        } else {
          showToast(res.message || 'Failed to update ground.', 'error');
        }
      }
    } catch {
      showToast('Error saving ground records.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (ground: Ground) => {
    const nextStatus: GroundAvailability = ground.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      const res = await adminApi.updateGround(ground.groundId, { availability: nextStatus });
      if (res.success) {
        showToast(`Ground status changed to ${nextStatus}.`, 'info');
        await fetchGrounds();
      }
    } catch {
      showToast('Failed to toggle ground availability.', 'error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <AdminSidebar currentPath="/admin/grounds" onNavigate={onNavigate} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Turf Management
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
              Manage Cricket Grounds
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add new facilities, adjust pricing, manage operational schedules and availability status.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Ground</span>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading ground records from database..." fullPage />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchGrounds} />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Ground ID</th>
                    <th className="py-3.5 px-4">Ground Name</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Price / Hr</th>
                    <th className="py-3.5 px-4">Operating Hours</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grounds.map(g => (
                    <tr key={g.groundId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500">{g.groundId}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{g.groundName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{g.location}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900">₹{g.hourlyPrice}</td>
                      <td className="py-3.5 px-4 text-slate-600">{g.openingTime} – {g.closingTime}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={g.availability} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onNavigate(`/grounds/${g.groundId}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                            title="Preview Public Page"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(g)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                            title="Edit Ground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAvailability(g)}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              g.availability === 'AVAILABLE'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={g.availability === 'AVAILABLE' ? 'Deactivate Ground' : 'Activate Ground'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add / Edit Ground Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900">
                  {modalMode === 'ADD' ? 'Add New Cricket Ground' : 'Edit Ground Details'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGround} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ground Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Lords Cricket Arena"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      City / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Hourly Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={formPrice}
                      onChange={e => setFormPrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Opening Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formOpening}
                      onChange={e => setFormOpening(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Closing Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formClosing}
                      onChange={e => setFormClosing(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Availability *
                    </label>
                    <select
                      value={formAvailability}
                      onChange={e => setFormAvailability(e.target.value as GroundAvailability)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="UNAVAILABLE">UNAVAILABLE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={e => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description & Ground Facilities
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving to Database...' : modalMode === 'ADD' ? 'Create Ground' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
