import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import api from '../../utils/api';
import { toast } from 'sonner';

const ExpiryAlerts = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="expiry-alerts">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expiry Alerts</h1>
        <p className="text-gray-600 mt-2">Monitor medicines nearing expiration</p>
      </div>

      {/* Expired Items */}
      {analytics?.expired_items?.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Expired Items ({analytics.expired_items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {analytics.expired_items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.generic_name}</p>
                    <p className="text-xs text-gray-500 mt-1">Batch: {item.batch_number}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-600 text-white mb-2">Expired</Badge>
                    <p className="text-sm text-red-600 font-medium">
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} {item.unit} remaining
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Soon */}
      {analytics?.expiring_soon_items?.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Expiring Soon ({analytics.expiring_soon_items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {analytics.expiring_soon_items.map((item, idx) => {
                const daysLeft = getDaysUntilExpiry(item.expiry_date);
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.generic_name}</p>
                      <p className="text-xs text-gray-500 mt-1">Batch: {item.batch_number}</p>
                      <p className="text-xs text-gray-500">Location: {item.location}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-600 text-white mb-2">
                        {daysLeft} days left
                      </Badge>
                      <p className="text-sm text-yellow-600 font-medium">
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {(!analytics?.expired_items?.length && !analytics?.expiring_soon_items?.length) && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No expiry alerts at this time</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpiryAlerts;
