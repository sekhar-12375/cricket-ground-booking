import React, { useState, useEffect, useMemo } from 'react';
import { groundsApi } from '../services/api';
import { Ground } from '../types';
import { GroundCard } from '../components/grounds/GroundCard';
import { GroundFilter } from '../components/grounds/GroundFilter';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';

interface GroundsPageProps {
  onNavigate: (path: string) => void;
}

export const GroundsPage: React.FC<GroundsPageProps> = ({ onNavigate }) => {
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [location, setLocation] = useState<string>('ALL');
  const [availability, setAvailability] = useState<string>('ALL');
  const [sort, setSort] = useState<string>('default');

  const fetchGrounds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await groundsApi.getGrounds({
        search,
        location,
        availability,
        sort: sort !== 'default' ? sort : undefined
      });
      if (res.success && res.data) {
        setGrounds(res.data);
      } else {
        setError(res.message || 'Failed to load grounds.');
      }
    } catch {
      setError('Unable to load cricket grounds. Please check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrounds();
  }, [search, location, availability, sort]);

  // Extract unique locations for dropdown
  const availableLocations = useMemo(() => {
    return Array.from(new Set(grounds.map(g => g.location))).filter(Boolean);
  }, [grounds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Match Venues
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
          Available Cricket Grounds
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xl">
          Search turf grounds, filter by city or pricing, and check live time-slot availability for your team.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <GroundFilter
        search={search}
        onSearchChange={setSearch}
        location={location}
        onLocationChange={setLocation}
        availability={availability}
        onAvailabilityChange={setAvailability}
        sort={sort}
        onSortChange={setSort}
        availableLocations={availableLocations}
      />

      {/* Content State */}
      {loading ? (
        <LoadingSpinner label="Fetching available cricket grounds..." fullPage />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchGrounds} />
      ) : grounds.length === 0 ? (
        <EmptyState
          title="No cricket grounds found"
          description="Try adjusting your search criteria, city filter, or availability status."
          icon="search"
          actionText="Reset Filters"
          onAction={() => {
            setSearch('');
            setLocation('ALL');
            setAvailability('ALL');
            setSort('default');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {grounds.map(ground => (
            <GroundCard
              key={ground.groundId}
              ground={ground}
              onViewDetails={id => onNavigate(`/grounds/${id}`)}
              onBookNow={id => onNavigate(`/booking/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
