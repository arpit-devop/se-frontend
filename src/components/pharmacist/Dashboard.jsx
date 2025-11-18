import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingDown, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import api from '../../utils/api';
import { toast } from 'sonner';

const Dashboard = () => {
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
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const stats = [
    {
      title: 'Total Medicines',
      value: analytics?.total_medicines || 0,
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Low Stock Items',
      value: analytics?.low_stock_count || 0,
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      title: 'Expiring Soon',
      value: analytics?.expiring_soon_count || 0,
      icon: TrendingDown,
      color: 'yellow'
    },
    {
      title: 'Total Prescriptions',
      value: analytics?.total_prescriptions || 0,
      icon: FileText,
      color: 'green'
    },
  ];

  return (
    <div className="space-y-8" data-testid="pharmacist-dashboard">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your inventory overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 text-${stat.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Low Stock Items */}
      {analytics?.low_stock_items?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Items that need reordering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.low_stock_items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.generic_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {item.quantity} {item.unit}
                    </p>
                    <p className="text-xs text-gray-500">Reorder at: {item.reorder_level}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Soon */}
      {analytics?.expiring_soon_items?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expiring Soon</CardTitle>
            <CardDescription>Items expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.expiring_soon_items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Batch: {item.batch_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-600">
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
