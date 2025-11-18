import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import api from '../../utils/api';
import { toast } from 'sonner';

const ReportsAnalytics = () => {
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

  const generateReport = () => {
    toast.success('Report generation started');
    // In a real app, this would generate a comprehensive PDF report
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="reports-analytics">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive system reports</p>
        </div>
        <Button
          onClick={generateReport}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="generate-report-button"
        >
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Report</CardTitle>
            <CardDescription>Current stock status and valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Medicines:</span>
                <span className="font-semibold">{analytics?.total_medicines || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-semibold">${analytics?.total_value?.toFixed(2) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Low Stock Items:</span>
                <span className="font-semibold text-orange-600">{analytics?.low_stock_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expired Items:</span>
                <span className="font-semibold text-red-600">{analytics?.expired_count || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prescription Report</CardTitle>
            <CardDescription>Prescription processing statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Prescriptions:</span>
                <span className="font-semibold">{analytics?.total_prescriptions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recent Prescriptions:</span>
                <span className="font-semibold">{analytics?.recent_prescriptions?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reorder Report</CardTitle>
            <CardDescription>Pending and completed reorders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Reorders:</span>
                <span className="font-semibold text-orange-600">{analytics?.pending_reorders_count || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Medicines by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics?.category_distribution || {}).map(([category, count]) => (
                <div key={category} className="flex justify-between">
                  <span className="text-gray-600">{category}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
