import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { toast } from 'sonner';

const DemandForecasting = () => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);

  useEffect(() => {
    fetchForecasts();
  }, []);

  const fetchForecasts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/forecast');
      setForecasts(response.data.forecasts || []);
      setGeneratedAt(response.data.generated_at);
      toast.success('Forecast data loaded');
    } catch (error) {
      toast.error('Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (forecasts.length === 0) {
      toast.error('No data to download');
      return;
    }

    const headers = ['Medicine Name', 'Current Quantity', 'Reorder Level', '30 Days Forecast', '60 Days Forecast', '90 Days Forecast', 'Recommendation'];
    const csvData = forecasts.map(f => [
      f.medicine_name,
      f.current_quantity,
      f.reorder_level,
      f.forecast_30_days,
      f.forecast_60_days,
      f.forecast_90_days,
      f.reorder_recommendation
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demand_forecast_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Forecast downloaded');
  };

  const getRecommendationColor = (recommendation) => {
    return recommendation === 'High' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
  };

  if (loading && forecasts.length === 0) {
    return <div className="text-center py-12">Generating forecasts...</div>;
  }

  return (
    <div className="space-y-6" data-testid="demand-forecasting">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-600 mt-2">ML-powered inventory predictions</p>
          {generatedAt && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchForecasts}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="refresh-forecast-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={downloadCSV}
            variant="outline"
            data-testid="download-forecast-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">High Priority Reorders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {forecasts.filter(f => f.reorder_recommendation === 'High').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Normal Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {forecasts.filter(f => f.reorder_recommendation === 'Normal').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Medicines Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {forecasts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Charts */}
      {forecasts.slice(0, 3).map((forecast, idx) => {
        const chartData = [
          { period: 'Current', value: forecast.current_quantity },
          { period: '30 Days', value: forecast.forecast_30_days },
          { period: '60 Days', value: forecast.forecast_60_days },
          { period: '90 Days', value: forecast.forecast_90_days },
        ];

        return (
          <Card key={idx}>
            <CardHeader>
              <CardTitle>{forecast.medicine_name}</CardTitle>
              <CardDescription>
                Current: {forecast.current_quantity} | Reorder Level: {forecast.reorder_level}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Forecast Data</CardTitle>
          <CardDescription>90-day demand predictions for all medicines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicine</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Current</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">30 Days</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">60 Days</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">90 Days</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((forecast, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{forecast.medicine_name}</td>
                    <td className="py-3 px-4">{forecast.current_quantity}</td>
                    <td className="py-3 px-4">{forecast.forecast_30_days}</td>
                    <td className="py-3 px-4">{forecast.forecast_60_days}</td>
                    <td className="py-3 px-4">{forecast.forecast_90_days}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(forecast.reorder_recommendation)}`}>
                        {forecast.reorder_recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {forecasts.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No forecast data available. Click Refresh to generate.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DemandForecasting;
