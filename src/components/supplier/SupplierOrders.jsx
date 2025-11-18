import React, { useState, useEffect } from 'react';
import { Package, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import api from '../../utils/api';
import { toast } from 'sonner';

const SupplierOrders = () => {
  const [reorders, setReorders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReorders();
  }, []);

  const fetchReorders = async () => {
    try {
      const response = await api.get('/reorders');
      setReorders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reorderId, status) => {
    try {
      await api.patch(`/reorders/${reorderId}/status?status=${status}`);
      toast.success('Order status updated');
      fetchReorders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      ordered: 'bg-purple-100 text-purple-800',
      received: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="supplier-orders">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reorder Requests</h1>
        <p className="text-gray-600 mt-2">Manage incoming reorder requests</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reorders.map((reorder) => (
          <Card key={reorder.id} data-testid="reorder-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{reorder.medicine_name}</CardTitle>
                <Badge className={getStatusColor(reorder.status)}>
                  {reorder.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Quantity:</span>
                    <span className="ml-2 font-medium">{reorder.current_quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requested Quantity:</span>
                    <span className="ml-2 font-medium">{reorder.requested_quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requested By:</span>
                    <span className="ml-2 font-medium">{reorder.requested_by}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(reorder.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {reorder.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateStatus(reorder.id, 'approved')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      data-testid="approve-order-button"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}

                {reorder.status === 'approved' && (
                  <Button
                    onClick={() => handleUpdateStatus(reorder.id, 'ordered')}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Mark as Ordered
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {reorders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No reorder requests</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupplierOrders;
